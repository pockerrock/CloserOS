import { Controller, Get, Delete, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('connect')
  @ApiOperation({ summary: 'Get Google Calendar OAuth URL' })
  async connect(@CurrentUser() user: any) {
    const authUrl = this.calendarService.getAuthUrl(user.id, user.workspaceId);
    return { authUrl };
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle Google Calendar OAuth callback' })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      await this.calendarService.handleCallback(code, state);
      // Redirect to frontend success page
      res.redirect(`${process.env.WEB_APP_URL}/settings?calendar=connected`);
    } catch (error) {
      // Redirect to frontend error page
      res.redirect(`${process.env.WEB_APP_URL}/settings?calendar=error`);
    }
  }

  @Delete('disconnect')
  @ApiOperation({ summary: 'Disconnect Google Calendar' })
  async disconnect(@CurrentUser('id') userId: string) {
    await this.calendarService.disconnect(userId);
    return { message: 'Calendar disconnected successfully' };
  }
}
