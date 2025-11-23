import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        settings: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async updateWorkspace(id: string, data: { name?: string }) {
    return this.prisma.workspace.update({
      where: { id },
      data,
      include: { settings: true },
    });
  }

  async updateSettings(workspaceId: string, settings: any) {
    return this.prisma.workspaceSettings.update({
      where: { workspaceId },
      data: settings,
    });
  }

  async inviteUser(workspaceId: string, email: string, role: string) {
    // TODO: Implement email invitation logic
    // For now, return a simple response
    return {
      message: 'Invitation sent',
      email,
      role,
    };
  }
}
