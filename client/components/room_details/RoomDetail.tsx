"use client";

import { useEffect, useMemo, useState } from "react";
import BookedRooms from "./BookedRoom";
import { AvailableRooms } from "./AvailableRoom";
import { Api } from "@/lib/ApiEndpoint";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RoomMeta = {
  id: string;
  name: string;
  capacity: number;
  floor: number;
  amenities: string[];
};

interface RoomDetailProps {
  initialRoom?: string;
}

export default function RoomDetail({ initialRoom }: RoomDetailProps) {
  const [rooms, setRooms] = useState<RoomMeta[]>([]);
  const [selectedRoom, setSelectedRoom] = useState(initialRoom ?? "");
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [roomLoadError, setRoomLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoadingRooms(true);
    setRoomLoadError(null);

    Api.getAllRooms()
      .then((data) => {
        if (!active) return;
        const normalized = (Array.isArray(data) ? data : []).map((room: any) => ({
          id: room._id || room.id || room.name,
          name: room.name,
          capacity: room.capacity,
          floor: room.floor,
          amenities: room.amenities || [],
        }));

        setRooms(normalized);
        setSelectedRoom((prev) => {
          if (prev) return prev;
          if (initialRoom) {
            const match = normalized.find((room) => room.name === initialRoom);
            if (match) {
              return match.name;
            }
          }
          return normalized[0]?.name ?? "";
        });
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load rooms", err);
        setRoomLoadError("Unable to load rooms right now.");
        setRooms([]);
      })
      .finally(() => {
        if (active) setIsLoadingRooms(false);
      });

    return () => {
      active = false;
    };
  }, [initialRoom]);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.name === selectedRoom) ?? null,
    [rooms, selectedRoom]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-gray-900">Conference Room Booking</h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Currently viewing
            </p>
            <p className="text-xl font-semibold text-gray-900">
              {selectedRoom || (isLoadingRooms ? "Loading rooms..." : "Select a room")}
            </p>
            {roomLoadError ? (
              <p className="text-sm text-red-600 mt-1">{roomLoadError}</p>
            ) : null}
          </div>

          <Select
            value={selectedRoom || undefined}
            onValueChange={setSelectedRoom}
            disabled={isLoadingRooms || rooms.length === 0}
          >
            <SelectTrigger className="w-full md:w-72">
              <SelectValue placeholder="Select a room" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.name}>
                  {room.name} · {room.capacity} seats
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeRoom ? (
          <div className="mt-6 grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs uppercase text-gray-500">Capacity</p>
              <p className="text-lg font-semibold text-gray-900">
                {activeRoom.capacity} people
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs uppercase text-gray-500">Floor</p>
              <p className="text-lg font-semibold text-gray-900">
                Level {activeRoom.floor}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs uppercase text-gray-500">Amenities</p>
              <p className="text-gray-900 font-medium">
                {activeRoom.amenities.length
                  ? activeRoom.amenities.join(", ")
                  : "No amenities listed"}
              </p>
            </div>
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3 h-[calc(100vh-100px)] min-h-0">
        <div className="flex flex-col min-h-0 lg:col-span-1">
          <BookedRooms roomName={selectedRoom || undefined} />
        </div>
        <div className="flex flex-col min-h-0 lg:col-span-2">
          <AvailableRooms roomName={selectedRoom || undefined} />
        </div>
      </div>
    </div>
  );
}
