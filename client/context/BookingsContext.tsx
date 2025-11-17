"use client";

import { createContext, useContext, useState } from "react";

export interface Booking {
  id: string;
  roomName: string;
  date: string;
  time: string;
  capacity: number;
  floor: number;
  amenities: string[];
}

interface BookingsContextType {
  isLoggedIn: boolean;
  login: () => void;

  bookings: Booking[];
  addBooking: (b: Booking) => void;
  cancelBooking: (id: string) => void;
}

const BookingsContext = createContext<BookingsContextType | null>(null);

export const BookingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);

  return (
    <BookingsContext.Provider
      value={{
        isLoggedIn,
        login: () => setIsLoggedIn(true),
        bookings,
        addBooking: (b) => setBookings([...bookings, b]),
        cancelBooking: (id) =>
          setBookings((prev) => prev.filter((b) => b.id !== id)),
      }}
    >
      {children}
    </BookingsContext.Provider>
  );
};

export const useBookings = () => useContext(BookingsContext)!;
