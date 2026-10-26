import Image from "next/image";
import { Hairline } from "@/components/ui/hairline";
import { formatMinutes, formatSessionDate } from "@/lib/format-session";
import type { PersonalSessionRecord } from "../types";

/** Ported from SessionRecordTile: a single past session, rendered the
 * same way wherever history appears — the Home screen's recent-sessions
 * preview and the full history screen (the same component serves both;
 * `records` is pre-sliced by the caller for the "recent" case). */
export function PersonalHistoryList({ records }: { records: PersonalSessionRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="py-6 text-center">
        <Image
          src="/images/two-empty-chairs.png"
          alt=""
          width={240}
          height={120}
          style={{ height: 120, width: "auto" }}
          className="mx-auto object-contain"
        />
        <p className="pt-2 text-[15px]">No sessions yet</p>
      </div>
    );
  }

  return (
    <div>
      {records.map((record, i) => (
        <div key={i}>
          <Row record={record} />
          <Hairline />
        </div>
      ))}
    </div>
  );
}

function Row({ record }: { record: PersonalSessionRecord }) {
  const completed = record.outcome === "completed";
  return (
    <div className="flex items-center gap-4 py-2">
      {completed ? <CheckIcon /> : <StopIcon />}
      <div className="flex-1">
        <p className="text-[15px]">{formatMinutes(record.focusedSeconds)} focused</p>
        <p className="text-[13px] text-on-background-muted">
          {formatSessionDate(record.startedAt)}
        </p>
      </div>
      {record.violationCount > 0 && (
        <span className="text-[13px] text-violation">
          {record.violationCount} {record.violationCount === 1 ? "violation" : "violations"}
        </span>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-secure)" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-on-background-faint)" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}
