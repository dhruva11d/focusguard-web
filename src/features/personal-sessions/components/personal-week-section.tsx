"use client";

import { useState } from "react";
import { CurveChartCard } from "@/components/ui/curve-chart-card";
import { StatPill, AddPill } from "@/components/ui/stat-pill";
import { formatMinutes } from "@/lib/format-session";
import { startOfWeek, summarizeWeek, formatWeekRange } from "../lib/weekly-summary";
import type { PersonalSessionRecord } from "../types";

/**
 * The weekly curve card with its day selector, then a 2×2 grid of vivid
 * metric pills — ported from session_history_page.dart's `_WeekSection`.
 * Owns only transient view state (which week/day are showing); everything
 * it displays is derived from `records`.
 */
export function PersonalWeekSection({ records }: { records: PersonalSessionRecord[] }) {
  const currentWeekStart = startOfWeek(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  function weekStartFor(offset: number): Date {
    return new Date(
      currentWeekStart.getFullYear(),
      currentWeekStart.getMonth(),
      currentWeekStart.getDate() + offset * 7,
    );
  }

  function changeWeek(delta: number) {
    const next = weekOffset + delta;
    setWeekOffset(next);
    if (next === 0) setSelectedDay(new Date().getDay());
  }

  const weekStart = weekStartFor(weekOffset);
  const week = summarizeWeek(records, weekStart);

  const earliestStart = records.reduce<Date | null>((earliest, r) => {
    const d = new Date(r.startedAt);
    return !earliest || d < earliest ? d : earliest;
  }, null);
  const earliestWeek = earliestStart ? startOfWeek(earliestStart) : weekStart;
  const canGoBack = weekStart > earliestWeek;

  return (
    <div>
      <CurveChartCard
        title="Focus per day"
        selectedValueLabel={formatMinutes(week.dailyFocusedSeconds[selectedDay])}
        values={week.dailyFocusedSeconds}
        selectedIndex={selectedDay}
        onDaySelected={setSelectedDay}
        rangeLabel={formatWeekRange(weekStart)}
        onPreviousWeek={canGoBack ? () => changeWeek(-1) : undefined}
        onNextWeek={weekOffset < 0 ? () => changeWeek(1) : undefined}
      />
      <div className="h-4" />
      <div className="grid grid-cols-2 gap-4">
        <StatPill
          label="Sessions"
          value={`${week.sessionCount}`}
          tone="magenta"
        />
        <StatPill
          label="Average length"
          value={`${Math.floor(week.averageSessionLengthSeconds / 60)}`}
          unit="min"
          tone="indigo"
        />
        <StatPill
          label="Violations"
          value={`${week.violationCount}`}
          tone="sunset"
        />
        <AddPill href="/personal" label="Start a focus session" />
      </div>
    </div>
  );
}
