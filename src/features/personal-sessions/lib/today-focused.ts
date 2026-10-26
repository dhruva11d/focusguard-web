import type { PersonalSessionRecord } from "../types";

/**
 * Total focused time across all records whose `startedAt` falls on the
 * same calendar day as `day` — ported from today_focused_duration.dart.
 */
export function totalFocusedSecondsOn(records: PersonalSessionRecord[], day: Date): number {
  return records.reduce((total, record) => {
    const startedAt = new Date(record.startedAt);
    const sameDay =
      startedAt.getFullYear() === day.getFullYear() &&
      startedAt.getMonth() === day.getMonth() &&
      startedAt.getDate() === day.getDate();
    return sameDay ? total + record.focusedSeconds : total;
  }, 0);
}
