import { IsString, IsBoolean, IsNumber, IsArray, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  roomName: string;

  @IsString()
  date: string;

  @IsString()
  time: string;

  @IsNumber()
  capacity: number;

  @IsNumber()
  floor: number;

  @IsArray()
  @IsString({ each: true })
  amenities: string[];

  @IsOptional()
  @IsBoolean()
  booked?: boolean;

  @IsOptional()
  @IsString()
  userId?: string;
}
