import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiServiceUrl: string;
  private readonly mockMode: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
    this.mockMode = this.configService.get<string>('AI_MOCK_MODE', 'false') === 'true';
  }

  async processDocument(fileBuffer: Buffer, fileName: string, fileType: string, workspaceId: string) {
    if (this.mockMode) {
      this.logger.log('Mock mode: Returning mock document processing result');
      return {
        success: true,
        text_length: 1000,
        chunks_count: 2,
        embeddings_count: 2,
        chunks: [
          {
            text: 'Mock chunk 1',
            embedding: new Array(1536).fill(0),
          },
          {
            text: 'Mock chunk 2',
            embedding: new Array(1536).fill(0),
          },
        ],
      };
    }

    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: fileType });
      formData.append('file', blob, fileName);
      formData.append('workspace_id', workspaceId);

      const response = await firstValueFrom(
        this.httpService.post<any>(`${this.aiServiceUrl}/documents/process`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error processing document: ${error.message}`);
      throw error;
    }
  }

  async transcribeCall(audioUrl: string, language: string = 'en') {
    if (this.mockMode) {
      this.logger.log('Mock mode: Returning mock transcript');
      return {
        text: 'This is a mock transcript of the sales call.',
        confidence: 0.95,
        duration: 180.0,
        words: [],
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<any>(`${this.aiServiceUrl}/transcribe`, {
          audio_url: audioUrl,
          language,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error transcribing call: ${error.message}`);
      throw error;
    }
  }

  async summarizeCall(callId: string, transcript: string) {
    if (this.mockMode) {
      this.logger.log('Mock mode: Returning mock call summary');
      return {
        call_id: callId,
        summary: 'The call went well. Lead showed interest in the product.',
        key_points: ['Interested in premium plan', 'Budget approved'],
        objections: ['Price concern'],
        sentiment: 'positive',
        next_steps: ['Send proposal', 'Schedule follow-up'],
        topics: ['pricing', 'features'],
        questions: ['What does support include?'],
        pain_points: ['Current solution is slow'],
        buying_signals: ['Need to solve quickly'],
        confidence: 0.9,
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<any>(`${this.aiServiceUrl}/summarize/call`, {
          call_id: callId,
          transcript,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error summarizing call: ${error.message}`);
      throw error;
    }
  }

  async queryKnowledgeBase(query: string, workspaceId: string, topK: number = 5) {
    if (this.mockMode) {
      this.logger.log('Mock mode: Returning mock RAG response');
      return {
        answer: 'Based on the sales playbook, you should handle price objections by emphasizing value.',
        sources: [
          {
            document_name: 'sales_playbook.pdf',
            relevance: 0.92,
            excerpt: 'When handling price objections...',
          },
        ],
        confidence: 0.88,
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<any>(`${this.aiServiceUrl}/rag/query`, {
          query,
          workspace_id: workspaceId,
          top_k: topK,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error querying knowledge base: ${error.message}`);
      throw error;
    }
  }

  async createEmbedding(text: string, model: string = 'text-embedding-3-small') {
    if (this.mockMode) {
      return new Array(1536).fill(0);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<any>(`${this.aiServiceUrl}/embeddings`, {
          text,
          model,
        }),
      );

      return response.data.embedding;
    } catch (error) {
      this.logger.error(`Error creating embedding: ${error.message}`);
      throw error;
    }
  }
}
