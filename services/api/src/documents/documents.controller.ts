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
    @Body() metadata: any,
  ) {
    // TODO: Implement S3 upload
    // For now, return a mock response
    return this.documentsService.create({
      workspaceId: user.workspaceId,
      fileName: file?.originalname || 'unknown',
      fileType: file?.mimetype || 'application/octet-stream',
      fileSize: file?.size || 0,
      s3Key: `documents/${user.workspaceId}/${Date.now()}-${file?.originalname}`,
      s3Url: `https://example.com/documents/${file?.originalname}`,
      ...metadata,
    });
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
}
