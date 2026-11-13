import { backendFetch, jsonBody, errorMessage } from "@/lib/backend/client";
import type { PersonalSessionOutcome } from "../types";

export async function recordPersonalSession(params: {
  userId: string;
  startedAt: Date;
  totalSeconds: number;
  focusedSeconds: number;
  outcome: PersonalSessionOutcome;
  violationCount: number;
}): Promise<void> {
  const clientId = `${params.userId}:${params.startedAt.getTime() * 1000}`;
  try {
    await backendFetch("/api/personal-sessions", {
      method: "POST",
      body: jsonBody({
        clientId,
        startedAt: params.startedAt.toISOString(),
        totalSeconds: params.totalSeconds,
        focusedSeconds: params.focusedSeconds,
        outcome: params.outcome,
        violationCount: params.violationCount,
        callExemptionCount: 0,
      }),
    });
  } catch (error) {
    console.error("[personal-sessions] could not save session:", errorMessage(error, "Request failed."));
  }
}
