"use client";

import { Clock, User, Mail, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Api } from "../../lib/ApiEndpoint";
import { cn } from "@/lib/utils";

interface Booking {
  id?: string;
  roomName: string;
  date?: string;
  time: string;
  userId?: string;
  personName?: string;
  email?: string;
  capacity?: number;
  booked?: boolean;
}

interface AvailableRoomsProps {
  roomName?: string;
  isDarkMode?: boolean;
}

function to24Hour(timePart: string) {
  const t = timePart.trim();
  const ampm = /(\d{1,2}:\d{2})\s*(AM|PM)/i.exec(t);
  if (ampm) {
    let [, hm, p] = ampm;
    let [h, m] = hm.split(":").map(Number);
    if (p.toUpperCase() === "PM" && h !== 12) h += 12;
    if (p.toUpperCase() === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
  const simple = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (simple) {
    const [, hh, mm] = simple;
    return `${hh.padStart(2, "0")}:${mm}`;
  }
  return t;
}

function normalizeDateIso(dateStr?: string) {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function buildRange(dateStr: string, timeStr: string) {
  const dateIso = normalizeDateIso(dateStr);
  const parts = timeStr
    .split("-")
    .map((p) => p.trim())
    .filter(Boolean);
  const startPart = parts[0] || "00:00";
  let endPart = parts[1];

  const start24 = to24Hour(startPart);
  if (!endPart) {
    const [h, m] = start24.split(":").map(Number);
    const endH = (h + 1) % 24;
    endPart = `${endH.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}`;
  } else {
    endPart = to24Hour(endPart);
  }

  const start = new Date(`${dateIso}T${start24}:00`);
  const end = new Date(`${dateIso}T${endPart}:00`);
  if (end <= start) end.setDate(end.getDate() + 1);
  return { start, end };
}

function formatTimeDisplay(date: Date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")} ${period}`;
}

export function AvailableRooms({ roomName, isDarkMode = false }: AvailableRoomsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [nextBooking, setNextBooking] = useState<{
    booking: Booking;
    start: Date;
    end: Date;
  } | null>(null);
  const [currentWindow, setCurrentWindow] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [isBooked, setIsBooked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNowTick(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!roomName) {
      setBookings([]);
      setCurrentBooking(null);
      setNextBooking(null);
      setCurrentWindow(null);
      setIsBooked(false);
      return;
    }

    let mounted = true;

    const load = async (showSpinner = false) => {
      if (showSpinner) setIsLoading(true);
      setError(null);
      try {
        const data = await Api.getBookedSlotsByRoom(roomName);
        if (!mounted) return;
        const mapped = (Array.isArray(data) ? data : [])
          .filter(Boolean)
          .map((b: any) => ({
            id: b._id || b.id,
            roomName: b.roomName,
            date: b.date,
            time: b.time || "",
            userId: b.userId,
            personName:
              b.personName ||
              b.user?.fullName ||
              b.user?.email ||
              b.email ||
              b.userId ||
              "Unknown",
            email: b.email || b.user?.email || undefined,
            capacity: b.capacity,
            booked: b.booked || false,
          }));
        setBookings(mapped);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load bookings", err);
        setError("Unable to fetch booking status right now.");
        setBookings([]);
      } finally {
        if (showSpinner && mounted) setIsLoading(false);
      }
    };

    load(true);
    const interval = setInterval(() => load(false), 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [roomName]);

  useEffect(() => {
    if (!roomName) return;

    const evaluate = () => {
      const now = new Date();
      const todayIso = now.toISOString().slice(0, 10);

      const todaysBookings = bookings
        .filter((b) => b.roomName === roomName)
        .filter((b) => normalizeDateIso(b.date) === todayIso)
        .map((b) => {
          try {
            const { start, end } = buildRange(b.date || todayIso, b.time);
            return { booking: b, start, end };
          } catch {
            return null;
          }
        })
        .filter(
          (entry): entry is { booking: Booking; start: Date; end: Date } =>
            entry !== null && entry.end > now
        );

      const ongoing = todaysBookings.find(
        (entry) => now >= entry.start && now < entry.end
      );

      const next =
        todaysBookings
          .filter((entry) => entry.start > now)
          .sort((a, b) => a.start.getTime() - b.start.getTime())[0] ?? null;

      if (ongoing) {
        setCurrentBooking(ongoing.booking);
        setCurrentWindow({ start: ongoing.start, end: ongoing.end });
        setIsBooked(true);
      } else {
        setCurrentBooking(null);
        setCurrentWindow(null);
        setIsBooked(false);
      }

      setNextBooking(next);
    };

    evaluate();
    const timer = setInterval(evaluate, 30_000);
    return () => clearInterval(timer);
  }, [bookings, roomName]);

  const displayStartEnd = currentWindow
    ? {
        start: formatTimeDisplay(currentWindow.start),
        end: formatTimeDisplay(currentWindow.end),
      }
    : { start: "", end: "" };

  const nextWindow = nextBooking
    ? {
        start: formatTimeDisplay(nextBooking.start),
        end: formatTimeDisplay(nextBooking.end),
      }
    : null;

  const renderBody = () => {
    if (!roomName) {
      return (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 sm:p-6 text-center text-muted-foreground text-sm">
          Select a room to view live availability.
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 dark:bg-destructive/20 p-3 sm:p-4 text-sm text-destructive">
          {error}
        </div>
      );
    }

    if (isLoading && !currentBooking && !nextBooking) {
      return (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-destructive" />
          <p className="text-sm">Checking the latest status…</p>
        </div>
      );
    }

    if (isBooked && currentBooking) {
      return (
        <div className="space-y-3">
          <div className="rounded-lg p-3 sm:p-4 shadow-sm bg-destructive/10 dark:bg-destructive/20">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-destructive/20 shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Booked By</p>
                <p className="font-semibold text-foreground truncate">
                  {currentBooking.personName || currentBooking.email || "Unknown"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-3 sm:p-4 shadow-sm bg-destructive/10 dark:bg-destructive/20">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-destructive/20 shrink-0">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Contact Email
                </p>
                <p className="font-semibold text-foreground truncate">
                  {currentBooking.email || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-3 sm:p-4 shadow-sm bg-destructive/10 dark:bg-destructive/20">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-destructive/20 shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Booking Duration
                </p>
                <p className="font-semibold text-foreground">
                  {displayStartEnd.start} - {displayStartEnd.end}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="rounded-lg p-3 sm:p-4 shadow-sm bg-green-500/10 dark:bg-green-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 rounded-lg bg-green-500/20 shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-700 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Current Time</p>
              <p className="font-semibold text-foreground text-sm sm:text-base">
                {formatTimeDisplay(nowTick)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-6 sm:p-8 shadow-sm text-center bg-green-500/10 dark:bg-green-500/20">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-3 sm:mb-4 bg-green-500/20">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-green-700 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h4 className="mb-2 text-lg sm:text-xl font-semibold text-foreground">
            Room Available
          </h4>
          <p className="font-medium text-muted-foreground text-sm sm:text-base">
            This room is ready for your next meeting
          </p>
        </div>

        {nextWindow ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/50 p-3 sm:p-4 text-sm">
            <p className="font-semibold text-foreground mb-1">
              Next booking starts at {nextWindow.start}
            </p>
            <p className="text-muted-foreground">
              {nextBooking?.booking.personName || nextBooking?.booking.email || "—"}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/50 p-3 sm:p-4 text-sm text-muted-foreground">
            No upcoming bookings for today.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-lg shadow-sm border border-border bg-card p-4 sm:p-6 md:p-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-foreground text-lg sm:text-xl font-semibold">Room Status</h2>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 sm:w-3 sm:h-3 rounded-full",
              !roomName
                ? "bg-muted-foreground"
                : isBooked
                ? "bg-destructive animate-pulse"
                : "bg-green-500 animate-pulse"
            )}
          ></div>
          <span
            className={cn(
              "px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium",
              !roomName
                ? "bg-muted text-muted-foreground"
                : isBooked
                ? "bg-destructive/10 text-destructive dark:bg-destructive/20"
                : "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400"
            )}
          >
            {!roomName ? "Select a room" : isBooked ? "Occupied" : "Available Now"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "border-2 rounded-xl p-4 sm:p-6 md:p-8 transition-all shadow-lg flex-1 flex flex-col",
          !roomName
            ? "border-border bg-muted/30"
            : isBooked
            ? "border-destructive/50 bg-destructive/10 dark:bg-destructive/20"
            : "border-green-500/50 bg-green-500/10 dark:bg-green-500/20"
        )}
      >
        <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-border">
          <h3 className="mb-2 sm:mb-3 text-xl sm:text-2xl font-semibold text-foreground">
            {roomName || "No room selected"}
          </h3>
          <span
            className={cn(
              "inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-white shadow-md text-sm sm:text-base",
              !roomName
                ? "bg-muted-foreground"
                : isBooked
                ? "bg-destructive"
                : "bg-green-500"
            )}
          >
            <div
              className={cn(
                "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white",
                !roomName || isBooked ? "" : "animate-pulse"
              )}
            ></div>
            {!roomName
              ? "Awaiting selection"
              : isBooked && displayStartEnd.start
              ? `${displayStartEnd.start} - ${displayStartEnd.end}`
              : "Available Now"}
          </span>
        </div>

        <div className="flex-1 min-h-0">{renderBody()}</div>
      </div>
    </div>
  );
}
