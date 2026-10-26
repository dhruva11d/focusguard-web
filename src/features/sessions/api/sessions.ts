import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { CommunitySession, ParticipantSessionState, ParticipantStatus } from "../types";

const UNIQUE_VIOLATION = "23505";

export type SessionsResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

function describe(error: PostgrestError, action: string): string {
  return `${action}: ${error.message} (code: ${error.code})`;
}

function sessionFromRow(row: {
  id: string;
  room_id: string;
  duration_seconds: number;
  status: string;
  start_time: string | null;
  end_time: string | null;
}): CommunitySession {
  return {
    id: row.id,
    roomId: row.room_id,
    durationSeconds: row.duration_seconds,
    status: row.status as CommunitySession["status"],
    startTime: row.start_time,
    endTime: row.end_time,
  };
}

/**
 * Host-only (enforced by RLS, not just this function): creates the room's
 * session with start_time = now(), end_time = now() + durationSeconds —
 * a single atomic transition straight to "active".
 */
export async function startSession(params: {
  roomId: string;
  durationSeconds: number;
}): Promise<SessionsResult<CommunitySession>> {
  const supabase = createClient();
  const now = new Date();
  const { data, error } = await supabase
    .from("community_sessions")
    .insert({
      room_id: params.roomId,
      duration_seconds: params.durationSeconds,
      status: "active",
      start_time: now.toISOString(),
      end_time: new Date(now.getTime() + params.durationSeconds * 1000).toISOString(),
    })
    .select()
    .single();
  if (error) {
    return { error: describe(error, "Could not start the session") };
  }
  return { data: sessionFromRow(data) };
}

/**
 * The room's current active session, or `null` (not a failure) if the
 * host hasn't started one yet — used for the waiting room's initial load
 * and its participant-side polling. Filtered on end_time as well as
 * status: a session whose time ran out while nobody was there to mark it
 * completed is still `status = 'active'` in the table, and without this
 * the waiting room would keep redirecting into it — leaving the host
 * unable to start a new one.
 */
export async function getActiveSession(
  roomId: string,
): Promise<SessionsResult<CommunitySession | null>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("community_sessions")
    .select()
    .eq("room_id", roomId)
    .eq("status", "active")
    .gt("end_time", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    return { error: describe(error, "Could not check for an active session") };
  }
  return { data: data ? sessionFromRow(data) : null };
}

/**
 * Records this device's presence for the session — idempotent, a
 * duplicate is a harmless no-op. Failure here isn't surfaced to the
 * user: the countdown doesn't depend on it, only the host's dashboard
 * roster does.
 */
export async function joinSession(params: {
  communitySessionId: string;
  userId: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("participant_sessions").insert({
    community_session_id: params.communitySessionId,
    user_id: params.userId,
  });
  if (error && error.code !== UNIQUE_VIOLATION) {
    console.error("[sessions] could not record presence:", error.message);
  }
}

/**
 * This user's already-recorded violation count for the session, so a
 * reloaded page continues counting from it instead of publishing 0 over
 * it. 0 if there's no row yet (or it can't be read).
 */
export async function getOwnViolationCount(params: {
  communitySessionId: string;
  userId: string;
}): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("participant_sessions")
    .select("violation_count")
    .eq("community_session_id", params.communitySessionId)
    .eq("user_id", params.userId)
    .maybeSingle();
  return data?.violation_count ?? 0;
}

/**
 * Publishes this device's own state. `lastSeenAt` is written on every
 * call (not just the heartbeat interval) — any successful write is
 * proof of life, so there's no reason to wait for the next tick.
 */
export async function updateParticipantState(params: {
  communitySessionId: string;
  userId: string;
  state: ParticipantSessionState;
  violationCount?: number;
  completedAt?: string;
}): Promise<void> {
  const supabase = createClient();
  const payload: Record<string, unknown> = {
    state: params.state,
    last_seen_at: new Date().toISOString(),
  };
  if (params.violationCount !== undefined) payload.violation_count = params.violationCount;
  if (params.completedAt !== undefined) payload.completed_at = params.completedAt;

  const { error } = await supabase
    .from("participant_sessions")
    .update(payload)
    .eq("community_session_id", params.communitySessionId)
    .eq("user_id", params.userId);
  if (error) {
    console.error("[sessions] could not publish state:", error.message);
  }
}

/** Just the heartbeat, with no state change — keeps `lastSeenAt` fresh. */
export async function heartbeat(params: {
  communitySessionId: string;
  userId: string;
}): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("participant_sessions")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("community_session_id", params.communitySessionId)
    .eq("user_id", params.userId);
}

/**
 * Host-only (RLS): ends the session early for everyone — status =
 * "completed", end_time = now(), which legitimately lands before
 * start_time + duration.
 */
export async function endSessionEarly(sessionId: string): Promise<SessionsResult<void>> {
  const supabase = createClient();
  const { error } = await supabase
    .from("community_sessions")
    .update({ status: "completed", end_time: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) {
    return { error: describe(error, "Could not end the session") };
  }
  return { data: undefined };
}

/**
 * Host-only (RLS): marks a session whose countdown reached zero as
 * completed, leaving end_time as scheduled. Best-effort — getActiveSession
 * already ignores expired sessions, so a failure here only leaves the
 * row's status stale, not the app stuck.
 */
export async function completeSession(sessionId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("community_sessions")
    .update({ status: "completed" })
    .eq("id", sessionId)
    .eq("status", "active");
  if (error) {
    console.error("[sessions] could not mark session completed:", error.message);
  }
}

/**
 * The host dashboard's data: every participant's currently-published
 * state, including the host's own row (the caller filters that out).
 * RLS scopes this to hosts only — a non-host gets an empty list back,
 * not an error.
 */
export async function getParticipantStates(
  sessionId: string,
): Promise<SessionsResult<ParticipantStatus[]>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("participant_sessions")
    .select("user_id, state, violation_count, last_seen_at, joined_at, profiles(display_name)")
    .eq("community_session_id", sessionId);
  if (error) {
    return { error: describe(error, "Could not refresh participants") };
  }
  return {
    data: data.map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        userId: row.user_id,
        displayName: profile?.display_name ?? "Unknown",
        state: row.state as ParticipantSessionState,
        violationCount: row.violation_count,
        lastSeenAt: row.last_seen_at,
        joinedAt: row.joined_at,
      };
    }),
  };
}

export async function getSession(sessionId: string): Promise<SessionsResult<CommunitySession>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("community_sessions")
    .select()
    .eq("id", sessionId)
    .single();
  if (error || !data) {
    return { error: "This session isn't available." };
  }
  return { data: sessionFromRow(data) };
}
