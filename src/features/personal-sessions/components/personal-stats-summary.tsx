import { Hairline } from "@/components/ui/hairline";
import { formatMinutes } from "@/lib/format-session";
import type { PersonalHistoryStats } from "../lib/history-stats";

/**
 * All-time statistics — ported from session_history_page.dart's
 * `_StatsSummary`: one hero number (total focus time) since the screen's
 * one dark card is the chart above it, then a quiet, muted list for
 * everything else.
 */
export function PersonalStatsSummary({ stats }: { stats: PersonalHistoryStats }) {
  return (
    <div>
      <p className="text-[40px] leading-none font-semibold tracking-[-0.5px] tabular-nums">
        {formatMinutes(stats.totalFocusedSeconds)}
      </p>
      <p className="pt-1 text-[15px] text-on-background-muted">Total focus time</p>
      <div className="h-6" />
      <StatRow label="Sessions" value={`${stats.totalSessions}`} />
      <Hairline />
      <StatRow label="Completed" value={`${stats.completedSessions}`} />
      <Hairline />
      <StatRow
        label="Interrupted"
        value={`${stats.interruptedSessions}`}
        emphasize={stats.interruptedSessions > 0}
      />
      <Hairline />
      <StatRow label="Average length" value={formatMinutes(stats.averageSessionLengthSeconds)} />
      <Hairline />
      <StatRow
        label="Longest uninterrupted"
        value={formatMinutes(stats.longestUninterruptedSeconds)}
      />
      <Hairline />
      <StatRow
        label="Violations"
        value={`${stats.totalViolations}`}
        emphasize={stats.totalViolations > 0}
      />
      <Hairline />
      <StatRow label="Call exemptions" value={`${stats.totalCallExemptions}`} />
    </div>
  );
}

function StatRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <p className="text-[15px] text-on-background-muted">{label}</p>
      <p
        className="text-[15px]"
        style={{
          color: emphasize ? "var(--color-violation)" : "var(--color-on-background)",
          fontWeight: emphasize ? 600 : 500,
        }}
      >
        {value}
      </p>
    </div>
  );
}
