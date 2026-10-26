"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { recordPersonalSession } from "../api/personal-sessions";
import { playAlarm, stopAlarm } from "../lib/alarm-player";
import type { PersonalSessionStatus } from "../types";

/**
 * Local-only timer + Page Visibility tracking for a solo focus session —
 * the web counterpart to FocusSessionCubit's active/interrupted/completed
 * lifecycle, minus placement/arming (no phone to put face-down first).
 *
 * Unlike the Flutter app's call-exempt, pause-and-resume violation
 * handling, a hidden tab here ends the session immediately: there is no
 * standard browser API that reports "the OS is handling an incoming
 * call" (no Call State equivalent exists on the web), so there is no
 * reliable way to tell a real interruption apart from a phone call
 * silently backgrounding the tab. Rather than guess, every hidden-tab
 * event is treated as a genuine interruption — the alarm plays and the
 * session ends on the first one, matching the product's explicit
 * "one strike" choice for solo sessions on the web.
 *
 * A single record is written once, at whichever terminal status is
 * reached — matching SessionHistoryRecorder's "persist only at a
 * terminal status" rule. `interrupted` is stored as a `cancelled`
 * outcome (the schema only distinguishes completed/cancelled), with
 * `violationCount` set to 1 so history can still show it was cut short
 * by an interruption rather than a manual end.
 */
export function usePersonalFocusSession({
  userId,
  totalSeconds,
}: {
  userId: string;
  totalSeconds: number;
}) {
  const [status, setStatus] = useState<PersonalSessionStatus>("active");
  const [remaining, setRemaining] = useState(totalSeconds);

  const startedAtRef = useRef(new Date());
  const remainingRef = useRef(totalSeconds);
  const statusRef = useRef<PersonalSessionStatus>("active");
  const savedRef = useRef(false);

  const save = useCallback(
    (outcome: "completed" | "cancelled", violationCount: number) => {
      if (savedRef.current) return;
      savedRef.current = true;
      recordPersonalSession({
        userId,
        startedAt: startedAtRef.current,
        totalSeconds,
        focusedSeconds: totalSeconds - remainingRef.current,
        outcome,
        violationCount,
      });
    },
    [userId, totalSeconds],
  );

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden" && statusRef.current === "active") {
        statusRef.current = "interrupted";
        setStatus("interrupted");
        save("cancelled", 1);
        playAlarm();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [save]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (statusRef.current !== "active") return;
      remainingRef.current = Math.max(0, remainingRef.current - 1);
      setRemaining(remainingRef.current);
      if (remainingRef.current <= 0) {
        statusRef.current = "completed";
        setStatus("completed");
        save("completed", 0);
      } 
    }, 1000);
    return () => clearInterval(interval);
  }, [save]);

  // Stop a still-ringing alarm if the screen unmounts before its own
  // 30s cap elapses (e.g. the user navigates away immediately).
  useEffect(() => stopAlarm, []);

  const endSession = useCallback(() => {
    if (statusRef.current !== "active") return;
    statusRef.current = "cancelled";
    setStatus("cancelled");
    save("cancelled", 0);
  }, [save]);

  return { status, remaining, endSession };
}
