import apiClient from "./apiClient";
import { Booking } from "@/types/booking";

export const Api = {
  //========= ME ========
  currentUser: async (id: string) => {
    try {
      const res = await apiClient.get(`/auth/me/${id}`);
      // console.log("current user in client : " ,res.data);
      return res.data;
    } catch (error) {
      console.error("Fetch current user failed:", error);
      throw error;
    }
  },

  userBookedSlots: async (id: string) => {
    try {
      const res = await apiClient.get(`booking/current-user-slots/${id}`);
      console.log(res.data);
      return res.data;
    } catch (error) {
      console.error("Fetch user booked slots failed:", error);
      throw error;
    }
  },

  // ========== AUTH ==========
  registerUser: async (userData: any) => {
    try {
      const res = await apiClient.post("/auth/register", userData);
      return res.data;
    } catch (error) {
      console.error("Register failed:", error);
      throw error;
    }
  },

  loginUser: async (userData: any) => {
    try {
      const res = await apiClient.post("/auth/login", userData);
      return res.data;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },

  // ========== ROOMS ==========
  getAllRooms: async () => {
    try {
      const res = await apiClient.get("/room/get-all-room");
      return res.data;
    } catch (error) {
      console.error("Get all rooms failed:", error);
      throw error;
    }
  },

  getRoomById: async (id: string) => {
    try {
      const res = await apiClient.get(`/room/${id}`);
      return res.data;
    } catch (error) {
      console.error(`Get room by ID (${id}) failed:`, error);
      throw error;
    }
  },

  createRoom: async (data: any) => {
    try {
      const res = await apiClient.post("/room/create-room", data);
      return res.data;
    } catch (error) {
      console.error("Create room failed:", error);
      throw error;
    }
  },

  updateRoom: async (id: string, data: any) => {
    try {
      const res = await apiClient.patch(`/room/${id}`, data);
      return res.data;
    } catch (error) {
      console.error("Update room failed:", error);
      throw error;
    }
  },

  deleteRoom: async (id: string) => {
    try {
      await apiClient.delete(`/room/${id}`);
    } catch (error) {
      console.error("Delete room failed:", error);
      throw error;
    }
  },

  // ========== BOOKINGS ==========
  getAll: async (): Promise<Booking[]> => {
    try {
      const res = await apiClient.get("/booking/get-all-slot");
      return res.data;
    } catch (err) {
      console.error("Get all bookings failed:", err);
      throw err;
    }
  },

  getById: async (id: string): Promise<Booking> => {
    try {
      const res = await apiClient.get(`/booking/${id}`);
      return res.data;
    } catch (err) {
      console.error(`Get booking by ID (${id}) failed:`, err);
      throw err;
    }
  },

  create: async (booking: Omit<Booking, "id">): Promise<Booking> => {
    try {
      const res = await apiClient.post("/booking/book-slot", booking);
      return res.data;
    } catch (err: any) {
      if (err.response) {
        console.error(
          "Create booking failed with status:",
          err.response.status,
          err.response.data
        );
      } else {
        console.error("Create booking error:", err.message);
      }
      throw err;
    }
  },

  update: async (id: string, booking: Partial<Booking>): Promise<Booking> => {
    try {
      const res = await apiClient.patch(`/booking/${id}`, booking);
      return res.data;
    } catch (err) {
      console.error(`Update booking (${id}) failed:`, err);
      throw err;
    }
  },

  remove: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/booking/${id}`);
    } catch (err) {
      console.error(`Delete booking (${id}) failed:`, err);
      throw err;
    }
  },
};
