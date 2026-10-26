import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HeroCard } from "@/components/ui/hero-card";
import { SectionLabel } from "@/components/ui/section-label";
import { PersonalSetupForm } from "@/features/personal-sessions/components/personal-setup-form";
import { PersonalHistoryList } from "@/features/personal-sessions/components/personal-history-list";
import { totalFocusedSecondsOn } from "@/features/personal-sessions/lib/today-focused";
import { formatMinutes } from "@/lib/format-session";
import type { PersonalSessionRecord } from "@/features/personal-sessions/types";
import { FocusSkeleton } from "./focus-skeleton";

const RECENT_LIMIT = 5;

/**
 * Personal Mode home — ported from home_page.dart: today's focused time,
 * the start action, and recent sessions below it. Unlike the Flutter
 * screen there's no "Resume Session" branch: a solo session here is a
 * plain client-side timer with nothing persisted until it ends, so there
 * is no running session to resume across a navigation away from this page.
 *
 * Wrapped in an explicit `<Suspense>` (rather than relying on Next's
 * automatic `loading.tsx` convention) so every tab in this shell has the
 * exact same boundary shape — one Suspense, at the same depth, in every
 * sibling page. Mixing an automatic `(shell)/loading.tsx` with each tab's
 * own nested `loading.tsx` produced an asymmetric boundary (two stacked
 * Suspense wrappers for History/Settings, only one for Focus), which is
 * what was behind the dev-console "called use() to suspend in a previous
 * render but did not call use() when it finished" warning and the
 * "destination stream errored while writing data" server error seen while
 * switching tabs.
 */
export default function PersonalPage() {
  return (
    <Suspense fallback={<FocusSkeleton />}>
      <PersonalPageContent />
    </Suspense>
  );
}

async function PersonalPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) redirect("/sign-in");

  const { data: rows } = await supabase
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

  const todayFocusedSeconds = totalFocusedSecondsOn(records, new Date());

  return (
    <main className="mx-auto min-h-screen w-full max-w-sm px-8 py-8">
      <header className="flex items-center pb-6">
        <Link href="/workshop" className="text-[15px] font-medium text-accent">
          ← Workshop
        </Link>
      </header>

      <HeroCard>
        <p className="text-[15px] text-hero-on-surface-muted">Today</p>
        <p className="pt-2 text-[40px] leading-none font-semibold tracking-[-0.5px] tabular-nums">
          {formatMinutes(todayFocusedSeconds)}
        </p>
        <p className="pt-1 text-[15px] text-hero-on-surface-muted">focused</p>
      </HeroCard>

      <div className="h-8" />
      <PersonalSetupForm />

      <div className="mt-10 flex items-center justify-between">
        <SectionLabel>Recent sessions</SectionLabel>
        <Link href="/personal/history" className="text-[15px] font-medium text-accent">
          View all
        </Link>
      </div>
      <div className="h-2" />
      <PersonalHistoryList records={records.slice(0, RECENT_LIMIT)} />
    </main>
  );
}
