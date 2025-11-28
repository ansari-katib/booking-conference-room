// ...existing code...
import { Calendar, Clock, User, Mail, Loader2 } from "lucide-react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { useEffect, useState } from "react";
import { Api } from "../../lib/ApiEndpoint";

interface BookedRoomItem {
  id?: string;
  roomName: string;
  date?: string;
  time?: string; // formatted "HH:MM - HH:MM"
  personName?: string;
  email?: string | null;
  status?: "ongoing" | "upcoming";
  booked?: boolean;
  userId?: string;
  loading?: boolean;
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

export function BookedRooms() {
  const [items, setItems] = useState<BookedRoomItem[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await Api.getAll();
        if (!mounted) return;
        const now = new Date();

        const booked = (Array.isArray(data) ? data : []).filter(
          (b: any) => b.booked === true
        );

        // initial items with loading flag for entries that have userId
        const initial: BookedRoomItem[] = booked.map((b: any) => {
          const dateStr = b.date || new Date().toISOString().slice(0, 10);
          const timeRaw = b.time || "";
          const { s, e } = buildRangeForList(dateStr, timeRaw);
          const timeFormatted = `${formatHHMM(s)} - ${formatHHMM(e)}`;

          let status: BookedRoomItem["status"] = "upcoming";
          if (now >= s && now < e) status = "ongoing";
          else if (s > now) status = "upcoming";

          return {
            id: b._id || b.id,
            roomName: b.roomName,
            date: dateStr,
            time: timeFormatted,
            personName: b.personName || "Unknown",
            email: b.email || null,
            status,
            booked: !!b.booked,
            userId: b.userId,
            loading: !!b.userId,
          } as BookedRoomItem;
        });

        setItems(initial);

        // fetch user info per booking using /auth/me/:id
        await Promise.all(
          booked.map(async (b: any) => {
            if (!b.userId) return;
            try {
              const user = await Api.currentUser(b.userId);
              if (!mounted) return;
              setItems((prev) =>
                prev.map((it) =>
                  it.id === (b._id || b.id)
                    ? {
                        ...it,
                        personName:
                          user?.fullName ||
                          user?.name ||
                          user?.email ||
                          it.personName,
                        email: user?.email || it.email,
                        loading: false,
                      }
                    : it
                )
              );
            } catch (err) {
              if (!mounted) return;
              setItems((prev) =>
                prev.map((it) =>
                  it.id === (b._id || b.id) ? { ...it, loading: false } : it
                )
              );
              console.warn("Failed to fetch user for booking", b.userId, err);
            }
          })
        );
      } catch (err) {
        console.error("Failed to load booked rooms", err);
      }
    }

    load();
    const t = setInterval(load, 60_000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);


  // show only the bookings belonging to selected room
  const SELECTED_ROOM = "Board Room A";
  const filteredByRoom = items.filter((r) => r.roomName === SELECTED_ROOM);

  // Separate ongoing and upcoming for ONLY this room
  const ongoingRooms = filteredByRoom.filter(
    (room) => room.status === "ongoing"
  );
  const upcomingRooms = filteredByRoom.filter(
    (room) => room.status === "upcoming"
  );

  const sortedItems = [...ongoingRooms, ...upcomingRooms];

  const renderRoomCard = (room: BookedRoomItem, isOngoing: boolean) => (
    <div
      key={room.id || `${room.roomName}-${room.date}`}
      className={`border-l-4 rounded-lg p-4 transition-all hover:shadow-md ${
        isOngoing
          ? "border-red-500 bg-red-50 shadow-md"
          : "border-red-300 bg-red-50/50"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isOngoing ? "bg-red-500 animate-pulse" : "bg-red-400"
              }`}
            ></div>
            <span className="text-xs text-red-600 uppercase tracking-wide font-semibold">
              {isOngoing ? "🔴 In Progress" : "Booked"}
            </span>
          </div>
          <h3 className="text-gray-900 font-semibold">{room.roomName}</h3>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-gray-600 text-sm">
          <Clock className="w-4 h-4 mr-2 text-red-500" />
          <span>{room.time}</span>
        </div>

        <div className="flex items-center text-gray-600 text-sm">
          <User className="w-4 h-4 mr-2 text-red-500" />
          <span className="flex items-center gap-2">
            {room.loading ? (
              <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
            ) : null}
            <span>{room.personName}</span>
          </span>
        </div>

        <div className="flex items-center text-gray-600 text-sm">
          <Mail className="w-4 h-4 mr-2 text-red-500" />
          <span className="truncate">{room.email || "—"}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900">Booked Rooms</h2>
        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
          {filteredByRoom.length} Active
        </span>
      </div>

      <ScrollArea.Root className="h-[70vh] overflow-hidden">
        <ScrollArea.Viewport className="w-full h-full">
          <div className="space-y-4 pr-4">
            {/* Ongoing Room - Show at Top */}
            {ongoingRooms.length > 0 && (
              <>
                <div className="mb-4 pb-4 border-b-2 border-red-200">
                  <h3 className="text-sm font-bold text-red-600 uppercase tracking-widest mb-3">
                    Currently In Progress
                  </h3>
                  {ongoingRooms.map((room) => renderRoomCard(room, true))}
                </div>
              </>
            )}

            {/* Upcoming Rooms */}
            {upcomingRooms.length > 0 && (
              <>
                <div>
                  <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-3">
                    Upcoming Bookings
                  </h3>
                  <div className="space-y-4">
                    {upcomingRooms.map((room) => renderRoomCard(room, false))}
                  </div>
                </div>
              </>
            )}

            {items.length === 0 && (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <p>No booked rooms yet</p>
              </div>
            )}
          </div>
        </ScrollArea.Viewport>

        <ScrollArea.Scrollbar
          className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-150 ease-out hover:bg-gray-200 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="flex-1 bg-red-300 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-11 before:min-h-11" />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner className="bg-gray-100" />
      </ScrollArea.Root>
    </div>
  );
}
