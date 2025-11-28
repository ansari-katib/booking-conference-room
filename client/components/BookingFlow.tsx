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
  Loader2,
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

interface DecodedToken {
  email: string;
  sub: string;
}

// Generate time slots from 8:00 AM to 10:00 PM (22:00) in hourly increments
// Generate time slots as ranges (8AM–10PM)
const generateTimeRanges = (start = 8, end = 22): string[] => {
  const ranges: string[] = [];
  for (let hour = start; hour < end; hour++) {
    const startH = hour.toString().padStart(2, "0");
    const endH = (hour + 1).toString().padStart(2, "0");
    ranges.push(`${startH}:00 - ${endH}:00`);
  }
  return ranges;
};

const timeSlots = generateTimeRanges();


export function BookingFlow({ onBack, onConfirmBooking }: BookingFlowProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [allRooms, setAllRooms] = useState<ConferenceRoom[]>([]);
  const [today, setToday] = useState<Date | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [bookedSlotsByRoom, setBookedSlotsByRoom] = useState<
    Record<string, Booking | undefined>
  >({});
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch rooms, bookings and user ID from token
  useEffect(() => {
    async function loadData() {
      setLoadingRooms(true);
      try {
        const rooms = await Api.getAllRooms();
        setAllRooms(rooms);
      } catch (err) {
        console.error("Failed to load data", err);
      }
      setLoadingRooms(false);
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
        setLoadingSlots(false);
        return;
      }
      setLoadingSlots(true);
      const dateKey = formatDate(selectedDate);
      // For each room, fetch bookings for that room and get the one for selected date/time
      const roomBookings: Record<string, Booking | undefined> = {};
      for (const room of allRooms) {
        try {
          const bookings = await Api.getBookedSlotsByRoom(room.name);
          const matched = bookings.find(
            (b: Booking) =>
              b.date === dateKey && b.time === selectedTime && b.booked
          );
          roomBookings[room._id] = matched;
        } catch (error) {
          roomBookings[room._id] = undefined;
        }
      }
      setBookedSlotsByRoom(roomBookings);
      setLoadingSlots(false);
    }
    fetchRoomBookings();
  }, [selectedDate, selectedTime, allRooms]);

  function formatDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Format time to 12-hour format with AM/PM
  function formatTimeDisplay(range: string): string {
    const [start, end] = range.split("-").map((t) => t.trim());

    const format = (time: string) => {
      const [hour, minute] = time.split(":").map(Number);
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
    };
    return `${format(start)} - ${format(end)}`;
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

    console.log("booking data : ", booking);
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
                  loadingRooms ? (
                    <div className="flex justify-center items-center h-24">
                      <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
                    </div>
                  ) : (
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                      disabled={(date) => !!today && date < today}
                    />
                  )
                ) : (
                  <div className="flex justify-center items-center h-24">
                    <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
                  </div>
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
                  {loadingRooms ? (
                    <div className="flex justify-center items-center h-16">
                      <Loader2 className="animate-spin w-6 h-6 text-gray-400" />
                    </div>
                  ) : (
                    <>
                      <Label>Time Slot (8:00 AM - 10:00 PM)</Label>
                      <Select
                        value={selectedTime}
                        onValueChange={setSelectedTime}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a time slot" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {formatTimeDisplay(time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
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
                    {
                      allRooms.filter((r) => {
                        const booking = bookedSlotsByRoom[r._id];
                        return !booking;
                      }).length
                    }{" "}
                    rooms available at {formatTimeDisplay(selectedTime)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSlots ? (
                    <div className="flex justify-center items-center h-24">
                      <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
                    </div>
                  ) : (
                    allRooms.map((room) => {
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
                            {selectedRoom === room._id && (
                              <Badge>Selected</Badge>
                            )}
                            {isBooked && (
                              <Badge variant="outline">Booked</Badge>
                            )}
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
                    })
                  )}
                  {selectedRoom && !loadingSlots && (
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
