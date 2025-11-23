import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketRecordings: string;
  private readonly bucketDocuments: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const region = this.configService.get<string>('S3_REGION', 'us-east-1');
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID') ||
                        this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY') ||
                           this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: accessKeyId && secretAccessKey ? {
        accessKeyId,
        secretAccessKey,
      } : undefined,
      forcePathStyle: !!endpoint, // Required for MinIO
    });

    this.bucketRecordings = this.configService.get<string>('S3_BUCKET_RECORDINGS', 'closeros-recordings');
    this.bucketDocuments = this.configService.get<string>('S3_BUCKET_DOCUMENTS', 'closeros-documents');
  }

  async uploadFile(
    file: Buffer | Uint8Array,
    fileName: string,
    contentType: string,
    bucket?: string,
  ): Promise<{ key: string; url: string }> {
    const key = `${uuidv4()}-${fileName}`;
    const bucketName = bucket || this.bucketDocuments;

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      const url = this.getPublicUrl(bucketName, key);

      this.logger.log(`File uploaded successfully: ${key}`);
      return { key, url };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`, error.stack);
      throw error;
    }
  }

  async uploadDocument(
    workspaceId: string,
    file: Buffer | Uint8Array,
    fileName: string,
    contentType: string,
  ): Promise<{ key: string; url: string }> {
    const key = `documents/${workspaceId}/${uuidv4()}-${fileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketDocuments,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      const url = this.getPublicUrl(this.bucketDocuments, key);

      this.logger.log(`Document uploaded: ${key}`);
      return { key, url };
    } catch (error) {
      this.logger.error(`Error uploading document: ${error.message}`, error.stack);
      throw error;
    }
  }

  async uploadRecording(
    callId: string,
    file: Buffer | Uint8Array,
    contentType: string = 'video/mp4',
  ): Promise<{ key: string; url: string }> {
    const key = `recordings/${callId}/${uuidv4()}.mp4`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketRecordings,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      const url = this.getPublicUrl(this.bucketRecordings, key);

      this.logger.log(`Recording uploaded: ${key}`);
      return { key, url };
    } catch (error) {
      this.logger.error(`Error uploading recording: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSignedUrl(bucket: string, key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Error generating signed URL: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
      throw error;
    }
  }

  private getPublicUrl(bucket: string, key: string): string {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');

    if (endpoint) {
      // MinIO or custom S3 endpoint
      return `${endpoint}/${bucket}/${key}`;
    } else {
      // AWS S3
      const region = this.configService.get<string>('S3_REGION', 'us-east-1');
      return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    }
  }
}
