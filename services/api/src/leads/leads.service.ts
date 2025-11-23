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
}
