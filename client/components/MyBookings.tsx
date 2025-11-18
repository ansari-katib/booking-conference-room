// components/booking/MyBookings.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Trash2,
} from "lucide-react";
import { Booking } from "@/types/booking";
import { Api } from "@/lib/ApiEndpoint";
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
} from "@/components/ui/alert-dialog";
import { useCurrentUser } from "@/lib/currentUser";

export function MyBookings({ onBack }: { onBack: () => void }) {
  const { userId, fullName, isLoading: userLoading } = useCurrentUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await Api.userBookedSlots(userId);
        // Sort by date & time
        const sorted = data.sort((a: Booking, b: Booking) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });
        setBookings(sorted);
      } catch (err) {
        console.error("Failed to load your bookings", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userId]);

  const handleCancel = async (bookingId: string) => {
    try {
      await Api.remove(bookingId);
      setBookings((prev) => prev.filter((b) => b._id !== bookingId));
    } catch (err) {
      alert("Failed to cancel booking");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <p>Loading your bookings...</p>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">
            My Bookings {fullName && `– ${fullName}`}
          </h1>
          <p className="text-gray-600 mt-2">
            View and cancel your conference room reservations
          </p>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Calendar className="size-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                No bookings yet
              </h3>
              <p className="text-gray-400 mb-6">
                You haven't reserved any conference rooms
              </p>
              <Button onClick={onBack}>Book a Room Now</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card key={booking._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{booking.roomName}</CardTitle>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cancel your booking for <strong>{booking.roomName}</strong> on{" "}
                            {formatDate(booking.date)} at {booking.time}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancel(booking._id!)}
                          >
                            Cancel Booking
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 gap-6 mb-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users className="size-4" />
                      Capacity: {booking.capacity} people
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4" />
                      Floor {booking.floor}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 text-gray-700">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {booking.amenities.map((a) => (
                        <Badge key={a} variant="outline">
                          {a}
                        </Badge>
                      ))}
                    </div>
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