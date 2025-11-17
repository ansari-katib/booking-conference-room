export interface Booking {
  _id?: string;
  roomName: string;
  date: string;
  time: string;
  capacity: number;
  booked:boolean
  floor: number;
  amenities: string[];
}
