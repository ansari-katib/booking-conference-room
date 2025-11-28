"use client";

import { Clock, User, Mail, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Api } from "../../lib/ApiEndpoint";

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

export function AvailableRooms({ roomName }: AvailableRoomsProps) {
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
        <div className="rounded-lg border border-dashed border-gray-300 bg-white/70 p-6 text-center text-gray-600">
          Select a room to view live availability.
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      );
    }

    if (isLoading && !currentBooking && !nextBooking) {
      return (
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin text-red-500" />
          <p>Checking the latest status…</p>
        </div>
      );
    }

    if (isBooked && currentBooking) {
      return (
        <div className="space-y-3">
          <div className="bg-red-100/60 rounded-lg p-4 shadow-sm">
            <div className="flex items-center text-gray-700">
              <div className="p-3 rounded-lg bg-red-200 mr-3">
                <User className="w-6 h-6 text-red-700" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Booked By</p>
                <p className="text-gray-900 font-semibold">
                  {currentBooking.personName || currentBooking.email || "Unknown"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-100/60 rounded-lg p-4 shadow-sm">
            <div className="flex items-center text-gray-700">
              <div className="p-3 rounded-lg bg-red-200 mr-3">
                <Mail className="w-6 h-6 text-red-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 font-medium">
                  Contact Email
                </p>
                <p className="text-gray-900 font-semibold truncate">
                  {currentBooking.email || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-100/60 rounded-lg p-4 shadow-sm">
            <div className="flex items-center text-gray-700">
              <div className="p-3 rounded-lg bg-red-200 mr-3">
                <Clock className="w-6 h-6 text-red-700" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">
                  Booking Duration
                </p>
                <p className="text-gray-900 font-semibold">
                  {displayStartEnd.start} - {displayStartEnd.end}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-lg p-4 bg-green-100/60 shadow-sm">
          <div className="flex items-center text-gray-700">
            <div className="p-3 rounded-lg bg-green-200 mr-3">
              <Clock className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Current Time</p>
              <p className="text-gray-900 font-semibold">
                {formatTimeDisplay(nowTick)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-100/60 rounded-lg p-8 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-200 mb-4">
            <svg
              className="w-10 h-10 text-green-700"
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
          <h4 className="text-gray-900 mb-2 text-xl font-semibold">
            Room Available
          </h4>
          <p className="text-gray-700 font-medium">
            This room is ready for your next meeting
          </p>
        </div>

        {nextWindow ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white/80 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">
              Next booking starts at {nextWindow.start}
            </p>
            <p>
              {nextBooking?.booking.personName || nextBooking?.booking.email || "—"}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white/80 p-4 text-sm text-gray-600">
            No upcoming bookings for today.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-gray-900">Room Status</h2>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full animate-pulse ${
              !roomName ? "bg-gray-300" : isBooked ? "bg-red-500" : "bg-green-500"
            }`}
          ></div>
          <span
            className={`px-4 py-1.5 rounded-full ${
              !roomName
                ? "bg-gray-100 text-gray-500"
                : isBooked
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {!roomName ? "Select a room" : isBooked ? "Occupied" : "Available Now"}
          </span>
        </div>
      </div>

      <div
        className={`border-2 rounded-xl p-8 transition-all shadow-lg ${
          !roomName
            ? "border-gray-200 bg-gray-50"
            : isBooked
            ? "border-red-400 bg-red-50"
            : "border-green-400 bg-green-50"
        }`}
      >
        <div className="mb-6 pb-4 border-b-2 border-gray-200">
          <h3 className="text-gray-900 mb-3 text-2xl font-semibold">
            {roomName || "No room selected"}
          </h3>
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-md ${
              !roomName
                ? "bg-gray-400"
                : isBooked
                ? "bg-red-500"
                : "bg-green-500"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full bg-white ${
                !roomName || isBooked ? "" : "animate-pulse"
              }`}
            ></div>
            {!roomName
              ? "Awaiting selection"
              : isBooked && displayStartEnd.start
              ? `${displayStartEnd.start} - ${displayStartEnd.end}`
              : "Available Now"}
          </span>
        </div>

        {renderBody()}
      </div>
    </div>
  );
}
