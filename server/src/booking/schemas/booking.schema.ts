import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookingDocument = HydratedDocument<Booking>;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ required: true })
  roomName: string;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  time: string;

  @Prop({ required: true })
  capacity: number;

  @Prop({ required: true })
  floor: number;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ default: false })
  booked: boolean;

  @Prop({ required: false })
  userId?: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
