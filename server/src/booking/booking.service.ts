import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private readonly userService: UserService,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // console.log(createBookingDto);
    const { roomName, date, time } = createBookingDto;

    // Check if a booking already exists
    const existingBooking = await this.bookingModel
      .findOne({ roomName, date, time })
      .exec();
    if (existingBooking) {
      throw new InternalServerErrorException(
        'This room is already booked at the selected time. Please choose another time or room.',
      );
    }
    const booking = new this.bookingModel(createBookingDto);
    return booking.save();
  }

  async findAll(): Promise<Booking[]> {
    return this.bookingModel.find().exec();
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    const updated = await this.bookingModel
      .findByIdAndUpdate(id, updateBookingDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Booking not found');
    }

    return updated;
  }

  async remove(id: string) {
    console.log('id : ', id);
    try {
      const deleted = await this.bookingModel.findByIdAndDelete(id);
      if (!deleted) {
        throw new NotFoundException('Booking not found');
      }
      return deleted;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to delete booking');
    }
  }

  async findAllSlotOfCurrentUser(userId: string): Promise<Booking[]> {
    return this.bookingModel
      .find({ userId, booked: true })
      .sort({ date: 1, time: 1 })
      .exec();
  }

  async findByRoom(roomName: string): Promise<any[]> {
    const bookings = await this.bookingModel
      .find({ roomName, booked: true })
      .sort({ date: 1, time: 1 })
      .exec();

    const bookingsWithUser = await Promise.all(
      bookings.map(async (booking) => {
        const plain = booking.toObject();

        if (!booking.userId) {
          return { ...plain, email: null, personName: null, user: null };
        }

        const userDoc = await this.userService.getUserById(booking.userId);

        return {
          ...plain,
          email: userDoc?.email ?? null,
          personName: userDoc?.fullName ?? null,
          user: userDoc
            ? {
                id: userDoc._id?.toString?.() ?? String(userDoc._id),
                fullName: userDoc.fullName,
                email: userDoc.email,
              }
            : null,
        };
      }),
    );

    return bookingsWithUser;
  }
}
