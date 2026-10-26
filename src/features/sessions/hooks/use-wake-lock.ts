"use client";

import { useEffect, useState } from "react";

/** `failed` covers both "unsupported" (Safari < 16.4) and "refused" (the
 * request was denied, e.g. in Low Power Mode) — either way the student
 * has to keep the screen awake themselves, and needs telling. */
export type WakeLockStatus = "idle" | "held" | "failed";

/**
 * Keeps the screen on while `enabled` — without it, a phone lying face
 * down auto-locks after a minute or so, which hides the tab and would
 * read as a violation the student never committed. The browser drops the
 * lock whenever the page is hidden, so it's re-requested each time the
 * page becomes visible again.
 */
export function useWakeLock(enabled: boolean): WakeLockStatus {
  const [status, setStatus] = useState<WakeLockStatus>("idle");

  useEffect(() => {
    if (!enabled) return;

    let sentinel: WakeLockSentinel | null = null;
    let released = false;

    async function acquire() {
      if (released || document.visibilityState !== "visible") return;
      if (!("wakeLock" in navigator)) {
        setStatus("failed");
        return;
      }
      try {
        sentinel = await navigator.wakeLock.request("screen");
        if (!released) setStatus("held");
      } catch {
        if (!released) setStatus("failed");
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") acquire();
    }

    acquire();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      sentinel?.release().catch(() => {});
    };
  }, [enabled]);

  return enabled ? status : "idle";
}
