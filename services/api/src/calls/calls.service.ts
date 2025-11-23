import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { DailyService } from '../common/daily/daily.service';
import { CallStatus } from '@prisma/client';

@Injectable()
export class CallsService {
  constructor(
    private prisma: PrismaService,
    private dailyService: DailyService,
  ) {}

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

  async startCall(id: string, userId?: string) {
    const call = await this.findById(id);

    if (!call) {
      throw new Error('Call not found');
    }

    // Create Daily.co room
    const room = await this.dailyService.createRoom({
      name: `call-${id}`,
      privacy: 'private',
      properties: {
        enable_chat: true,
        enable_screenshare: true,
        enable_recording: 'cloud',
        max_participants: 10,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 4), // 4 hours
      },
    });

    // Create meeting token for host
    const token = userId
      ? await this.dailyService.createMeetingToken(room.name, {
          user_id: userId,
          is_owner: true,
          enable_recording: true,
          start_cloud_recording: false,
        })
      : null;

    return this.prisma.call.update({
      where: { id },
      data: {
        status: CallStatus.IN_PROGRESS,
        startedAt: new Date(),
        dailyRoomName: room.name,
        dailyRoomUrl: room.url,
      },
      include: {
        host: true,
        booking: true,
        deal: true,
      },
    });
  }

  async getMeetingToken(callId: string, userId: string, userName?: string) {
    const call = await this.findById(callId);

    if (!call || !call.dailyRoomName) {
      throw new Error('Call not found or not started');
    }

    return this.dailyService.createMeetingToken(call.dailyRoomName, {
      user_id: userId,
      user_name: userName,
      is_owner: call.hostId === userId,
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
