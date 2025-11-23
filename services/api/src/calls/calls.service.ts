import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CallStatus } from '@prisma/client';

@Injectable()
export class CallsService {
  constructor(private prisma: PrismaService) {}

  async createCall(data: {
    workspaceId: string;
    hostId: string;
    bookingId?: string;
    dealId?: string;
  }) {
    return this.prisma.call.create({
      data: {
        ...data,
        status: CallStatus.SCHEDULED,
      },
      include: {
        host: true,
        booking: true,
        deal: true,
      },
    });
  }

  async startCall(id: string) {
    // TODO: Integrate with Daily.co to create room
    return this.prisma.call.update({
      where: { id },
      data: {
        status: CallStatus.IN_PROGRESS,
        startedAt: new Date(),
        dailyRoomName: `call-${id}`,
        dailyRoomUrl: `https://closeros.daily.co/call-${id}`,
      },
    });
  }

  async endCall(id: string) {
    const call = await this.prisma.call.findUnique({ where: { id } });
    const duration = call?.startedAt
      ? Math.floor((Date.now() - call.startedAt.getTime()) / 1000)
      : 0;

    return this.prisma.call.update({
      where: { id },
      data: {
        status: CallStatus.COMPLETED,
        endedAt: new Date(),
        duration,
      },
    });
  }

  async findByWorkspace(workspaceId: string) {
    return this.prisma.call.findMany({
      where: { workspaceId },
      include: {
        host: true,
        booking: true,
        deal: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.call.findUnique({
      where: { id },
      include: {
        host: true,
        booking: true,
        deal: true,
      },
    });
  }
}
