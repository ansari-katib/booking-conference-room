"use client";

import { BookedRooms } from "./BookedRoom";
import { AvailableRooms } from "./AvailableRoom";

export default function RoomDetail() {
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-gray-900">Conference Room Booking</h1>
        <p className="text-gray-600 mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8 
        h-[calc(100vh-100px)] min-h-0">

        {/* Left column */}
        <div className="lg:col-span-1 h-full flex flex-col min-h-0">
          <BookedRooms />
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 h-full flex flex-col min-h-0">
          <AvailableRooms />
        </div>
      </div>
    </div>
  );
}
