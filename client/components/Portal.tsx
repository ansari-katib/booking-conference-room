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
import { Calendar, Users, LogOut , User } from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { Api } from "@/lib/ApiEndpoint";

interface PortalProps {
  onBookConferenceRoom: () => void;
  onViewBookings: () => void;
}

interface DecodedToken {
  email: string;
  sub: string;
  // add other fields if present
}

export function Portal({ onBookConferenceRoom, onViewBookings }: PortalProps) {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<string>("");

  useEffect(() => {
    const token = Cookies.get("access_token");
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        const userId = decoded.sub; 
        console.log("userid : ", userId); 
        setCurrentUser(userId);
        Api.currentUser(userId)
          .then((data) => setUserName(data.fullName))
          .catch((err) => console.error("Failed to fetch user data:", err));
      } catch (err) {
        console.error("Invalid token", err);
      }
    }
  }, []); // Reruns on mount

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
            {userName && (
              <span className="font-medium text-gray-700 bg-neutral-200 p-2 rounded-md">Hi, {userName}</span>
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
        </div>
      </div>
    </div>
  );
}
