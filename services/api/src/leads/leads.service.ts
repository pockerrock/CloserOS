import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ActivityService } from '../common/activity/activity.service';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async create(data: {
    workspaceId: string;
    createdById: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    timezone?: string;
    source?: string;
    assignedToId?: string;
    notes?: string;
  }) {
    const lead = await this.prisma.lead.create({
      data,
      include: {
        createdBy: true,
        assignedTo: true,
      },
    });

    // Log activity
    await this.activityService.logLeadCreated(
      data.workspaceId,
      data.createdById,
      lead.id,
      `${lead.firstName} ${lead.lastName}`,
    );

    return lead;
  }

  async findByWorkspace(workspaceId: string) {
    return this.prisma.lead.findMany({
      where: { workspaceId },
      include: {
        createdBy: true,
        assignedTo: true,
        deals: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: {
        createdBy: true,
        assignedTo: true,
        deals: true,
        bookings: true,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.lead.update({
      where: { id },
      data,
      include: {
        createdBy: true,
        assignedTo: true,
      },
    });
  }

  async delete(id: string) {
    await this.prisma.lead.delete({ where: { id } });
    return { message: 'Lead deleted successfully' };
  }

  async search(
    workspaceId: string,
    filters: {
      search?: string;
      status?: string;
      source?: string;
    },
  ) {
    const { search, status, source } = filters;

    const where: any = { workspaceId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    return this.prisma.lead.findMany({
      where,
      include: {
        createdBy: true,
        assignedTo: true,
        deals: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async bulkAssign(leadIds: string[], assignedToId: string) {
    // Get leads before update to log activity
    const leads = await this.prisma.lead.findMany({
      where: { id: { in: leadIds } },
      include: { assignedTo: true },
    });

    const result = await this.prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: { assignedToId },
    });

    // Get assigned user info
    const assignedTo = await this.prisma.user.findUnique({
      where: { id: assignedToId },
    });

    // Log activity for each lead
    if (leads.length > 0 && assignedTo) {
      for (const lead of leads) {
        await this.activityService.logLeadAssigned(
          lead.workspaceId,
          assignedToId,
          lead.id,
          `${lead.firstName} ${lead.lastName}`,
          `${assignedTo.firstName} ${assignedTo.lastName}`,
        );
      }
    }

    return {
      message: `${result.count} leads assigned successfully`,
      count: result.count,
    };
  }

  async bulkUpdate(leadIds: string[], updates: any) {
    const result = await this.prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: updates,
    });

    return {
      message: `${result.count} leads updated successfully`,
      count: result.count,
    };
  }

  async bulkDelete(leadIds: string[]) {
    const result = await this.prisma.lead.deleteMany({
      where: { id: { in: leadIds } },
    });

    return {
      message: `${result.count} leads deleted successfully`,
      count: result.count,
    };
  }

  async exportToCSV(workspaceId: string): Promise<string> {
    const leads = await this.prisma.lead.findMany({
      where: { workspaceId },
      include: {
        createdBy: true,
        assignedTo: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // CSV header
    const header = 'ID,First Name,Last Name,Email,Phone,Source,Timezone,Created By,Assigned To,Created At,Notes\n';

    // CSV rows
    const rows = leads.map((lead) => {
      const createdBy = lead.createdBy ? `${lead.createdBy.firstName} ${lead.createdBy.lastName}` : '';
      const assignedTo = lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '';
      const notes = (lead.notes || '').replace(/"/g, '""').replace(/\n/g, ' ');

      return [
        lead.id,
        lead.firstName,
        lead.lastName,
        lead.email,
        lead.phone || '',
        lead.source || '',
        lead.timezone || '',
        createdBy,
        assignedTo,
        lead.createdAt.toISOString(),
        `"${notes}"`,
      ].join(',');
    }).join('\n');

    return header + rows;
  }

  async importFromCSV(csvContent: string, workspaceId: string, createdById: string) {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file is empty or invalid');
    }

    const header = lines[0].toLowerCase();
    const rows = lines.slice(1);

    // Parse header to find column indices
    const headers = header.split(',').map(h => h.trim());
    const getColumnIndex = (name: string) => headers.findIndex(h => h.includes(name));

    const firstNameIdx = getColumnIndex('first');
    const lastNameIdx = getColumnIndex('last');
    const emailIdx = getColumnIndex('email');
    const phoneIdx = getColumnIndex('phone');
    const sourceIdx = getColumnIndex('source');
    const notesIdx = getColumnIndex('notes');

    if (firstNameIdx === -1 || lastNameIdx === -1 || emailIdx === -1) {
      throw new Error('CSV must contain at least: First Name, Last Name, and Email columns');
    }

    const results = {
      total: rows.length,
      imported: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.trim()) continue;

      try {
        // Parse CSV row (handle quoted values)
        const values = this.parseCSVRow(row);

        const firstName = values[firstNameIdx]?.trim();
        const lastName = values[lastNameIdx]?.trim();
        const email = values[emailIdx]?.trim();
        const phone = phoneIdx !== -1 ? values[phoneIdx]?.trim() : undefined;
        const source = sourceIdx !== -1 ? values[sourceIdx]?.trim() : undefined;
        const notes = notesIdx !== -1 ? values[notesIdx]?.trim() : undefined;

        if (!firstName || !lastName || !email) {
          results.errors.push(`Row ${i + 2}: Missing required fields (firstName, lastName, or email)`);
          results.failed++;
          continue;
        }

        // Validate email format
        if (!email.includes('@')) {
          results.errors.push(`Row ${i + 2}: Invalid email format: ${email}`);
          results.failed++;
          continue;
        }

        // Check if lead already exists
        const existing = await this.prisma.lead.findFirst({
          where: {
            workspaceId,
            email,
          },
        });

        if (existing) {
          results.errors.push(`Row ${i + 2}: Lead with email ${email} already exists`);
          results.failed++;
          continue;
        }

        // Create lead
        await this.create({
          workspaceId,
          createdById,
          firstName,
          lastName,
          email,
          phone,
          source,
          notes,
        });

        results.imported++;
      } catch (error) {
        results.errors.push(`Row ${i + 2}: ${error.message}`);
        results.failed++;
      }
    }

    return results;
  }

  private parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
        } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }
}
