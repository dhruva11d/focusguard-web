import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WaitingRoom } from "@/features/rooms/components/waiting-room";
import type { Room } from "@/features/rooms/types";

const DEFAULT_DURATION_MINUTES = 25;
const MAX_DURATION_MINUTES = 180; // DurationPicker's slider max

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ duration?: string }>;
}) {
  const { id } = await params;
  const { duration } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) redirect("/sign-in");

  // RLS only returns this row to the room's host or a member — anyone
  // else gets zero rows, which reads the same as "doesn't exist" rather
  // than leaking that the room exists but they can't see it.
  const { data: row } = await supabase.from("rooms").select().eq("id", id).single();
  if (!row) redirect("/workshop");

  const room: Room = {
    id: row.id,
    code: row.code,
    name: row.name,
    hostId: row.host_id,
    status: row.status === "closed" ? "closed" : "open",
    createdAt: row.created_at,
  };
  const isHost = room.hostId === user.id;
  // Carried from Create Room as a query param rather than Flutter's
  // in-memory navigation `extra` — a web page can be reloaded or opened
  // fresh from a link, so the duration has to survive that. Only a
  // starting value: the host can still change it in the waiting room,
  // and a host arriving from "Your rooms" (no param) gets the default.
  const parsedMinutes = Number(duration);
  const initialDurationMinutes =
    Number.isFinite(parsedMinutes) && parsedMinutes > 0
      ? Math.min(Math.round(parsedMinutes), MAX_DURATION_MINUTES)
      : DEFAULT_DURATION_MINUTES;

  return (
    <WaitingRoom
      room={room}
      isHost={isHost}
      initialDurationMinutes={initialDurationMinutes}
    />
  );
}
