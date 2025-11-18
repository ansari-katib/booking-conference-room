"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { Calendar } from "./ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Api } from "@/lib/ApiEndpoint";
import { Booking } from "@/types/booking";

interface BookingFlowProps {
  onBack: () => void;
  onConfirmBooking: (booking: Booking) => void;
}

interface ConferenceRoom {
  _id: string;
  name: string;
  capacity: number;
  floor: number;
  amenities: string[];
}

interface ConferenceRoomWithStatus extends ConferenceRoom {
  booked: boolean;
}

const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

export function BookingFlow({ onBack, onConfirmBooking }: BookingFlowProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableRooms, setAvailableRooms] = useState<ConferenceRoomWithStatus[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [allRooms, setAllRooms] = useState<ConferenceRoom[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [today, setToday] = useState<Date>();
  const [isClient, setIsClient] = useState(false);

  // ===========================
  // 1️⃣ Fetch rooms + bookings
  // ===========================
  useEffect(() => {
    async function fetchData() {
      try {
        const rooms = await Api.getAllRooms();
        const bookings = await Api.getAll();
        setAllRooms(rooms);
        setAllBookings(bookings);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    setToday(new Date(new Date().setHours(0, 0, 0, 0)));
    setIsClient(true);
  }, []);

  // ===========================
  // 2️⃣ Compute Available Rooms
  // ===========================
  useEffect(() => {
    if (!selectedDate || !selectedTime) return;

    const dateKey = formatDate(selectedDate);

    // Get bookings on selected date + time
    const bookedRoomNames = allBookings
      .filter(
        (b) =>
          b.date === dateKey && b.time === selectedTime && b.booked === true
      )
      .map((b) => b.roomName);

    // map rooms → mark booked
    const roomsWithStatus = allRooms.map((room) => ({
      ...room,
      booked: bookedRoomNames.includes(room.name),
    }));

    setAvailableRooms(roomsWithStatus);
  }, [selectedDate, selectedTime, allBookings, allRooms]);

  // ===========================
  // Format Date
  // ===========================
  function formatDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const handleBookRoom = () => {
    if (!selectedRoom || !selectedDate || !selectedTime) return;

    const room = allRooms.find((r) => r._id === selectedRoom);
    if (!room) return;

    const booking: Booking = {
      roomName: room.name,
      date: formatDate(selectedDate),
      time: selectedTime,
      capacity: room.capacity,
      booked: true,
      floor: room.floor,
      amenities: room.amenities,
    };

    onConfirmBooking(booking);
  };

  // ===========================
  // UI
  // ===========================
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Portal
          </Button>
        </div>

        <div className="mb-8">
          <h1>Book a Conference Room</h1>
          <p className="text-gray-600">Select date, time, and choose from available rooms</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Date & Time */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="size-5" /> Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isClient ? (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    disabled={(date) => !!today && date < today}
                  />
                ) : (
                  <p>Loading...</p>
                )}
              </CardContent>
            </Card>

            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="size-5" /> Select Time
                  </CardTitle>
                  <CardDescription>{formatDate(selectedDate)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Label>Time Slot</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Rooms */}
          <div>
            {selectedTime && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="size-5" />
                    Available Rooms
                  </CardTitle>
                  <CardDescription>
                    {availableRooms.length} rooms available
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {availableRooms.map((room) => (
                    <div
                      key={room._id}
                      className={`p-4 border rounded-lg transition-all ${
                        selectedRoom === room._id
                          ? "border-blue-500 bg-blue-50"
                          : room.booked
                          ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        if (!room.booked) setSelectedRoom(room._id);
                      }}
                    >
                      <div className="flex justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{room.name}</h3>
                          <div className="flex gap-4 text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <Users className="size-4" /> {room.capacity} people
                            </span>
                            <span>Floor {room.floor}</span>
                          </div>
                        </div>

                        {selectedRoom === room._id && <Badge>Selected</Badge>}
                        {room.booked && <Badge variant="outline">Booked</Badge>}
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {room.amenities.map((a) => (
                          <Badge key={a} variant="outline">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}

                  {selectedRoom && (
                    <Button className="w-full mt-5" onClick={handleBookRoom}>
                      Confirm Booking
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
