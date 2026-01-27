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
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTheme = window.localStorage.getItem("room-detail-theme");
    if (storedTheme) setIsDarkMode(storedTheme === "dark");
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
            if (match) return match.name;
          }
          return normalized[0]?.name ?? "";
        });
      })
      .catch((err) => {
        if (!active) return;
        setRoomLoadError("Unable to load rooms right now.");
        setRooms([]);
      })
      .finally(() => {
        if (active) setIsLoadingRooms(false);
      });
    return () => { active = false; };
  }, [initialRoom]);

  const activeRoom = useMemo(() => rooms.find((room) => room.name === selectedRoom) ?? null, [rooms, selectedRoom]);

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

  if (!mounted) return null;

  return (
    <div className="h-screen flex flex-col transition-colors bg-background overflow-hidden">
      <header className="shrink-0 border-b border-border bg-card transition-colors px-4 py-3 sm:px-6 md:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col flex-1 min-w-0">
            <h1 className="text-foreground text-lg sm:text-xl font-semibold">Conference Room Booking</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {now?.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              <span className="px-2 text-green-500 font-mono">
                {now?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
              </span>
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="shrink-0">
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Currently viewing</p>
            <p className="text-base sm:text-lg font-semibold text-foreground truncate">
              {selectedRoom || (isLoadingRooms ? "Loading rooms..." : "Select a room")}
            </p>
          </div>
          <Select value={selectedRoom || undefined} onValueChange={setSelectedRoom} disabled={isLoadingRooms || rooms.length === 0}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Select a room" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.name}>{room.name} · {room.capacity} seats</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* {activeRoom && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-md border border-border bg-muted/50 px-2 py-1 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Capacity</p>
              <p className="text-xs font-semibold">{activeRoom.capacity}</p>
            </div>
            <div className="rounded-md border border-border bg-muted/50 px-2 py-1 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Floor</p>
              <p className="text-xs font-semibold">L{activeRoom.floor}</p>
            </div>
            <div className="rounded-md border border-border bg-muted/50 px-2 py-1 text-center truncate">
              <p className="text-[10px] uppercase text-muted-foreground">Amenities</p>
              <p className="text-xs font-semibold truncate">{activeRoom.amenities.length || "None"}</p>
            </div>
          </div>
        )} */}
      </header>

      {/* Main Container: min-h-0 is crucial for flex children to scroll */}
      <main className="flex-1 min-h-0 p-3 sm:p-4 md:p-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          <div className="lg:col-span-1 h-full min-h-0">
            <BookedRooms roomName={selectedRoom || undefined} isDarkMode={isDarkMode} />
          </div>
          <div className="lg:col-span-2 h-full min-h-0">
            <AvailableRooms roomName={selectedRoom || undefined} isDarkMode={isDarkMode} />
          </div>
        </div>
      </main>
    </div>
  );
}