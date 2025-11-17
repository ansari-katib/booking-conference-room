"use client";

import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Trash2 } from 'lucide-react';
import { Booking } from '@/types/booking';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

interface MyBookingsProps {
  bookings: Booking[];
  onBack: () => void;
  onCancelBooking: (bookingId: string) => void;
}

export function MyBookings({ bookings, onBack, onCancelBooking }: MyBookingsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Portal
          </Button>
        </div>

        <div className="mb-8">
          <h1>My Bookings</h1>
          <p className="text-gray-600">View and manage your conference room reservations</p>
        </div>

        {sortedBookings.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Calendar className="size-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-gray-500 mb-2">No bookings yet</h3>
                <p className="text-gray-400 mb-6">You haven't made any conference room reservations</p>
                <Button onClick={onBack}>Book a Conference Room</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedBookings.map((booking) => (
              <Card key={booking._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{booking.roomName}</CardTitle>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4" />
                          {formatDate(booking.date)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="size-4" />
                          {booking.time}
                        </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this booking for {booking.roomName} on {formatDate(booking.date)} at {booking.time}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onCancelBooking(booking._id!)}>
                            Cancel Booking
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="size-4" />
                      <span>Capacity: {booking.capacity} people</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="size-4" />
                      <span>Floor {booking.floor}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {booking.amenities.map((amenity) => (
                      <Badge key={amenity} variant="outline">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}