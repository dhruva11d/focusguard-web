import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAccountServer, serverBackendGet } from "@/lib/backend/server";
import { HeroCard } from "@/components/ui/hero-card";
import { SectionLabel } from "@/components/ui/section-label";
import { PersonalSetupForm } from "@/features/personal-sessions/components/personal-setup-form";
import { PersonalHistoryList } from "@/features/personal-sessions/components/personal-history-list";
import { totalFocusedSecondsOn } from "@/features/personal-sessions/lib/today-focused";
import { formatMinutes } from "@/lib/format-session";
import type { PersonalSessionRecord } from "@/features/personal-sessions/types";
import { FocusSkeleton } from "./focus-skeleton";

const RECENT_LIMIT = 5;
type PersonalSessionDto = PersonalSessionRecord & { id: string; clientId: string; callExemptionCount: number; createdAt: string };

export default function PersonalPage() {
  return <Suspense fallback={<FocusSkeleton />}><PersonalPageContent /></Suspense>;
}

async function PersonalPageContent() {
  const account = await getCurrentAccountServer();
  if (!account) redirect("/sign-in");
  let records: PersonalSessionRecord[] = [];
  try {
    const rows = await serverBackendGet<PersonalSessionDto[]>("/api/personal-sessions");
    records = (rows ?? []).map(({ startedAt, totalSeconds, focusedSeconds, outcome, violationCount }) => ({
      startedAt, totalSeconds, focusedSeconds, outcome, violationCount,
    }));
  } catch {
    // Keep the focus timer available if history is temporarily unavailable.
  }
  const todayFocusedSeconds = totalFocusedSecondsOn(records, new Date());

  return (
    <main className="mx-auto min-h-screen w-full max-w-sm px-8 py-8">
      <header className="flex items-center pb-6"><Link href="/workshop" className="text-[15px] font-medium text-accent">← Workshop</Link></header>
      <HeroCard>
        <p className="text-[15px] text-hero-on-surface-muted">Today</p>
        <p className="pt-2 text-[40px] leading-none font-semibold tracking-[-0.5px] tabular-nums">{formatMinutes(todayFocusedSeconds)}</p>
        <p className="pt-1 text-[15px] text-hero-on-surface-muted">focused</p>
      </HeroCard>
      <div className="h-8" />
      <PersonalSetupForm />
      <div className="mt-10 flex items-center justify-between">
        <SectionLabel>Recent sessions</SectionLabel>
        <Link href="/personal/history" className="text-[15px] font-medium text-accent">View all</Link>
      </div>
      <div className="h-2" />
      <PersonalHistoryList records={records.slice(0, RECENT_LIMIT)} />
    </main>
  );
}
