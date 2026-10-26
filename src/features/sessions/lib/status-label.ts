import type { ParticipantSessionState, ParticipantStatus } from "../types";

/** `issue` marks the states the host dashboard alerts on and counts as
 * "issues" — so callers never have to compare label strings. */
export type StatusLabel = { label: string; color: string; issue: boolean };

/**
 * Shared label/color mapping for ParticipantSessionState — the web
 * equivalent of participant_status_label.dart. "violation" covers both
 * ways a web client can lose focus — the tab was left, or (in face-down
 * mode) the phone was picked up — since both are written as the same
 * state, so the label names neither specifically.
 */
export function statusLabel(state: ParticipantSessionState): StatusLabel {
  switch (state) {
    case "joined":
    case "preparing":
      return { label: "Preparing", color: "var(--color-on-background-muted)", issue: false };
    case "secured":
    case "focusing":
      return { label: "Focused", color: "var(--color-secure)", issue: false };
    case "violation":
      return { label: "Not focused", color: "var(--color-violation)", issue: true };
    case "call_active":
    case "return_required":
      return { label: "Away", color: "var(--color-on-background-muted)", issue: false };
    case "completed":
      return { label: "Completed", color: "var(--color-on-background-muted)", issue: false };
    case "left":
      return { label: "Left", color: "var(--color-on-background-muted)", issue: false };
  }
}

/**
 * A heartbeat older than this means a tab was silently dropped (OS
 * killed it, no visibilitychange ever fired) — the fallback the plain
 * visibility event can't cover on its own. ~2x the heartbeat interval,
 * so one missed beat alone doesn't flip someone to "Disconnected."
 */
const STALE_AFTER_MS = 30_000;

/**
 * Long enough to read the instructions, allow motion access and put the
 * phone down — even on a second try after reopening the link in Safari.
 * Still "Preparing" after this means the student isn't actually being
 * monitored: on a laptop, motion access blocked, or simply not set up.
 */
const SETUP_DEADLINE_MS = 3 * 60_000;

/**
 * The label the host dashboard actually shows: the stored state, unless
 * the participant's own heartbeat (if they have one at all — only web
 * clients write it) has gone stale, in which case "Disconnected"
 * overrides it. A `null` lastSeenAt (a Flutter participant, who never
 * heartbeats) always falls through to the plain state label, so this
 * never mislabels a native-app user who simply doesn't heartbeat.
 *
 * Likewise "Not set up" overrides a "Preparing" that has outlasted
 * SETUP_DEADLINE_MS — a student who never got past placement isn't
 * being monitored at all, which the host needs to hear about as much as
 * a violation.
 */
export function effectiveStatusLabel(
  participant: ParticipantStatus,
  now: number,
): StatusLabel {
  if (participant.lastSeenAt) {
    const age = now - new Date(participant.lastSeenAt).getTime();
    if (age > STALE_AFTER_MS && participant.state !== "completed" && participant.state !== "left") {
      return { label: "Disconnected", color: "var(--color-offline)", issue: true };
    }
  }
  if (
    (participant.state === "joined" || participant.state === "preparing") &&
    participant.joinedAt &&
    now - new Date(participant.joinedAt).getTime() > SETUP_DEADLINE_MS
  ) {
    return { label: "Not set up", color: "var(--color-violation)", issue: true };
  }
  return statusLabel(participant.state);
}
