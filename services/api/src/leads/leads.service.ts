import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.lead.create({
      data,
      include: {
        createdBy: true,
        assignedTo: true,
      },
    });
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
    const result = await this.prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: { assignedToId },
    });

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
    const header = 'ID,First Name,Last Name,Email,Phone,Status,Source,Timezone,Created By,Assigned To,Created At,Notes\n';

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
        lead.status || '',
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
}
