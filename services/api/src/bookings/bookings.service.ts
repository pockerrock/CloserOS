import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    workspaceId: string;
    leadId: string;
    scheduledAt: Date;
    duration?: number;
    timezone?: string;
  }) {
    const bookingToken = randomBytes(16).toString('hex');

    return this.prisma.booking.create({
      data: {
        ...data,
        bookingToken,
        duration: data.duration || 60,
        timezone: data.timezone || 'UTC',
      },
      include: {
        lead: true,
      },
    });
  }

  async findByWorkspace(workspaceId: string) {
    return this.prisma.booking.findMany({
      where: { workspaceId },
      include: {
        lead: true,
        call: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        lead: true,
        call: true,
      },
    });
  }

  async findByToken(token: string) {
    return this.prisma.booking.findUnique({
      where: { bookingToken: token },
      include: {
        lead: true,
      },
    });
  }

  async confirm(id: string) {
    return this.prisma.booking.update({
      where: { id },
      data: { confirmed: true },
    });
  }

  async cancel(id: string, reason?: string) {
    return this.prisma.booking.update({
      where: { id },
      data: {
        cancelled: true,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });
  }
}
