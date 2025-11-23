import { Controller, Get, Post, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: { description?: string; tags?: string[] },
  ) {
    return this.documentsService.uploadDocument(user.workspaceId, file, metadata);
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents in workspace' })
  async getDocuments(@CurrentUser('workspaceId') workspaceId: string) {
    return this.documentsService.findByWorkspace(workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  async getDocument(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  async deleteDocument(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }

  @Post('query')
  @ApiOperation({ summary: 'Query documents using RAG (Retrieval-Augmented Generation)' })
  async queryDocuments(
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() data: { query: string; topK?: number },
  ) {
    return this.documentsService.queryDocuments(workspaceId, data.query, data.topK);
  }
}
