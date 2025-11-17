"use client";

import { useState } from "react";
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
  Clock,
  Calendar as CalendarIcon,
  MapPin,
  Users,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Booking } from "@/types/booking";

interface BookingFlowProps {
  onBack: () => void;
  onConfirmBooking: (booking: Booking) => void;
}

interface ConferenceRoom {
  id: string;
  name: string;
  capacity: number;
  floor: number;
  amenities: string[];
}

interface ConferenceRoomWithStatus extends ConferenceRoom {
  booked: boolean;
}

// Mock data for conference rooms
const allConferenceRooms: ConferenceRoom[] = [
  {
    id: "1",
    name: "Board Room A",
    capacity: 12,
    floor: 3,
    amenities: ["Projector", "Whiteboard", "Video Conference"],
  },
  {
    id: "2",
    name: "Meeting Room B",
    capacity: 8,
    floor: 2,
    amenities: ["Projector", "Whiteboard"],
  },
  {
    id: "3",
    name: "Conference Hall C",
    capacity: 50,
    floor: 1,
    amenities: ["Projector", "Sound System", "Video Conference"],
  },
  {
    id: "4",
    name: "Discussion Room D",
    capacity: 6,
    floor: 2,
    amenities: ["Whiteboard", "TV"],
  },
  {
    id: "5",
    name: "Executive Room E",
    capacity: 4,
    floor: 3,
    amenities: ["Video Conference", "Smart TV"],
  },
];

// Mock booked rooms - simulating some rooms are booked at certain times
interface BookedRooms {
  [date: string]: {
    [time: string]: string[];
  };
}

const bookedRooms: BookedRooms = {
  "2024-01-15": {
    "09:00": ["1", "3"],
    "14:00": ["2"],
  },
  "2024-01-16": {
    "10:00": ["1"],
    "15:00": ["4", "5"],
  },
};

// Generate time slots from 8 AM to 6 PM
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
  const [availableRooms, setAvailableRooms] = useState<
    ConferenceRoomWithStatus[]
  >([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime("");
    setAvailableRooms([]);
    setSelectedRoom("");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setSelectedRoom("");

    if (selectedDate) {
      const dateKey = selectedDate.toISOString().split("T")[0];
      const booked = bookedRooms[dateKey]?.[time] || [];

      // Map rooms with booked status
      const roomsWithStatus = allConferenceRooms.map((room) => ({
        ...room,
        booked: booked.includes(room.id),
      }));

      setAvailableRooms(roomsWithStatus);
    }
  };
  const handleBookRoom = () => {
    if (selectedRoom && selectedDate && selectedTime) {
      const dateKey = selectedDate.toISOString().split("T")[0];
      const alreadyBooked = bookedRooms[dateKey]?.[selectedTime] || [];

      if (alreadyBooked.includes(selectedRoom)) {
        alert(
          "This room is already booked at the selected time. Please choose another room or time."
        );
        return;
      }

      const room = availableRooms.find((r) => r.id === selectedRoom);
      if (room) {
        // Update mock bookedRooms dynamically
        if (!bookedRooms[dateKey]) bookedRooms[dateKey] = {};
        if (!bookedRooms[dateKey][selectedTime])
          bookedRooms[dateKey][selectedTime] = [];
        bookedRooms[dateKey][selectedTime].push(selectedRoom);

        const booking: Booking = {
          roomName: room.name,
          date: dateKey,
          time: selectedTime,
          capacity: room.capacity,
          booked: true,
          floor: room.floor,
          amenities: room.amenities,
        };

        onConfirmBooking(booking);
        onBack();
      }
    }
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
          <h1>Book a Conference Room</h1>
          <p className="text-gray-600">
            Select date, time, and choose from available rooms
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Date and Time Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="size-5" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border"
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                />
              </CardContent>
            </Card>

            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="size-5" />
                    Select Time
                  </CardTitle>
                  <CardDescription>
                    Selected: {selectedDate.toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Time Slot</Label>
                    <Select
                      value={selectedTime}
                      onValueChange={handleTimeSelect}
                    >
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
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Available Rooms */}
          <div>
            {selectedTime && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="size-5" />
                    Available Conference Rooms
                  </CardTitle>
                  <CardDescription>
                    {availableRooms.length} room
                    {availableRooms.length !== 1 ? "s" : ""} available for{" "}
                    {selectedDate?.toLocaleDateString()} at {selectedTime}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availableRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`p-4 border rounded-lg transition-all ${
                        selectedRoom === room.id
                          ? "border-blue-500 bg-blue-50"
                          : room.booked
                          ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        if (room.booked) {
                          alert(
                            "This room is already booked at this time. Please choose another room or time."
                          );
                          return;
                        }
                        setSelectedRoom(room.id);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{room.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users className="size-4" />
                              {room.capacity} people
                            </span>
                            <span>Floor {room.floor}</span>
                          </div>
                        </div>
                        {selectedRoom === room.id && <Badge>Selected</Badge>}
                        {room.booked && <Badge variant="outline">Booked</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {room.amenities.map((amenity) => (
                          <Badge key={amenity} variant="outline">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}

                  {selectedRoom && (
                    <div className="mt-6">
                      <Button className="w-full" onClick={handleBookRoom}>
                        Confirm Booking
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!selectedDate && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <p className="text-center text-blue-800">
                    Please select a date to continue
                  </p>
                </CardContent>
              </Card>
            )}

            {selectedDate && !selectedTime && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <p className="text-center text-blue-800">
                    Please select a time slot to view available rooms
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
