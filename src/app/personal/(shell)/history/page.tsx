import { Suspense } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { SectionLabel } from "@/components/ui/section-label";
import { PersonalHistoryList } from "@/features/personal-sessions/components/personal-history-list";
import { PersonalWeekSection } from "@/features/personal-sessions/components/personal-week-section";
import { PersonalStatsSummary } from "@/features/personal-sessions/components/personal-stats-summary";
import { computeHistoryStats } from "@/features/personal-sessions/lib/history-stats";
import type { PersonalSessionRecord } from "@/features/personal-sessions/types";
import { HistorySkeleton } from "./history-skeleton";

/**
 * The full session history — ported from session_history_page.dart: the
 * weekly curve + stat-pill grid, the all-time stats summary, then every
 * recorded session. `/personal` only shows the 5 most recent and today's
 * total; this is where "View all" leads.
 *
 * See `(shell)/page.tsx`'s doc comment for why this uses an explicit
 * `<Suspense>` instead of a `loading.tsx` file.
 */
export default function PersonalHistoryPage() {
  return (
    <Suspense fallback={<HistorySkeleton />}>
      <PersonalHistoryPageContent />
    </Suspense>
  );
}

async function PersonalHistoryPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) redirect("/sign-in");

  const { data: rows, error } = await supabase
    .from("personal_sessions")
    .select("started_at, total_seconds, focused_seconds, outcome, violation_count")
    .order("started_at", { ascending: false });

  const records: PersonalSessionRecord[] = (rows ?? []).map((r) => ({
    startedAt: r.started_at,
    totalSeconds: r.total_seconds,
    focusedSeconds: r.focused_seconds,
    outcome: r.outcome,
    violationCount: r.violation_count,
  }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-sm px-8 py-8">
      <h1 className="pb-6 text-[26px] font-semibold tracking-[-0.2px]">Session History</h1>

      {error ? (
        <p className="py-4 text-[15px] text-violation">Could not load your history.</p>
      ) : records.length === 0 ? (
        <div className="py-12 text-center">
          <Image
            src="/images/empty-calendar.png"
            alt=""
            width={300}
            height={200}
            priority
            style={{ height: 200, width: "auto" }}
            className="mx-auto object-contain"
          />
          <p className="pt-2 text-[15px]">No focus sessions yet.</p>
          <p className="pt-1 text-[13px] text-on-background-muted">
            Start your first session to build your history.
          </p>
        </div>
      ) : (
        <>
          <PersonalWeekSection records={records} />
          <div className="h-8" />
          <SectionLabel>All time</SectionLabel>
          <div className="h-4" />
          <PersonalStatsSummary stats={computeHistoryStats(records)} />
          <div className="h-8" />
          <SectionLabel>Recent sessions</SectionLabel>
          <div className="h-2" />
          <PersonalHistoryList records={records} />
        </>
      )}
    </main>
  );
}
