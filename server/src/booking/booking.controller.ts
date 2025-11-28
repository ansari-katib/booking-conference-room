import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingCleanupService } from './booking-cleanup.service';

@Controller('booking')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly bookingCleanupService: BookingCleanupService,
  ) {}

  @Post('book-slot')
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @Get('get-all-slot')
  findAll() {
    return this.bookingService.findAll();
  }

  @Get('current-user-slots/:id')
  findAllSlotOfCurrentUser(@Param('id') id: string) {
    return this.bookingService.findAllSlotOfCurrentUser(id);
  }

  @Get('slots-by-room/:roomName')
  findByRoom(@Param('roomName') roomName: string) {
    return this.bookingService.findByRoom(roomName);
  }

  // ✅ MUST BE ABOVE the dynamic ':id' route
  @Get('cleanup')
  async runCleanup() {
    await this.bookingCleanupService.removeExpiredBookings();
    return { success: true, message: 'Cleanup executed' };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingService.update(id, updateBookingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingService.remove(id);
  }
}
