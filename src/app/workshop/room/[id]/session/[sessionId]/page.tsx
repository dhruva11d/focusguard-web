import { redirect } from "next/navigation";
import { getCurrentAccountServer, serverBackendGet } from "@/lib/backend/server";
import { SessionView } from "@/features/sessions/components/session-view";
import type { CommunitySession } from "@/features/sessions/types";

type RoomDetails = { id: string; name: string; hostId: string };

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const account = await getCurrentAccountServer();
  if (!account) redirect("/sign-in");

  let session: CommunitySession | null = null;
  let room: RoomDetails | null = null;
  try {
    [session, room] = await Promise.all([
      serverBackendGet<CommunitySession>(`/api/sessions/${encodeURIComponent(sessionId)}`),
      serverBackendGet<RoomDetails>(`/api/rooms/id/${encodeURIComponent(id)}`),
    ]);
  } catch {
    redirect(`/workshop/room/${id}`);
  }
  if (!session || !room || session.roomId !== id) redirect(`/workshop/room/${id}`);

  return (
    <SessionView
      session={session}
      roomName={room.name}
      currentUserId={account.id}
      isHost={room.hostId === account.id}
    />
  );
}
