import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

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

  async delete(id: string) {
    // TODO: Also delete from S3
    await this.prisma.document.delete({ where: { id } });
    return { message: 'Document deleted successfully' };
  }
}
