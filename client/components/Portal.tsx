"use client";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Calendar, Users, LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useCurrentUser } from "@/lib/currentUser";

interface PortalProps {
  onBookConferenceRoom: () => void;
  onViewBookings: () => void;
}

export function Portal({ onBookConferenceRoom, onViewBookings }: PortalProps) {
  const router = useRouter();
  const { fullName, role, isLoading } = useCurrentUser();

  const handleLogout = () => {
    Cookies.remove("access_token", { path: "/" });
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Username and Logout */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1>Welcome to Conference Room Portal</h1>
            <p className="text-gray-600">Manage your meeting room bookings</p>
          </div>
          <div className="flex items-center gap-4">
            {!isLoading && fullName && (
              <span className="font-medium text-gray-700 bg-neutral-200 p-2 rounded-md">
                Hi, {fullName}
              </span>
            )}
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="size-4" /> Logout
            </Button>
          </div>
        </div>

        {/* Cards */}
        <div
          className={`grid gap-6 ${
            role === "admin" ? "md:grid-cols-3" : "md:grid-cols-2"
          }`}
        >
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
              <Button
                className="w-full"
                onClick={() => router.push("/booking/booking-flow")}
              >
                Get Started
              </Button>
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
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/booking/my-booking")}
              >
                View Bookings
              </Button>
            </CardContent>
          </Card>

          {role === "admin" && (
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push("/admin")}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Shield className="size-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Admin Console</CardTitle>
                    <CardDescription>Manage rooms, bookings, and roles</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Go to Admin
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
