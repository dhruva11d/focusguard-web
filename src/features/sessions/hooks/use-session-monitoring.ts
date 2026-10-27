"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getOwnViolationCount,
  heartbeat,
  joinSession,
  updateParticipantState,
} from "../api/sessions";
import { watchFaceDown, type MotionSource } from "../lib/face-down-sensor";
import type { ParticipantSessionState } from "../types";

const HEARTBEAT_INTERVAL_MS = 15_000;

/** How long a placed phone may sit face up before it counts — long
 * enough that a bump to the desk or nudging the phone straight doesn't
 * register, short enough that actually reading it does. */
const FACE_UP_GRACE_MS = 2_500;

/**
 * - `setup`: joined, still on the "place your phone" step. A hidden tab
 *   already counts; nothing else does yet.
 * - `face-down`: a phone — must stay face down (the Flutter app's
 *   placement check, read from whichever `motionSource` setup detected)
 *   as well as visible.
 * - `tab-only`: the host, who runs the dashboard and has no placement
 *   step — the tab just has to stay visible. Never a participant
 *   fallback: SessionView keeps a participant on `setup` until face-down
 *   detection actually works.
 */
export type MonitoringMode = "setup" | "face-down" | "tab-only";

/**
 * This device's side of a community session: decides its own state from
 * tab visibility plus (in face-down mode) phone orientation, and
 * publishes only the meaningful transitions — the same "status
 * transitions, not raw readings" shape ParticipantStatePublisher uses on
 * the Flutter side. Backed by a periodic heartbeat, so a tab the OS
 * silently kills (iOS often freezes the page before the "violation"
 * write lands) still surfaces as "Disconnected" via the host dashboard's
 * staleness check.
 *
 * In face-down mode a violation is sticky: coming back to the tab, or
 * merely turning the phone over, doesn't clear it — only placing the
 * phone face down again does. In tab-only mode, returning to the tab
 * clears it, as before.
 *
 * "Face down" is the sensor's *trusted* reading (see watchFaceDown): a
 * stalled or frozen sensor reads as not face down, so it runs into the
 * same grace period and violation as picking the phone up. `sensorLive`
 * is exposed separately so the page can say why.
 */
export function useSessionMonitoring({
  sessionId,
  userId,
  active,
  mode,
  motionSource,
}: {
  sessionId: string;
  userId: string;
  active: boolean;
  mode: MonitoringMode;
  /** Required in face-down mode; ignored otherwise. */
  motionSource: MotionSource | null;
}) {
  const [localState, setLocalState] = useState<ParticipantSessionState>(
    mode === "tab-only" ? "focusing" : "preparing",
  );
  const [violationCount, setViolationCount] = useState(0);
  const [faceDown, setFaceDown] = useState(false);
  const [sensorLive, setSensorLive] = useState(true);
  const [joined, setJoined] = useState(false);

  const stateRef = useRef<ParticipantSessionState | null>(null);
  const violationCountRef = useRef(0);
  const placedRef = useRef(false);
  const faceDownRef = useRef(false);

  // Session-scoped, independent of `mode`: the presence row has to exist
  // before any state update can land on it, and switching setup →
  // face-down mustn't re-join. Seeding the count from the server keeps a
  // reload from publishing 0 over violations already recorded.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      await joinSession({ communitySessionId: sessionId, userId });
      const recorded = await getOwnViolationCount({ communitySessionId: sessionId, userId });
      if (cancelled) return;
      violationCountRef.current = Math.max(violationCountRef.current, recorded);
      setViolationCount(violationCountRef.current);
      setJoined(true);
    })();
    const interval = setInterval(() => {
      heartbeat({ communitySessionId: sessionId, userId });
    }, HEARTBEAT_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [active, sessionId, userId]);

  useEffect(() => {
    if (!active || !joined) return;
    let graceTimer: ReturnType<typeof setTimeout> | null = null;

    function clearGrace() {
      if (graceTimer) clearTimeout(graceTimer);
      graceTimer = null;
    }

    function transition(next: ParticipantSessionState) {
      if (stateRef.current === next) return;
      if (next === "violation") {
        violationCountRef.current += 1;
        setViolationCount(violationCountRef.current);
      }
      stateRef.current = next;
      setLocalState(next);
      updateParticipantState({
        communitySessionId: sessionId,
        userId,
        state: next,
        violationCount: violationCountRef.current,
      });
    }

    function evaluate() {
      if (document.visibilityState === "hidden") {
        clearGrace();
        transition("violation");
        return;
      }
      if (mode === "tab-only") {
        transition("focusing");
        return;
      }
      if (mode === "face-down" && faceDownRef.current) {
        clearGrace();
        placedRef.current = true;
        transition("secured");
        return;
      }
      // Visible but not face down.
      if (stateRef.current === "violation") return;
      if (mode === "setup" || !placedRef.current) {
        transition("preparing");
        return;
      }
      graceTimer ??= setTimeout(() => {
        graceTimer = null;
        if (!faceDownRef.current) transition("violation");
      }, FACE_UP_GRACE_MS);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        // Orientation events stop while hidden, so the last reading is
        // stale by the time the page is back — and the phone has to be
        // in hand to unlock it anyway.
        faceDownRef.current = false;
        setFaceDown(false);
      }
      evaluate();
    }

    const unwatch =
      mode === "face-down" && motionSource
        ? watchFaceDown(motionSource, ({ faceDown: next, live }) => {
            setSensorLive(live);
            if (next === faceDownRef.current) return;
            faceDownRef.current = next;
            setFaceDown(next);
            evaluate();
          })
        : null;

    evaluate();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      unwatch?.();
      clearGrace();
    };
  }, [active, joined, mode, motionSource, sessionId, userId]);

  const markCompleted = useCallback(() => {
    stateRef.current = "completed";
    updateParticipantState({
      communitySessionId: sessionId,
      userId,
      state: "completed",
      violationCount: violationCountRef.current,
      completedAt: new Date().toISOString(),
    });
  }, [sessionId, userId]);

  return { localState, violationCount, faceDown, sensorLive, markCompleted };
}
