import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { UserModule } from '../user/user.module';
import { BookingCleanupService } from './booking-cleanup.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    UserModule,
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingCleanupService],
})
export class BookingModule {}
