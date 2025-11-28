// ...existing code...
"use client";

import { Clock, User, Mail, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Api } from "../../lib/ApiEndpoint";

interface Booking {
  id?: string;
  roomName: string;
  date: string;
  time: string;
  userId?: string;
  personName?: string;
  email?: string;
  capacity?: number;
  booked?: boolean;
  loading?: boolean;
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

function buildRange(dateStr: string, timeStr: string) {
  const today = new Date();
  const dateIso = (() => {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return today.toISOString().slice(0, 10);
  })();

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

export function AvailableRooms() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [isBooked, setIsBooked] = useState(false);

  useEffect(() => {
    let mounted = true;
    Api.getAll()
      .then((data: any[]) => {
        if (!mounted) return;
        const mapped = (Array.isArray(data) ? data : []).map((b: any) => ({
          id: b._id || b.id,
          roomName: b.roomName,
          date: b.date,
          time: b.time || "",
          userId: b.userId,
          personName: b.personName || "Unknown",
          email: b.email || undefined,
          capacity: b.capacity,
          booked: b.booked || false,
          loading: !!b.userId,
        }));
        setBookings(mapped);
        console.log("booking data  : ", mapped);
      })
      .catch((err) => {
        console.error("Failed to load bookings", err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const evaluate = () => {
      const now = new Date();
      const todayIso = now.toISOString().slice(0, 10);
      const SELECTED_ROOM = "Board Room A";

      // filter bookings only for this room
      const roomABookings = bookings.filter(
        (b) => b.roomName === SELECTED_ROOM
      );

      // filter today's bookings
      const todaysBookings = roomABookings.filter((b) => {
        const d = new Date(b.date);
        if (!isNaN(d.getTime()))
          return d.toISOString().slice(0, 10) === todayIso;
        return b.date === todayIso;
      });

      // create ranges
      const ranges = todaysBookings
        .map((b) => {
          try {
            const { start, end } = buildRange(b.date, b.time);
            return { booking: b, start, end };
          } catch {
            return null;
          }
        })
        .filter(
          (r): r is { booking: Booking; start: Date; end: Date } => r !== null
        );

      // 1️⃣ CURRENT MEETING (highest priority)
      const ongoing = ranges.find((r) => now >= r.start && now < r.end);

      if (ongoing) {
        setCurrentBooking(ongoing.booking);
        setIsBooked(true);
        return;
      }

      // 2️⃣ booked:true but NOT ongoing
      const explicitlyBooked = todaysBookings.find((b) => b.booked === true);
      if (explicitlyBooked) {
        setCurrentBooking(explicitlyBooked);
        setIsBooked(true);
        return;
      }

      // 3️⃣ NEXT MEETING (future)
      const next = ranges
        .filter((r) => r.start > now)
        .sort((a, b) => a.start.getTime() - b.start.getTime())[0];

      if (next) {
        setCurrentBooking(next.booking);
        setIsBooked(true);
        return;
      }

      // 4️⃣ Available
      setCurrentBooking({
        roomName: SELECTED_ROOM,
        date: todayIso,
        time: "",
      } as Booking);

      setIsBooked(false);
    };

    evaluate();
    const t = setInterval(evaluate, 30_000);
    return () => clearInterval(t);
  }, [bookings]);

  // fetch user info if userId present
  useEffect(() => {
    if (!currentBooking?.userId || !currentBooking.loading) return;
    let mounted = true;

    Api.currentUser(currentBooking.userId)
      .then((user: any) => {
        if (!mounted) return;
        setCurrentBooking((prev) =>
          prev
            ? {
                ...prev,
                personName:
                  user?.fullName ||
                  user?.name ||
                  user?.email ||
                  prev.personName,
                email: user?.email || prev.email,
                loading: false,
              }
            : prev
        );
      })
      .catch(() => {
        if (!mounted) return;
        setCurrentBooking((prev) =>
          prev ? { ...prev, loading: false } : prev
        );
      });

    return () => {
      mounted = false;
    };
  }, [currentBooking?.userId]);

  const displayStartEnd = (() => {
    if (!currentBooking || !currentBooking.time) return { start: "", end: "" };
    try {
      const { start, end } = buildRange(
        currentBooking.date || new Date().toISOString().slice(0, 10),
        currentBooking.time
      );
      return { start: formatTimeDisplay(start), end: formatTimeDisplay(end) };
    } catch {
      return { start: "", end: "" };
    }
  })();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-gray-900">Room Status</h2>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full animate-pulse ${
              isBooked ? "bg-red-500" : "bg-green-500"
            }`}
          ></div>
          <span
            className={`px-4 py-1.5 rounded-full ${
              isBooked
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {isBooked ? "Occupied / Next" : "Available Now"}
          </span>
        </div>
      </div>

      <div
        className={`border-2 rounded-xl p-8 transition-all shadow-lg ${
          isBooked ? "border-red-400 bg-red-50" : "border-green-400 bg-green-50"
        }`}
      >
        <div className="mb-6 pb-4 border-b-2 border-gray-200">
          <h3 className="text-gray-900 mb-3 text-2xl font-semibold">
            {currentBooking?.roomName}
          </h3>
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-md ${
              isBooked ? "bg-red-500" : "bg-green-500"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full bg-white ${
                isBooked ? "" : "animate-pulse"
              }`}
            ></div>
            {isBooked
              ? currentBooking?.time
                ? `${displayStartEnd.start} - ${displayStartEnd.end}`
                : "Booked"
              : "Available Now"}
          </span>
        </div>

        {!isBooked && (
          <div className="rounded-lg p-4 mb-6 bg-green-100/50 shadow-sm">
            <div className="flex items-center text-gray-700">
              <div className="p-3 rounded-lg bg-green-200 mr-3">
                <Clock className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">
                  Current Time
                </p>
                <p className="text-gray-900 font-semibold">
                  {formatTimeDisplay(new Date())}
                </p>
              </div>
            </div>
          </div>
        )}

        {isBooked && currentBooking?.time ? (
          <div className="space-y-3">
            <div className="bg-red-100/60 rounded-lg p-4 shadow-sm">
              <div className="flex items-center text-gray-700">
                <div className="p-3 rounded-lg bg-red-200 mr-3">
                  <User className="w-6 h-6 text-red-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Booked By</p>
                  <div className="flex items-center gap-2">
                    {currentBooking.loading ? (
                      <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                    ) : null}
                    <p className="text-gray-900 font-semibold">
                      {currentBooking.personName ||
                        currentBooking.userId ||
                        "Unknown"}
                    </p>
                  </div>
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
        ) : (
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
        )}
      </div>
    </div>
  );
}
