import { createClient } from "@/lib/supabase/client";
import type { PersonalSessionOutcome } from "../types";

/**
 * Writes one `personal_sessions` row when a solo session reaches a
 * terminal status — the web counterpart to SessionHistoryRecorder +
 * SupabaseSessionHistoryRepository.record, minus the device-local
 * offline outbox (a web tab has no equivalent "finished while offline,
 * sync later" case worth building for). `client_id` reuses the same
 * `userId:startedAtEpoch` shape the Flutter app writes, with the same
 * upsert/ignoreDuplicates idempotency — so a duplicate call (e.g. a
 * retry) can never create a second row for the same session.
 * call_exemption_count is always 0: there's no concept of a phone call
 * exempting a violation in a browser tab.
 */
export async function recordPersonalSession(params: {
  userId: string;
  startedAt: Date;
  totalSeconds: number;
  focusedSeconds: number;
  outcome: PersonalSessionOutcome;
  violationCount: number;
}): Promise<void> {
  const supabase = createClient();
  const clientId = `${params.userId}:${params.startedAt.getTime() * 1000}`;
  const { error } = await supabase.from("personal_sessions").upsert(
    {
      client_id: clientId,
      user_id: params.userId,
      started_at: params.startedAt.toISOString(),
      total_seconds: params.totalSeconds,
      focused_seconds: params.focusedSeconds,
      outcome: params.outcome,
      violation_count: params.violationCount,
      call_exemption_count: 0,
    },
    { onConflict: "client_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("[personal-sessions] could not save session:", error.message);
  }
}
