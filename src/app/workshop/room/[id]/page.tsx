import { redirect } from "next/navigation";
import { getCurrentAccountServer, serverBackendGet } from "@/lib/backend/server";
import { WaitingRoom } from "@/features/rooms/components/waiting-room";
import type { Room } from "@/features/rooms/types";

const DEFAULT_DURATION_MINUTES = 25;
const MAX_DURATION_MINUTES = 180;
type RoomDto = Room;

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ duration?: string }>;
}) {
  const { id } = await params;
  const { duration } = await searchParams;
  const account = await getCurrentAccountServer();
  if (!account) redirect("/sign-in");
  let room: RoomDto | null = null;
  try {
    room = await serverBackendGet<RoomDto>(`/api/rooms/id/${encodeURIComponent(id)}`);
  } catch {
    room = null;
  }
  if (!room) redirect("/workshop");

  const parsedMinutes = Number(duration);
  const initialDurationMinutes = Number.isFinite(parsedMinutes) && parsedMinutes > 0
    ? Math.min(Math.round(parsedMinutes), MAX_DURATION_MINUTES)
    : DEFAULT_DURATION_MINUTES;
  return <WaitingRoom room={room} isHost={room.hostId === account.id} initialDurationMinutes={initialDurationMinutes} />;
}
