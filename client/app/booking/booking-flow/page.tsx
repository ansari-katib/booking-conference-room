"use client";

import React from "react";
import { BookingFlow } from "@/components/BookingFlow";
import { useRouter } from "next/navigation";
import { Api } from "@/lib/ApiEndpoint";

const BookingFlowComponent = () => {
  const router = useRouter();

  const onBack = () => {
    router.push("/landing-page");
  };

  const onConfirmBooking = async (booking: any) => {
    try {
      await Api.create(booking);
      alert("Booking confirmed!");
      router.push("/booking/my-booking");
    } catch (err) {
      console.error(err);
      alert("Failed to book room");
    }
  };

  return (
    <div>
      <BookingFlow onBack={onBack} onConfirmBooking={onConfirmBooking} />
    </div>
  );
};

export default BookingFlowComponent;
