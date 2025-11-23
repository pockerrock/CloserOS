import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AiService } from '../common/ai/ai.service';
import { S3Service } from '../common/s3/s3.service';

@Processor('ai')
export class AiProcessor {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private s3Service: S3Service,
  ) {}

  @Process('process-document')
  async handleDocumentProcessing(job: Job) {
    const { documentId, workspaceId } = job.data;

    try {
      this.logger.log(`Processing document ${documentId}`);

      // Update status to processing
      await this.prisma.document.update({
        where: { id: documentId },
        data: { embeddingStatus: 'processing' },
      });

      // Get document from database
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Download file from S3
      const fileBuffer = await this.s3Service.getFile(this.s3Service['bucketDocuments'], document.s3Key);

      // Process document with AI service
      const result = await this.aiService.processDocument(
        fileBuffer,
        document.fileName,
        document.fileType,
        workspaceId,
      );

      // Store embeddings in database
      for (let i = 0; i < result.chunks.length; i++) {
        const chunk = result.chunks[i];
        await this.prisma.documentEmbedding.create({
          data: {
            documentId,
            content: chunk.text,
            embedding: chunk.embedding,
            metadata: { chunkIndex: i },
          },
        });
      }

      // Update document status to completed
      await this.prisma.document.update({
        where: { id: documentId },
        data: { embeddingStatus: 'completed' },
      });

      this.logger.log(`Document ${documentId} processed successfully`);
      return { success: true, chunksCount: result.chunks_count };
    } catch (error) {
      this.logger.error(`Error processing document ${documentId}: ${error.message}`);

      // Update status to failed
      await this.prisma.document.update({
        where: { id: documentId },
        data: { embeddingStatus: 'failed' },
      });

      throw error;
    }
  }

  @Process('transcribe-call')
  async handleCallTranscription(job: Job) {
    const { callId, recordingUrl } = job.data;

    try {
      this.logger.log(`Transcribing call ${callId}`);

      // Transcribe audio
      const transcript = await this.aiService.transcribeCall(recordingUrl);

      // Generate AI summary
      const summary = await this.aiService.summarizeCall(callId, transcript.text);

      // Update call with transcript and summary
      await this.prisma.call.update({
        where: { id: callId },
        data: {
          transcript: transcript.text,
          aiSummary: summary.summary,
        },
      });

      this.logger.log(`Call ${callId} transcribed successfully`);
      return { success: true, transcriptLength: transcript.text.length };
    } catch (error) {
      this.logger.error(`Error transcribing call ${callId}: ${error.message}`);
      throw error;
    }
  }
}
