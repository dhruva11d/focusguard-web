import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Hairline } from "@/components/ui/hairline";
import { statusLabel } from "@/features/sessions/lib/status-label";
import { formatMinutes, formatSessionDate } from "@/lib/format-session";
import type { CommunityHistoryEntry } from "@/features/sessions/types";

/**
 * This device's own Community Mode history — ported from
 * community_history_page.dart. Nothing is recorded locally: a one-time
 * fetch straight from Supabase, same as the Flutter app, since
 * ParticipantStatePublisher/useSessionMonitoring already durably
 * publishes everything this needs.
 */
export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) redirect("/sign-in");

  const { data: rows, error } = await supabase
    .from("participant_sessions")
    .select("state, violation_count, joined_at, completed_at, community_sessions(duration_seconds, rooms(name))")
    .order("joined_at", { ascending: false });

  const entries: CommunityHistoryEntry[] = (rows ?? []).map((row) => {
    const session = Array.isArray(row.community_sessions)
      ? row.community_sessions[0]
      : row.community_sessions;
    const room = session && (Array.isArray(session.rooms) ? session.rooms[0] : session.rooms);
    return {
      roomName: room?.name ?? "Unknown room",
      joinedAt: row.joined_at,
      completedAt: row.completed_at,
      durationSeconds: session?.duration_seconds ?? 0,
      state: row.state,
      violationCount: row.violation_count,
    };
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-sm px-8 py-8">
      <header className="flex items-center pb-6">
        <Link href="/workshop" className="text-[15px] font-medium text-accent">
          ← Community
        </Link>
      </header>
      <h1 className="pb-6 text-[26px] font-semibold tracking-[-0.2px]">
        Community History
      </h1>

      {error ? (
        <p className="py-4 text-[15px] text-violation">Could not load your history.</p>
      ) : entries.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[15px]">No community sessions yet.</p>
          <p className="pt-1 text-[13px] text-on-background-muted">
            Your completed community sessions will appear here.
          </p>
        </div>
      ) : (
        entries.map((entry, i) => (
          <div key={i}>
            <HistoryRow entry={entry} />
            <Hairline />
          </div>
        ))
      )}
    </main>
  );
}

function HistoryRow({ entry }: { entry: CommunityHistoryEntry }) {
  const status = statusLabel(entry.state);
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-[15px]">{entry.roomName}</p>
        <p className="text-[13px] text-on-background-muted">
          {formatSessionDate(entry.joinedAt)} · {formatMinutes(entry.durationSeconds)}
        </p>
      </div>
      <span className="text-[13px] font-medium" style={{ color: status.color }}>
        {status.label}
        {entry.violationCount > 0 ? ` · ${entry.violationCount}` : ""}
      </span>
    </div>
  );
}
