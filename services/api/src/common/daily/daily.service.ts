import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface DailyRoomConfig {
  name?: string;
  privacy?: 'public' | 'private';
  properties?: {
    enable_chat?: boolean;
    enable_screenshare?: boolean;
    enable_recording?: 'cloud' | 'local';
    start_video_off?: boolean;
    start_audio_off?: boolean;
    max_participants?: number;
    exp?: number; // Unix timestamp for expiration
  };
}

interface DailyRoom {
  id: string;
  name: string;
  api_created: boolean;
  privacy: string;
  url: string;
  created_at: string;
  config: any;
}

@Injectable()
export class DailyService {
  private readonly logger = new Logger(DailyService.name);
  private readonly apiKey: string;
  private readonly domain: string;
  private readonly mockMode: boolean;
  private readonly baseUrl = 'https://api.daily.co/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DAILY_API_KEY', '');
    this.domain = this.configService.get<string>('DAILY_DOMAIN', '');
    this.mockMode = this.configService.get<string>('DAILY_MOCK_MODE') === 'true';

    if (!this.apiKey && !this.mockMode) {
      this.logger.warn('Daily.co API key not configured, using mock mode');
    }
  }

  async createRoom(config?: DailyRoomConfig): Promise<DailyRoom> {
    if (this.mockMode) {
      return this.createMockRoom(config);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/rooms`,
        {
          name: config?.name,
          privacy: config?.privacy || 'private',
          properties: {
            enable_chat: config?.properties?.enable_chat ?? true,
            enable_screenshare: config?.properties?.enable_screenshare ?? true,
            enable_recording: config?.properties?.enable_recording ?? 'cloud',
            start_video_off: config?.properties?.start_video_off ?? false,
            start_audio_off: config?.properties?.start_audio_off ?? false,
            max_participants: config?.properties?.max_participants ?? 10,
            exp: config?.properties?.exp,
            ...config?.properties,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`Daily room created: ${response.data.name}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error creating Daily room: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getRoom(roomName: string): Promise<DailyRoom> {
    if (this.mockMode) {
      return this.getMockRoom(roomName);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/rooms/${roomName}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Error getting Daily room: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteRoom(roomName: string): Promise<void> {
    if (this.mockMode) {
      this.logger.log(`Mock: Deleted room ${roomName}`);
      return;
    }

    try {
      await axios.delete(`${this.baseUrl}/rooms/${roomName}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      this.logger.log(`Daily room deleted: ${roomName}`);
    } catch (error) {
      this.logger.error(`Error deleting Daily room: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createMeetingToken(roomName: string, params?: {
    user_name?: string;
    user_id?: string;
    is_owner?: boolean;
    enable_recording?: boolean;
    start_cloud_recording?: boolean;
    exp?: number;
  }): Promise<string> {
    if (this.mockMode) {
      return `mock-token-${roomName}-${Date.now()}`;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/meeting-tokens`,
        {
          properties: {
            room_name: roomName,
            user_name: params?.user_name,
            user_id: params?.user_id,
            is_owner: params?.is_owner ?? false,
            enable_recording: params?.enable_recording ?? true,
            start_cloud_recording: params?.start_cloud_recording ?? false,
            exp: params?.exp || Math.floor(Date.now() / 1000) + (60 * 60 * 4), // 4 hours
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`Meeting token created for room: ${roomName}`);
      return response.data.token;
    } catch (error) {
      this.logger.error(`Error creating meeting token: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getRecordings(roomName?: string): Promise<any[]> {
    if (this.mockMode) {
      return [];
    }

    try {
      const url = roomName
        ? `${this.baseUrl}/recordings?room_name=${roomName}`
        : `${this.baseUrl}/recordings`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data.data || [];
    } catch (error) {
      this.logger.error(`Error getting recordings: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getRecording(recordingId: string): Promise<any> {
    if (this.mockMode) {
      return { id: recordingId, status: 'finished', download_url: 'https://example.com/recording.mp4' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/recordings/${recordingId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Error getting recording: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteRecording(recordingId: string): Promise<void> {
    if (this.mockMode) {
      this.logger.log(`Mock: Deleted recording ${recordingId}`);
      return;
    }

    try {
      await axios.delete(`${this.baseUrl}/recordings/${recordingId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      this.logger.log(`Recording deleted: ${recordingId}`);
    } catch (error) {
      this.logger.error(`Error deleting recording: ${error.message}`, error.stack);
      throw error;
    }
  }

  private createMockRoom(config?: DailyRoomConfig): DailyRoom {
    const roomName = config?.name || `mock-room-${Date.now()}`;
    const mockDomain = this.domain || 'closeros.daily.co';

    return {
      id: `mock-id-${roomName}`,
      name: roomName,
      api_created: true,
      privacy: config?.privacy || 'private',
      url: `https://${mockDomain}/${roomName}`,
      created_at: new Date().toISOString(),
      config: config?.properties || {},
    };
  }

  private getMockRoom(roomName: string): DailyRoom {
    const mockDomain = this.domain || 'closeros.daily.co';

    return {
      id: `mock-id-${roomName}`,
      name: roomName,
      api_created: true,
      privacy: 'private',
      url: `https://${mockDomain}/${roomName}`,
      created_at: new Date().toISOString(),
      config: {},
    };
  }
}
