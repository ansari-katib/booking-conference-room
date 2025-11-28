import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking } from './schemas/booking.schema';

@Injectable()
export class BookingCleanupService {
  private readonly logger = new Logger(BookingCleanupService.name);

  constructor(
    @InjectModel(Booking.name)
    private bookingModel: Model<Booking>,
  ) {}

  async removeExpiredBookings() {
    const now = new Date();

    const bookings = await this.bookingModel.find({ booked: true });

    for (const b of bookings) {
      const { date, time } = b;

      if (!date || !time) continue;

      try {
        const { start, end } = this.parseStartEnd(date, time);

        if (now > end) {
          this.logger.log(`🗑️ Deleting expired booking: ${b._id}`);
          await this.bookingModel.findByIdAndDelete(b._id);
        }
      } catch (err) {
        this.logger.error(`❌ Error checking booking ${b._id}`, err);
      }
    }
  }

  /**
   * Supports BOTH:
   *  - "13:00"
   *  - "13:00 - 14:00"
   */
  private parseStartEnd(date: string, time: string) {
    time = time.trim();

    // Case 1: "13:00 - 14:00" → time range
    if (time.includes('-')) {
      const [startStr, endStr] = time.split('-').map(t => t.trim());

      const start = new Date(`${date}T${startStr}:00`);
      const end = new Date(`${date}T${endStr}:00`);

      return { start, end };
    }

    // Case 2: "13:00" → auto end after 1 hour
    const [h, m] = time.split(':').map(Number);
    const endH = (h + 1) % 24;

    const start = new Date(`${date}T${time}:00`);
    const end = new Date(
      `${date}T${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`,
    );

    return { start, end };
  }
}
