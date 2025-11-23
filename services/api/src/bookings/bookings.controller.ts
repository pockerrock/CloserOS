import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new booking' })
  async createBooking(@CurrentUser() user: any, @Body() data: any) {
    return this.bookingsService.create({
      workspaceId: user.workspaceId,
      ...data,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all bookings in workspace' })
  async getBookings(@CurrentUser('workspaceId') workspaceId: string) {
    return this.bookingsService.findByWorkspace(workspaceId);
  }

  @Get('token/:token')
  @ApiOperation({ summary: 'Get booking by token (public)' })
  async getBookingByToken(@Param('token') token: string) {
    return this.bookingsService.findByToken(token);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking by ID' })
  async getBooking(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm booking (public)' })
  async confirmBooking(@Param('id') id: string) {
    return this.bookingsService.confirm(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking' })
  async cancelBooking(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.bookingsService.cancel(id, reason);
  }
}
