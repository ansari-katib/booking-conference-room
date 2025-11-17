"use client";

import { useRouter } from "next/navigation";
import { Portal } from "@/components/Portal";

export default function Home() {
  const router = useRouter();

  const handleBookConferenceRoom = () => {
    console.log("Navigate to booking page");
  };

  const handleViewBookings = () => {
    console.log("Navigate to bookings page");
  };

  return (
    <Portal
      onBookConferenceRoom={handleBookConferenceRoom}
      onViewBookings={handleViewBookings}
    />
  );
}
