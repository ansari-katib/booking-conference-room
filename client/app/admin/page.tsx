"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCurrentUser } from "@/lib/currentUser";
import { Loader2, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const router = useRouter();
  const { fullName, role, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && role !== "admin") {
      router.replace("/landing-page");
    }
  }, [isLoading, role, router]);

  if (isLoading || role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
        <p className="text-gray-500 text-sm">Loading admin console…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">
              Welcome back{fullName ? `, ${fullName}` : ""}! Manage rooms and bookings.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/landing-page")}>
            Back to Portal
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Rooms</CardTitle>
              <Settings className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              Manage conference rooms, capacity, and amenities.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bookings</CardTitle>
              <Settings className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              Review all reservations and resolve conflicts.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Users</CardTitle>
              <Settings className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              Monitor access levels and Azure SSO roles.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

