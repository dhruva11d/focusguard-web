/** Mirrors lib/features/community/domain/entities/community_session.dart. */
export type CommunitySessionStatus = "waiting" | "active" | "completed" | "cancelled";

export type CommunitySession = {
  id: string;
  roomId: string;
  durationSeconds: number;
  status: CommunitySessionStatus;
  startTime: string | null;
  endTime: string | null;
};

/**
 * Mirrors participant_sessions.state's check constraint. The web app only
 * ever writes "focusing" and "violation" — a visible tab vs. a hidden
 * one — reusing the same values the Flutter app's phone-sensor states
 * map onto, rather than adding web-specific ones, so a mixed room's host
 * dashboard reads both kinds of participant the same way.
 */
export type ParticipantSessionState =
  | "joined"
  | "preparing"
  | "secured"
  | "focusing"
  | "violation"
  | "call_active"
  | "return_required"
  | "completed"
  | "left";

/** The host dashboard's per-row data — mirrors ParticipantStatus. */
export type ParticipantStatus = {
  userId: string;
  displayName: string;
  state: ParticipantSessionState;
  violationCount: number;
  /** Null for a participant whose client never heartbeats (e.g. Flutter). */
  lastSeenAt: string | null;
  /** When this participant joined the session (their row was created). */
  joinedAt: string | null;
};

/** Mirrors lib/features/community/domain/entities/community_history_entry.dart. */
export type CommunityHistoryEntry = {
  roomName: string;
  joinedAt: string;
  completedAt: string | null;
  durationSeconds: number;
  state: ParticipantSessionState;
  violationCount: number;
};
