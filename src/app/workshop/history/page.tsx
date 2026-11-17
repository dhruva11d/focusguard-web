import { BackLink } from "@/components/ui/back-link";
import { redirect } from "next/navigation";
import { getCurrentAccountServer, serverBackendGet } from "@/lib/backend/server";
import { Hairline } from "@/components/ui/hairline";
import { statusLabel } from "@/features/sessions/lib/status-label";
import { formatMinutes, formatSessionDate } from "@/lib/format-session";
import type { CommunityHistoryEntry } from "@/features/sessions/types";

export default async function HistoryPage() {
  const account = await getCurrentAccountServer();
  if (!account) redirect("/sign-in");
  let entries: CommunityHistoryEntry[] = [];
  let loadError = false;
  try {
    entries = await serverBackendGet<CommunityHistoryEntry[]>("/api/participant-sessions/history") ?? [];
  } catch {
    loadError = true;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-sm px-8 py-8">
      <header className="flex items-center pb-6"><BackLink href="/workshop" label="Community" /></header>
      <h1 className="pb-6 text-[26px] font-semibold tracking-[-0.2px]">Community History</h1>
      {loadError ? (
        <p className="py-4 text-[15px] text-violation">Could not load your history.</p>
      ) : entries.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[15px]">No community sessions yet.</p>
          <p className="pt-1 text-[13px] text-on-background-muted">Your completed community sessions will appear here.</p>
        </div>
      ) : entries.map((entry, i) => (
        <div key={`${entry.joinedAt}-${i}`}><HistoryRow entry={entry} /><Hairline /></div>
      ))}
    </main>
  );
}

function HistoryRow({ entry }: { entry: CommunityHistoryEntry }) {
  const status = statusLabel(entry.state);
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-[15px]">{entry.roomName}</p>
        <p className="text-[13px] text-on-background-muted">{formatSessionDate(entry.joinedAt)} · {formatMinutes(entry.durationSeconds)}</p>
      </div>
      <span className="text-[13px] font-medium" style={{ color: status.color }}>{status.label}{entry.violationCount > 0 ? ` · ${entry.violationCount}` : ""}</span>
    </div>
  );
}
