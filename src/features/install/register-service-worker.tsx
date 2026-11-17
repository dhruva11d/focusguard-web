"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js, which shows the "You're offline" screen when a
 * page load fails. Production only — in `next dev` a service worker would
 * outlive restarts and get in the way. Mount once in the root layout.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Unsupported or blocked (e.g. private mode): the app still works online.
    });
  }, []);
  return null;
}
