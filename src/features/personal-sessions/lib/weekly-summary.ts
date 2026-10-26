import type { PersonalSessionRecord } from "../types";

/** The Sunday at 00:00 (local) that starts the week containing `day` —
 * ported from weekly_focus_summary.dart's `startOfWeek`. */
export function startOfWeek(day: Date): Date {
  const midnight = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  return new Date(midnight.getFullYear(), midnight.getMonth(), midnight.getDate() - midnight.getDay());
}

export interface WeeklyFocusSummary {
  weekStart: Date;
  /** Focused seconds for each of the 7 days, Sunday first. */
  dailyFocusedSeconds: number[];
  sessionCount: number;
  violationCount: number;
  totalFocusedSeconds: number;
  averageSessionLengthSeconds: number;
}

function daysBetweenUtc(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcA - utcB) / 86_400_000);
}

/** Ported from `summarizeWeek` — pure, takes `weekStart` rather than
 * reading a clock. */
export function summarizeWeek(records: PersonalSessionRecord[], weekStart: Date): WeeklyFocusSummary {
  const dailyFocusedSeconds = new Array(7).fill(0);
  let sessionCount = 0;
  let violationCount = 0;

  for (const record of records) {
    const started = new Date(record.startedAt);
    const index = daysBetweenUtc(started, weekStart);
    if (index < 0 || index > 6) continue;
    dailyFocusedSeconds[index] += record.focusedSeconds;
    sessionCount++;
    violationCount += record.violationCount;
  }

  const totalFocusedSeconds = dailyFocusedSeconds.reduce((a, b) => a + b, 0);
  return {
    weekStart,
    dailyFocusedSeconds,
    sessionCount,
    violationCount,
    totalFocusedSeconds,
    averageSessionLengthSeconds: sessionCount === 0 ? 0 : Math.floor(totalFocusedSeconds / sessionCount),
  };
}

/** Whole-percent change from `previous` to `current`, or `null` when
 * there's no previous value to compare against. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "Jun 8 – Jun 14" for the 7-day week starting on `weekStart`. */
export function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
  const part = (d: Date) => `${MONTH_ABBREVIATIONS[d.getMonth()]} ${d.getDate()}`;
  return `${part(weekStart)} – ${part(end)}`;
}
