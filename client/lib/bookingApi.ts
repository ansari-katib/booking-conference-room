// lib/bookingApi.ts
import apiClient from "./apiClient";
import { Booking } from "@/types/booking";

export const bookingApi = {
  // Get all bookings
  getAll: async (): Promise<Booking[]> => {
    const res = await apiClient.get("/get-all-slot");
    return res.data;
  },
 
  // Get booking by ID
  getById: async (id: string): Promise<Booking> => {
    const res = await apiClient.get(`/${id}`);
    return res.data;
  },

  // Create booking
  create: async (booking: Omit<Booking, "id">): Promise<Booking> => {
    const res = await apiClient.post("/book-slot", booking);
    console.log("booking data : ",res);
    return res.data;
  },

  // Update booking
  update: async (id: string, booking: Partial<Booking>): Promise<Booking> => {
    const res = await apiClient.patch(`/${id}`, booking);
    return res.data;
  },

  // Delete booking
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/${id}`);
  },
};
