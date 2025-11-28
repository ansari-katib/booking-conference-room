import { Clock, User, Mail, Loader2 } from "lucide-react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { useEffect, useState } from "react";
import { Api } from "../../lib/ApiEndpoint";

interface BookedRoomsProps {
  roomName?: string;
}

interface BookedRoomItem {
  id?: string;
  roomName: string;
  date?: string;
  time?: string;
  personName?: string;
  email?: string | null;
  status: "ongoing" | "upcoming";
  booked?: boolean;
  userId?: string;
  start: Date;
  end: Date;
}

function to24HourSimple(t: string) {
  const m = t.trim().match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  if (!m) return t;
  let hh = parseInt(m[1], 10);
  const mm = m[2];
  const ampm = m[3];
  if (ampm) {
    if (/pm/i.test(ampm) && hh !== 12) hh += 12;
    if (/am/i.test(ampm) && hh === 12) hh = 0;
  }
  return `${hh.toString().padStart(2, "0")}:${mm}`;
}

function buildRangeForList(dateStr = "", time = "") {
  const dateIso = (() => {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  })();
  const parts = time
    .split("-")
    .map((s) => s.trim())
    .filter(Boolean);
  const start = parts[0] ? to24HourSimple(parts[0]) : "00:00";
  const end = parts[1]
    ? to24HourSimple(parts[1])
    : (() => {
        const [h, m] = start.split(":").map(Number);
        return `${((h + 1) % 24).toString().padStart(2, "0")}:${m
          .toString()
          .padStart(2, "0")}`;
      })();
  const s = new Date(`${dateIso}T${start}:00`);
  const e = new Date(`${dateIso}T${end}:00`);
  if (e <= s) e.setDate(e.getDate() + 1);
  return { s, e };
}

function formatHHMM(d: Date) {
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function formatRangeLabel(start: Date, end: Date) {
  return `${formatHHMM(start)} - ${formatHHMM(end)}`;
}

export function BookedRooms({ roomName }: BookedRoomsProps) {
  const [items, setItems] = useState<BookedRoomItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomName) {
      setItems([]);
      setError(null);
      return;
    }

    let mounted = true;

    const load = async (showSpinner = false) => {
      if (showSpinner) setIsLoading(true);
      setError(null);

      try {
        const data = await Api.getBookedSlotsByRoom(roomName);
        if (!mounted) return;
        const now = new Date();

        const enriched = (Array.isArray(data) ? data : [])
          .filter(Boolean)
          .map((b: any) => {
            const dateStr = b.date || new Date().toISOString().slice(0, 10);
            const timeRaw = b.time || "";
            const { s, e } = buildRangeForList(dateStr, timeRaw);
            if (e <= now) return null;

            const status: BookedRoomItem["status"] =
              now >= s && now < e ? "ongoing" : "upcoming";

            return {
              id: b._id || b.id,
              roomName: b.roomName,
              date: dateStr,
              time: formatRangeLabel(s, e),
              personName:
                b.personName ||
                b.user?.fullName ||
                b.user?.email ||
                b.email ||
                b.userId ||
                "Unknown",
              email: b.email || b.user?.email || null,
              status,
              booked: !!b.booked,
              userId: b.userId,
              start: s,
              end: e,
            } as BookedRoomItem;
          })
          .filter((item): item is BookedRoomItem => Boolean(item))
          .sort((a, b) => a.start.getTime() - b.start.getTime());

        setItems(enriched);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load booked rooms", err);
        setItems([]);
        setError("Unable to load bookings right now.");
      } finally {
        if (showSpinner && mounted) setIsLoading(false);
      }
    };

    load(true);
    const t = setInterval(() => load(false), 60_000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [roomName]);

  const ongoingBookings = items.filter((room) => room.status === "ongoing");
  const upcomingBookings = items.filter((room) => room.status === "upcoming");
  const currentBooking = ongoingBookings[0] ?? null;

  const renderRoomCard = (room: BookedRoomItem, isOngoing: boolean) => (
    <div
      key={room.id || `${room.roomName}-${room.date}-${room.time}`}
      className={`border-l-4 rounded-lg p-4 transition-all ${
        isOngoing
          ? "border-red-500 bg-red-50 shadow-md"
          : "border-amber-400 bg-amber-50"
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className={`w-2 h-2 rounded-full ${
            isOngoing ? "bg-red-500 animate-pulse" : "bg-amber-500"
          }`}
        ></div>
        <span
          className={`text-xs uppercase tracking-wide font-semibold ${
            isOngoing ? "text-red-600" : "text-amber-600"
          }`}
        >
          {isOngoing ? "In Progress" : "Next in Line"}
        </span>
      </div>

      <h3 className="text-gray-900 font-semibold mb-4">{room.roomName}</h3>

      <div className="space-y-3 text-sm text-gray-600">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2 text-red-500" />
          <span>{room.time}</span>
        </div>
        <div className="flex items-center">
          <User className="w-4 h-4 mr-2 text-red-500" />
          <span>{room.personName}</span>
        </div>
        <div className="flex items-center">
          <Mail className="w-4 h-4 mr-2 text-red-500" />
          <span className="truncate">{room.email || "—"}</span>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!roomName) {
      return (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-500">
          Select a room to see who is inside
        </div>
      );
    }

    if (isLoading && items.length === 0) {
      return (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin text-red-500" />
          <p>Loading bookings…</p>
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

    return (
      <div className="space-y-8">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-red-600">
              In Progress
            </h3>
            <span className="text-xs text-gray-500">
              {ongoingBookings.length} active
            </span>
          </div>

          {ongoingBookings.length > 0 ? (
            <div className="space-y-4">
              {ongoingBookings.map((room) => renderRoomCard(room, true))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white py-8 text-center text-gray-500">
              No ongoing meetings
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-600">
              Upcoming Today
            </h3>
            <span className="text-xs text-gray-500">
              {upcomingBookings.length} scheduled
            </span>
          </div>

          {upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.map((room) => renderRoomCard(room, false))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white py-8 text-center text-gray-500">
              No more bookings for today
            </div>
          )}
        </section>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-gray-900">Booked Rooms</h2>
          <p className="text-sm text-gray-500">
            {roomName
              ? `Live bookings for ${roomName}`
              : "Pick a room to see current meeting details"}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentBooking ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {isLoading ? "Refreshing…" : ongoingBookings.length ? "In Progress" : "Idle"}
        </span>
      </div>

      <ScrollArea.Root className="h-[70vh] overflow-hidden">
        <ScrollArea.Viewport className="w-full h-full">
          <div className="pr-4">{renderContent()}</div>
        </ScrollArea.Viewport>

        <ScrollArea.Scrollbar
          className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-150 ease-out hover:bg-gray-200 data-[orientation=vertical]:w-2.5"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="flex-1 bg-red-300 rounded-[10px]" />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner className="bg-gray-100" />
      </ScrollArea.Root>
    </div>
  );
}

export default BookedRooms;
