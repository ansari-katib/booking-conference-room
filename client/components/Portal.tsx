"use client";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Calendar, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface PortalProps {
  onBookConferenceRoom: () => void;
  onViewBookings: () => void;
}

export function Portal({ onBookConferenceRoom, onViewBookings }: PortalProps) {
 
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1>Welcome to Conference Room Portal</h1>
          <p className="text-gray-600">Manage your meeting room bookings</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={onBookConferenceRoom}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="size-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Book Conference Room</CardTitle>
                  <CardDescription>
                    Reserve a room for your meeting
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push('/booking/booking-flow')}>Get Started</Button>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={onViewBookings}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="size-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>My Bookings</CardTitle>
                  <CardDescription>
                    View your upcoming reservations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => router.push('/booking/my-booking')}>
                View Bookings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
