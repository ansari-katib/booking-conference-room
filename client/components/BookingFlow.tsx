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
  CalendarIcon,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Api } from "@/lib/ApiEndpoint";
import { Booking } from "@/types/booking";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface BookingFlowProps {
  onBack: () => void;
  onConfirmBooking: (booking: Booking & { userId: string }) => void;
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

interface DecodedToken {
  email: string;
  sub: string;
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [availableRooms, setAvailableRooms] = useState<ConferenceRoomWithStatus[]>([]);
  const [allRooms, setAllRooms] = useState<ConferenceRoom[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [today, setToday] = useState<Date | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [bookedSlotsByRoom, setBookedSlotsByRoom] = useState<Record<string, Booking | undefined>>({});

  // Fetch rooms, bookings and user ID from token
  useEffect(() => {
    async function loadData() {
      try {
        const [rooms, bookings] = await Promise.all([
          Api.getAllRooms(),
          Api.getAll(),
        ]);
        setAllRooms(rooms);
        setAllBookings(bookings);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    }

    const token = Cookies.get("access_token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setCurrentUserId(decoded.sub);
      } catch (err) {
        console.error("Invalid token", err);
      }
    }

    loadData();
  }, []);

  // Set today & client-side check
  useEffect(() => {
    setToday(new Date(new Date().setHours(0, 0, 0, 0)));
    setIsClient(true);
  }, []);

  // Compute available rooms whenever date/time changes
  useEffect(() => {
    async function fetchRoomBookings() {
      if (!selectedDate || !selectedTime) {
        setBookedSlotsByRoom({});
        return;
      }
      const dateKey = formatDate(selectedDate);
      // For each room, fetch bookings for that room and get the one for selected date/time
      const roomBookings: Record<string, Booking | undefined> = {};
      for (const room of allRooms) {
        try {
          const bookings = await Api.getBookedSlotsByRoom(room.name);
          const matched = bookings.find((b: Booking) => b.date === dateKey && b.time === selectedTime && b.booked);
          roomBookings[room._id] = matched;
        } catch (error) {
          roomBookings[room._id] = undefined;
        }
      }
      setBookedSlotsByRoom(roomBookings);
    }
    fetchRoomBookings();
  }, [selectedDate, selectedTime, allRooms]);

  function formatDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const handleBookRoom = () => {
    if (!selectedRoom || !selectedDate || !selectedTime || !currentUserId) {
      console.error("Missing required booking data or user ID");
      return;
    }

    const room = allRooms.find((r) => r._id === selectedRoom);
    if (!room) return;

    const booking: Booking & { userId: string } = {
      roomName: room.name,
      date: formatDate(selectedDate),
      time: selectedTime,
      capacity: room.capacity,
      booked: true,
      floor: room.floor,
      amenities: room.amenities,
      userId: currentUserId,
    };

    console.log("booking data : " ,booking);
    onConfirmBooking(booking);
  };

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
          <h1 className="text-3xl font-bold">Book a Conference Room</h1>
          <p className="text-gray-600 mt-2">
            Select date, time, and choose from available rooms
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Date & Time */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="size-5" />
                  Select Date
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
                  <p>Loading calendar...</p>
                )}
              </CardContent>
            </Card>

            {/* Time */}
            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="size-5" />
                    Select Time
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
                    {availableRooms.filter((r) => !r.booked).length} rooms available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {allRooms.map((room) => {
                    const booking = bookedSlotsByRoom[room._id];
                    const isBooked = !!booking;
                    return (
                      <div
                        key={room._id}
                        className={`p-4 border rounded-lg transition-all mb-4 cursor-pointer ${
                          selectedRoom === room._id
                            ? "border-blue-500 bg-blue-50"
                            : isBooked
                            ? "border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                        onClick={() => !isBooked && setSelectedRoom(room._id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{room.name}</h3>
                            <div className="flex gap-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Users className="size-4" />
                                {room.capacity} people
                              </span>
                              <span>Floor {room.floor}</span>
                            </div>
                            {isBooked && booking && booking.email && (
                              <div className="mt-2 text-xs text-red-700 italic font-medium">
                                Booked by: {booking.email}
                              </div>
                            )}
                          </div>
                          {selectedRoom === room._id && <Badge>Selected</Badge>}
                          {isBooked && <Badge variant="outline">Booked</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {room.amenities.map((a) => (
                            <Badge key={a} variant="outline">
                              {a}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {selectedRoom && (
                    <Button
                      className="w-full mt-6"
                      onClick={handleBookRoom}
                      disabled={!currentUserId}
                    >
                      {currentUserId ? "Confirm Booking" : "Loading user..."}
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