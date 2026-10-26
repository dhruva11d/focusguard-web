import type { PersonalSessionRecord } from "../types";

/** Ported from `SessionHistoryStats.compute` — "interrupted" means "had
 * at least one violation", independent of outcome. */
export interface PersonalHistoryStats {
  totalSessions: number;
  completedSessions: number;
  interruptedSessions: number;
  totalFocusedSeconds: number;
  averageSessionLengthSeconds: number;
  totalViolations: number;
  totalCallExemptions: number;
  longestUninterruptedSeconds: number;
}

const EMPTY: PersonalHistoryStats = {
  totalSessions: 0,
  completedSessions: 0,
  interruptedSessions: 0,
  totalFocusedSeconds: 0,
  averageSessionLengthSeconds: 0,
  totalViolations: 0,
  totalCallExemptions: 0,
  longestUninterruptedSeconds: 0,
};

export function computeHistoryStats(records: PersonalSessionRecord[]): PersonalHistoryStats {
  if (records.length === 0) return EMPTY;

  let totalFocused = 0;
  let interrupted = 0;
  let completed = 0;
  let totalViolations = 0;
  let longestUninterrupted = 0;

  for (const record of records) {
    totalFocused += record.focusedSeconds;
    totalViolations += record.violationCount;
    if (record.outcome === "completed") completed++;
    if (record.violationCount > 0) {
      interrupted++;
    } else if (record.focusedSeconds > longestUninterrupted) {
      longestUninterrupted = record.focusedSeconds;
    }
  }

  return {
    totalSessions: records.length,
    completedSessions: completed,
    interruptedSessions: interrupted,
    totalFocusedSeconds: totalFocused,
    averageSessionLengthSeconds: Math.floor(totalFocused / records.length),
    totalViolations,
    // Always 0 on the web: there's no call-state API to exempt a call
    // from counting as an interruption (see usePersonalFocusSession's
    // doc comment) — shown for structural parity with the Flutter stats
    // screen, not fabricated.
    totalCallExemptions: 0,
    longestUninterruptedSeconds: longestUninterrupted,
  };
}
