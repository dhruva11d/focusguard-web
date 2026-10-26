"use client";

import { useEffect, useRef, useState } from "react";
import { Hairline } from "@/components/ui/hairline";
import { getParticipantStates } from "../api/sessions";
import { effectiveStatusLabel, type StatusLabel } from "../lib/status-label";
import { useAlertSound } from "../hooks/use-alert-sound";
import type { ParticipantStatus } from "../types";

const POLL_INTERVAL_MS = 3000;
const MAX_ALERTS = 3;

type Alert = { id: number; name: string; message: string; at: number };

function alertMessage(status: StatusLabel): string {
  if (status.label === "Disconnected") return "disconnected";
  if (status.label === "Not set up") return "still hasn't set up monitoring after 3 minutes";
  if (status.issue) return "lost focus — phone picked up or tab left";
  // Violated and recovered between two polls.
  return "briefly lost focus";
}

function formatAlertTime(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * The host dashboard — ported from community_session_page.dart's
 * `_ParticipantDashboardSection`: a plain repeated query (not Realtime),
 * same as the waiting room's own polling. Exception-oriented — a quiet
 * summary of normal states, then a violation count as the one thing
 * allowed to stand out, then a plain list.
 *
 * On top of that, it alerts: each poll is diffed against the previous
 * one, and a participant who newly has an issue, or whose violation
 * count went up (which also catches a violate-and-recover that happened
 * entirely between two polls), raises a chime on this device, a banner,
 * and a count in the tab title. The very first poll only sets the
 * baseline, so reloading the dashboard doesn't replay old alerts.
 */
export function ParticipantDashboard({
  sessionId,
  currentUserId,
}: {
  sessionId: string;
  currentUserId: string;
}) {
  const [participants, setParticipants] = useState<ParticipantStatus[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const previousRef = useRef<Map<string, { issue: boolean; violationCount: number }> | null>(null);
  const nextAlertIdRef = useRef(0);
  const sound = useAlertSound();
  const { play } = sound;

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const result = await getParticipantStates(sessionId);
      if (cancelled) return;
      const at = Date.now();
      setNow(at);
      if (!result.data) {
        // A silent background poll failing shouldn't interrupt the host —
        // just keep showing the last-known list.
        setErrorMessage("Could not refresh participants.");
        return;
      }

      const others = result.data.filter((p) => p.userId !== currentUserId);
      const previous = previousRef.current;
      const snapshot = new Map<string, { issue: boolean; violationCount: number }>();
      const fresh: Alert[] = [];
      for (const p of others) {
        const status = effectiveStatusLabel(p, at);
        snapshot.set(p.userId, { issue: status.issue, violationCount: p.violationCount });
        if (!previous) continue;
        const before = previous.get(p.userId);
        const newIssue = status.issue && !before?.issue;
        const newViolation = p.violationCount > (before?.violationCount ?? 0);
        if (newIssue || newViolation) {
          fresh.push({
            id: nextAlertIdRef.current++,
            name: p.displayName,
            message: alertMessage(status),
            at,
          });
        }
      }
      previousRef.current = snapshot;

      setParticipants(others);
      setErrorMessage(null);
      if (fresh.length > 0) {
        setAlerts((current) => [...fresh, ...current].slice(0, MAX_ALERTS));
        play();
      }
    }

    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId, currentUserId, play]);

  // Visible from another tab too — the host may be presenting slides.
  useEffect(() => {
    if (alerts.length === 0) return;
    const original = document.title;
    document.title = `(${alerts.length}) ⚠ ${original}`;
    return () => {
      document.title = original;
    };
  }, [alerts.length]);

  function dismiss(id: number) {
    setAlerts((current) => current.filter((a) => a.id !== id));
  }

  return (
    <div>
      <SoundControl {...sound} />

      {alerts.length > 0 && (
        <div className="flex flex-col gap-2 pt-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              role="alert"
              className="flex items-start gap-3 rounded-md border border-violation/30 bg-violation/10 px-4 py-3"
            >
              <p className="flex-1 text-[15px]">
                <span className="font-semibold">{alert.name}</span> {alert.message}
                <span className="text-on-background-muted"> · {formatAlertTime(alert.at)}</span>
              </p>
              <button
                onClick={() => dismiss(alert.id)}
                aria-label="Dismiss alert"
                className="text-on-background-muted"
              >
                <CloseIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="h-4" />
      <ParticipantList participants={participants} now={now} />
      {errorMessage && <p className="pt-2 text-[13px] text-violation">{errorMessage}</p>}
    </div>
  );
}

function ParticipantList({
  participants,
  now,
}: {
  participants: ParticipantStatus[] | null;
  now: number;
}) {
  if (participants === null) return null;
  if (participants.length === 0) {
    return <p className="text-[15px] text-on-background-muted">No one else here yet.</p>;
  }

  const rows = participants.map((p) => ({ p, status: effectiveStatusLabel(p, now) }));
  const issueCount = rows.filter(({ status }) => status.issue).length;
  const counts = new Map<string, number>();
  for (const { status } of rows) {
    if (status.issue) continue;
    counts.set(status.label, (counts.get(status.label) ?? 0) + 1);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {[...counts.entries()].map(([label, count]) => (
          <span key={label} className="text-[15px] text-on-background-muted">
            {count} {label.toLowerCase()}
          </span>
        ))}
        {issueCount > 0 && (
          <span className="text-[15px] font-semibold text-violation">
            ⚠ {issueCount} {issueCount === 1 ? "issue" : "issues"}
          </span>
        )}
      </div>

      <div className="h-4" />
      {rows.map(({ p, status }) => (
        <div key={p.userId}>
          <div
            className={`-mx-3 flex items-center justify-between rounded-sm px-3 py-2 ${
              status.issue ? "bg-violation/10" : ""
            }`}
          >
            <span className="text-[15px]">{p.displayName}</span>
            <span className="text-[13px] font-medium" style={{ color: status.color }}>
              {status.label}
              {p.violationCount > 0 ? ` · ${p.violationCount}` : ""}
            </span>
          </div>
          <Hairline />
        </div>
      ))}
    </div>
  );
}

function SoundControl({
  unlocked,
  muted,
  enable,
  toggleMuted,
}: {
  unlocked: boolean;
  muted: boolean;
  enable: () => void;
  toggleMuted: () => void;
}) {
  if (!unlocked) {
    return (
      <button
        onClick={enable}
        className="w-full rounded-full border border-accent/40 bg-accent/10 px-4 py-2.5 text-[15px] font-medium text-accent"
      >
        Turn on sound alerts
      </button>
    );
  }
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-on-background-muted">
        {muted ? "Sound alerts muted" : "Sound alerts on"}
      </span>
      <button onClick={toggleMuted} className="text-[13px] font-medium text-accent">
        {muted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
