"use client";

import React, { useEffect, useState } from "react";
import { MyBookings } from "@/components/MyBookings";
import { useRouter } from "next/navigation";
import { Booking } from "@/types/booking";
import { Api } from "@/lib/ApiEndpoint";

const MyBooking = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await Api.getAll();
        setBookings(data);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const onBack = () => {
    router.push("/landing-page");
  };

  const onCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await Api.remove(bookingId);
      setBookings(bookings.filter((b) => b._id !== bookingId));
      alert("Booking cancelled successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to cancel booking.");
    }
  };

  return (
    <div>
      {loading ? (
        <p>Loading bookings...</p>
      ) : (
        <MyBookings
          bookings={bookings}
          onBack={onBack}
          onCancelBooking={onCancelBooking}
        />
      )}
    </div>
  );
};

export default MyBooking;
