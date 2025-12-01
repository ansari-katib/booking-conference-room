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
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTheme = window.localStorage.getItem("room-detail-theme");
    if (storedTheme) {
      setIsDarkMode(storedTheme === "dark");
    }
  }, []);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      window.localStorage.setItem("room-detail-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      window.localStorage.setItem("room-detail-theme", "light");
    }
  }, [isDarkMode]);

  return (
    <div className={cn("min-h-screen transition-colors bg-background")}>
      <header className="border-b border-border bg-card transition-colors px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <h1 className="text-foreground text-lg sm:text-xl md:text-2xl font-semibold">Conference Room Booking</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="shrink-0"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        <div className="mt-4 sm:mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Currently viewing
            </p>
            <p className="text-lg sm:text-xl font-semibold text-foreground truncate">
              {selectedRoom || (isLoadingRooms ? "Loading rooms..." : "Select a room")}
            </p>
            {roomLoadError ? (
              <p className="text-sm text-destructive mt-1">{roomLoadError}</p>
            ) : null}
          </div>

          <Select
            value={selectedRoom || undefined}
            onValueChange={setSelectedRoom}
            disabled={isLoadingRooms || rooms.length === 0}
          >
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px] md:min-w-[280px]">
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
          <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-lg border border-border bg-muted/50 p-3 sm:p-4">
              <p className="text-xs uppercase text-muted-foreground mb-1">Capacity</p>
              <p className="text-base sm:text-lg font-semibold text-foreground">
                {activeRoom.capacity} people
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-3 sm:p-4">
              <p className="text-xs uppercase text-muted-foreground mb-1">Floor</p>
              <p className="text-base sm:text-lg font-semibold text-foreground">
                Level {activeRoom.floor}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
              <p className="text-xs uppercase text-muted-foreground mb-1">Amenities</p>
              <p className="text-sm sm:text-base font-medium text-foreground">
                {activeRoom.amenities.length
                  ? activeRoom.amenities.join(", ")
                  : "No amenities listed"}
              </p>
            </div>
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 lg:grid-cols-3 min-h-0">
        <div className="flex flex-col min-h-0 lg:col-span-1">
          <BookedRooms roomName={selectedRoom || undefined} isDarkMode={isDarkMode} />
        </div>
        <div className="flex flex-col min-h-0 lg:col-span-2">
          <AvailableRooms roomName={selectedRoom || undefined} isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
}
