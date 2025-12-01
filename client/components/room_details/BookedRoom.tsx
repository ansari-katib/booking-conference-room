import { Clock, User, Mail, Loader2 } from "lucide-react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { useEffect, useState } from "react";
import { Api } from "../../lib/ApiEndpoint";
import { cn } from "@/lib/utils";

interface BookedRoomsProps {
  roomName?: string;
  isDarkMode?: boolean;
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

export function BookedRooms({ roomName, isDarkMode = false }: BookedRoomsProps) {
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
      className={cn(
        "border-l-4 rounded-lg p-3 sm:p-4 transition-all",
        isOngoing
          ? "border-destructive bg-destructive/10 dark:bg-destructive/20 shadow-md"
          : "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
      )}
    >
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isOngoing ? "bg-destructive animate-pulse" : "bg-amber-500"
          )}
        ></div>
        <span
          className={cn(
            "text-xs uppercase tracking-wide font-semibold",
            isOngoing ? "text-destructive" : "text-amber-600 dark:text-amber-400"
          )}
        >
          {isOngoing ? "In Progress" : "Next in Line"}
        </span>
      </div>

      <h3 className="font-semibold mb-3 sm:mb-4 text-foreground text-sm sm:text-base">{room.roomName}</h3>

      <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-destructive shrink-0" />
          <span>{room.time}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-3 h-3 sm:w-4 sm:h-4 text-destructive shrink-0" />
          <span className="truncate">{room.personName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-destructive shrink-0" />
          <span className="truncate">{room.email || "—"}</span>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!roomName) {
      return (
        <div className="flex h-32 sm:h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground text-sm text-center px-4">
          Select a room to see who is inside
        </div>
      );
    }

    if (isLoading && items.length === 0) {
      return (
        <div className="flex h-32 sm:h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-destructive" />
          <p className="text-sm">Loading bookings…</p>
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

    return (
      <div className="space-y-6 sm:space-y-8">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-destructive">
              In Progress
            </h3>
            <span className="text-xs text-muted-foreground">
              {ongoingBookings.length} active
            </span>
          </div>

          {ongoingBookings.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {ongoingBookings.map((room) => renderRoomCard(room, true))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 py-6 sm:py-8 text-center text-muted-foreground text-sm">
              No ongoing meetings
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Upcoming Today
            </h3>
            <span className="text-xs text-muted-foreground">
              {upcomingBookings.length} scheduled
            </span>
          </div>

          {upcomingBookings.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {upcomingBookings.map((room) => renderRoomCard(room, false))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 py-6 sm:py-8 text-center text-muted-foreground text-sm">
              No more bookings for today
            </div>
          )}
        </section>
      </div>
    );
  };

  return (
    <div className="rounded-lg shadow-sm border border-border bg-card p-4 sm:p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-foreground text-lg sm:text-xl font-semibold mb-1">Booked Rooms</h2>
          <p className="text-sm text-muted-foreground">
            {roomName
              ? `Live bookings for ${roomName}`
              : "Pick a room to see current meeting details"}
          </p>
        </div>
        <span
          className={cn(
            "px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shrink-0",
            currentBooking
              ? "bg-destructive/10 text-destructive dark:bg-destructive/20"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isLoading ? "Refreshing…" : ongoingBookings.length ? "In Progress" : "Idle"}
        </span>
      </div>

      <ScrollArea.Root className="flex-1 overflow-hidden min-h-0">
        <ScrollArea.Viewport className="w-full h-full">
          <div className="pr-2 sm:pr-4">{renderContent()}</div>
        </ScrollArea.Viewport>

        <ScrollArea.Scrollbar
          className="flex select-none touch-none p-0.5 bg-muted transition-colors duration-150 ease-out hover:bg-muted/80 data-[orientation=vertical]:w-2.5"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="flex-1 bg-destructive/30 rounded-[10px] hover:bg-destructive/40" />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner className="bg-muted" />
      </ScrollArea.Root>
    </div>
  );
}

export default BookedRooms;
