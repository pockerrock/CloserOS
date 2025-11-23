import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import { S3Service } from '../common/s3/s3.service';
import { AiService } from '../common/ai/ai.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private aiService: AiService,
    @InjectQueue('ai') private aiQueue: Queue,
  ) {}

  async create(data: {
    workspaceId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    s3Key: string;
    s3Url: string;
    description?: string;
    tags?: string[];
  }) {
    return this.prisma.document.create({
      data,
    });
  }

  async findByWorkspace(workspaceId: string) {
    return this.prisma.document.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        embeddings: true,
      },
    });
  }

  async updateEmbeddingStatus(id: string, status: string, error?: string) {
    return this.prisma.document.update({
      where: { id },
      data: {
        embeddingStatus: status,
        embeddingError: error,
        embeddedAt: status === 'completed' ? new Date() : undefined,
      },
    });
  }

  async uploadDocument(
    workspaceId: string,
    file: Express.Multer.File,
    metadata?: { description?: string; tags?: string[] },
  ) {
    const { key, url } = await this.s3Service.uploadDocument(
      workspaceId,
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    const document = await this.create({
      workspaceId,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      s3Key: key,
      s3Url: url,
      description: metadata?.description,
      tags: metadata?.tags,
    });

    // Trigger AI processing job
    await this.aiQueue.add('process-document', {
      documentId: document.id,
      workspaceId,
    });

    return document;
  }

  async delete(id: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });

    if (document) {
      // Delete from S3
      try {
        const bucket = process.env.S3_BUCKET_DOCUMENTS || 'closeros-documents';
        await this.s3Service.deleteFile(bucket, document.s3Key);
      } catch (error) {
        console.error('Error deleting from S3:', error);
      }
    }

    await this.prisma.document.delete({ where: { id } });
    return { message: 'Document deleted successfully' };
  }

  async queryDocuments(workspaceId: string, query: string, topK: number = 5) {
    return this.aiService.queryDocuments(query, workspaceId, topK);
  }
}
