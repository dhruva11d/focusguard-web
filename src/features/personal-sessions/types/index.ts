export type PersonalSessionOutcome = "completed" | "cancelled";

/** Live lifecycle of a running solo session — the web counterpart to
 * FocusSessionStatus, minus placement/arming (no phone to place face-down)
 * and minus paused/resuming. Unlike the Flutter app, a violation here
 * ends the session immediately rather than pausing to wait for recovery
 * (`interrupted` is terminal, not resumable) — a deliberate product
 * choice for the web's solo mode, not a platform limitation. */
export type PersonalSessionStatus = "active" | "interrupted" | "completed" | "cancelled";

/** Mirrors `personal_sessions` (003_personal_history.sql) minus call_exemption_count,
 * which has no web equivalent (no concept of a phone call on a browser tab). */
export interface PersonalSessionRecord {
  startedAt: string;
  totalSeconds: number;
  focusedSeconds: number;
  outcome: PersonalSessionOutcome;
  violationCount: number;
}
