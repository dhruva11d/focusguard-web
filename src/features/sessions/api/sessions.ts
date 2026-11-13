import { backendFetch, errorMessage, jsonBody } from "@/lib/backend/client";
import type { CommunitySession, ParticipantSessionState, ParticipantStatus } from "../types";

export type SessionsResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

export async function startSession(params: {
  roomId: string;
  durationSeconds: number;
}): Promise<SessionsResult<CommunitySession>> {
  try {
    const data = await backendFetch<CommunitySession>(`/api/rooms/${encodeURIComponent(params.roomId)}/sessions`, {
      method: "POST",
      body: jsonBody({ durationSeconds: params.durationSeconds }),
    });
    return { data };
  } catch (error) {
    return { error: errorMessage(error, "Could not start the session.") };
  }
}

export async function getActiveSession(roomId: string): Promise<SessionsResult<CommunitySession | null>> {
  try {
    return { data: await backendFetch<CommunitySession | null>(`/api/rooms/${encodeURIComponent(roomId)}/sessions/active`) };
  } catch (error) {
    return { error: errorMessage(error, "Could not check for an active session.") };
  }
}

export async function joinSession(params: { communitySessionId: string }): Promise<number> {
  try {
    const row = await backendFetch<{ violationCount: number }>(
      `/api/sessions/${encodeURIComponent(params.communitySessionId)}/participants`,
      { method: "POST", body: jsonBody({ heartbeatEnabled: true }) },
    );
    return row.violationCount;
  } catch (error) {
    console.error("[sessions] could not record presence:", errorMessage(error, "Request failed."));
    return 0;
  }
}

export async function updateParticipantState(params: {
  communitySessionId: string;
  userId?: string;
  state: ParticipantSessionState;
  violationCount?: number;
  completedAt?: string;
}): Promise<void> {
  try {
    await backendFetch(`/api/sessions/${encodeURIComponent(params.communitySessionId)}/participants/me`, {
      method: "PUT",
      body: jsonBody({ state: params.state }),
    });
  } catch (error) {
    console.error("[sessions] could not publish state:", errorMessage(error, "Request failed."));
  }
}

export async function heartbeat(params: { communitySessionId: string; userId?: string }): Promise<void> {
  try {
    await backendFetch(`/api/sessions/${encodeURIComponent(params.communitySessionId)}/participants/me/heartbeat`, {
      method: "POST",
    });
  } catch (error) {
    console.error("[sessions] heartbeat failed:", errorMessage(error, "Request failed."));
  }
}

export async function endSessionEarly(sessionId: string): Promise<SessionsResult<void>> {
  try {
    await backendFetch(`/api/sessions/${encodeURIComponent(sessionId)}/end`, { method: "POST" });
    return { data: undefined };
  } catch (error) {
    return { error: errorMessage(error, "Could not end the session.") };
  }
}

export async function completeSession(sessionId: string): Promise<void> {
  try {
    await backendFetch(`/api/sessions/${encodeURIComponent(sessionId)}/complete`, { method: "POST" });
  } catch (error) {
    console.error("[sessions] could not mark session completed:", errorMessage(error, "Request failed."));
  }
}

export async function getParticipantStates(sessionId: string): Promise<SessionsResult<ParticipantStatus[]>> {
  try {
    const rows = await backendFetch<ParticipantStatus[]>(`/api/sessions/${encodeURIComponent(sessionId)}/participants`);
    return { data: rows };
  } catch (error) {
    return { error: errorMessage(error, "Could not refresh participants.") };
  }
}

export async function getSession(sessionId: string): Promise<SessionsResult<CommunitySession>> {
  try {
    return { data: await backendFetch<CommunitySession>(`/api/sessions/${encodeURIComponent(sessionId)}`) };
  } catch (error) {
    return { error: errorMessage(error, "This session isn't available.") };
  }
}
