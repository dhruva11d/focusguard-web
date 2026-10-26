import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionView } from "@/features/sessions/components/session-view";
import type { CommunitySession } from "@/features/sessions/types";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) redirect("/sign-in");

  const [{ data: sessionRow }, { data: roomRow }] = await Promise.all([
    // RLS ("room members can read sessions") returns this only to the
    // room's host or a member.
    supabase.from("community_sessions").select().eq("id", sessionId).eq("room_id", id).single(),
    supabase.from("rooms").select("name, host_id").eq("id", id).single(),
  ]);
  if (!sessionRow || !roomRow) redirect(`/workshop/room/${id}`);

  const session: CommunitySession = {
    id: sessionRow.id,
    roomId: sessionRow.room_id,
    durationSeconds: sessionRow.duration_seconds,
    status: sessionRow.status,
    startTime: sessionRow.start_time,
    endTime: sessionRow.end_time,
  };

  return (
    <SessionView
      session={session}
      roomName={roomRow.name}
      currentUserId={user.id}
      isHost={roomRow.host_id === user.id}
    />
  );
}
