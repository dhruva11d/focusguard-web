import { Suspense } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentAccountServer, serverBackendGet } from "@/lib/backend/server";
import { SectionLabel } from "@/components/ui/section-label";
import { PersonalHistoryList } from "@/features/personal-sessions/components/personal-history-list";
import { PersonalWeekSection } from "@/features/personal-sessions/components/personal-week-section";
import { PersonalStatsSummary } from "@/features/personal-sessions/components/personal-stats-summary";
import { computeHistoryStats } from "@/features/personal-sessions/lib/history-stats";
import type { PersonalSessionRecord } from "@/features/personal-sessions/types";
import { HistorySkeleton } from "./history-skeleton";

type PersonalSessionDto = PersonalSessionRecord & { id: string; clientId: string; callExemptionCount: number; createdAt: string };

export default function PersonalHistoryPage() {
  return <Suspense fallback={<HistorySkeleton />}><PersonalHistoryPageContent /></Suspense>;
}

async function PersonalHistoryPageContent() {
  const account = await getCurrentAccountServer();
  if (!account) redirect("/sign-in");
  let records: PersonalSessionRecord[] = [];
  let loadError = false;
  try {
    const rows = await serverBackendGet<PersonalSessionDto[]>("/api/personal-sessions");
    records = (rows ?? []).map(({ startedAt, totalSeconds, focusedSeconds, outcome, violationCount }) => ({
      startedAt, totalSeconds, focusedSeconds, outcome, violationCount,
    }));
  } catch {
    loadError = true;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-sm px-8 py-8">
      <h1 className="pb-6 text-[26px] font-semibold tracking-[-0.2px]">Session History</h1>
      {loadError ? (
        <p className="py-4 text-[15px] text-violation">Could not load your history.</p>
      ) : records.length === 0 ? (
        <div className="py-12 text-center">
          <Image src="/images/empty-calendar.png" alt="" width={300} height={200} priority style={{ height: 200, width: "auto" }} className="mx-auto object-contain" />
          <p className="pt-2 text-[15px]">No focus sessions yet.</p>
          <p className="pt-1 text-[13px] text-on-background-muted">Start your first session to build your history.</p>
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
