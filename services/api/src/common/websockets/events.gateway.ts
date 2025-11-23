import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private workspaceRooms = new Map<string, Set<string>>(); // workspaceId -> Set of socket IDs

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const workspaceId = payload.workspaceId;

      // Store workspace association
      client.data.workspaceId = workspaceId;
      client.data.userId = payload.sub;

      // Join workspace room
      client.join(`workspace:${workspaceId}`);

      // Track in our map
      if (!this.workspaceRooms.has(workspaceId)) {
        this.workspaceRooms.set(workspaceId, new Set());
      }
      this.workspaceRooms.get(workspaceId)!.add(client.id);

      this.logger.log(`Client ${client.id} connected to workspace ${workspaceId}`);
      this.server.to(`workspace:${workspaceId}`).emit('user-connected', {
        userId: payload.sub,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const workspaceId = client.data.workspaceId;
    const userId = client.data.userId;

    if (workspaceId) {
      const room = this.workspaceRooms.get(workspaceId);
      if (room) {
        room.delete(client.id);
        if (room.size === 0) {
          this.workspaceRooms.delete(workspaceId);
        }
      }

      this.server.to(`workspace:${workspaceId}`).emit('user-disconnected', {
        userId,
        timestamp: new Date(),
      });

      this.logger.log(`Client ${client.id} disconnected from workspace ${workspaceId}`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): { event: string; data: any } {
    return { event: 'pong', data: { timestamp: new Date() } };
  }

  // Emit events to specific workspace
  emitToWorkspace(workspaceId: string, event: string, data: any) {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }

  // Emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Notification events
  notifyNewLead(workspaceId: string, lead: any) {
    this.emitToWorkspace(workspaceId, 'lead:created', {
      type: 'lead:created',
      data: lead,
      timestamp: new Date(),
    });
  }

  notifyLeadUpdated(workspaceId: string, lead: any) {
    this.emitToWorkspace(workspaceId, 'lead:updated', {
      type: 'lead:updated',
      data: lead,
      timestamp: new Date(),
    });
  }

  notifyNewDeal(workspaceId: string, deal: any) {
    this.emitToWorkspace(workspaceId, 'deal:created', {
      type: 'deal:created',
      data: deal,
      timestamp: new Date(),
    });
  }

  notifyDealStageChanged(workspaceId: string, deal: any) {
    this.emitToWorkspace(workspaceId, 'deal:stage-changed', {
      type: 'deal:stage-changed',
      data: deal,
      timestamp: new Date(),
    });
  }

  notifyDealPaid(workspaceId: string, deal: any) {
    this.emitToWorkspace(workspaceId, 'deal:paid', {
      type: 'deal:paid',
      data: deal,
      timestamp: new Date(),
    });
  }

  notifyCallStarted(workspaceId: string, call: any) {
    this.emitToWorkspace(workspaceId, 'call:started', {
      type: 'call:started',
      data: call,
      timestamp: new Date(),
    });
  }

  notifyCallEnded(workspaceId: string, call: any) {
    this.emitToWorkspace(workspaceId, 'call:ended', {
      type: 'call:ended',
      data: call,
      timestamp: new Date(),
    });
  }

  notifyCallTranscribed(workspaceId: string, call: any) {
    this.emitToWorkspace(workspaceId, 'call:transcribed', {
      type: 'call:transcribed',
      data: call,
      timestamp: new Date(),
    });
  }

  notifyBookingCreated(workspaceId: string, booking: any) {
    this.emitToWorkspace(workspaceId, 'booking:created', {
      type: 'booking:created',
      data: booking,
      timestamp: new Date(),
    });
  }

  notifyBookingConfirmed(workspaceId: string, booking: any) {
    this.emitToWorkspace(workspaceId, 'booking:confirmed', {
      type: 'booking:confirmed',
      data: booking,
      timestamp: new Date(),
    });
  }

  notifyDocumentProcessed(workspaceId: string, document: any) {
    this.emitToWorkspace(workspaceId, 'document:processed', {
      type: 'document:processed',
      data: document,
      timestamp: new Date(),
    });
  }
}
