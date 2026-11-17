"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { getPlatform } from "@/features/sessions/lib/face-down-sensor";

/** Chrome's install event — not in the DOM typings yet. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "focusguard:install-dismissed";

// Chrome fires beforeinstallprompt once, early in the page load — often
// before the page showing the install card has mounted. So it's captured
// here, by InstallPromptCapture mounted in the root layout, and handed to
// the card through this tiny store.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Mount once in the root layout. Renders nothing. */
export function InstallPromptCapture() {
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      notify();
    };
    const handleInstalled = () => {
      deferredPrompt = null;
      notify();
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);
  return null;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

type InstallOption = "android-prompt" | "ios-steps" | "android-steps" | null;

function currentOption(): InstallOption {
  if (isStandalone() || readDismissed()) return null;
  const platform = getPlatform();
  if (platform === "ios") return "ios-steps";
  if (platform === "android") return deferredPrompt ? "android-prompt" : "android-steps";
  return null;
}

/**
 * Offers to install FocusGuard to the home screen, so students open it
 * like an app — full screen, no address bar. Hidden once installed (or
 * when already running from the home screen), on laptops, and after
 * "Not now".
 */
export function InstallAppCard() {
  const [dismissed, setDismissed] = useState(false);
  const option = useSyncExternalStore(subscribe, currentOption, () => null);

  if (dismissed || !option) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Private mode: it just shows again next visit.
    }
    setDismissed(true);
  }

  async function install() {
    const prompt = deferredPrompt;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPrompt = null;
    notify();
    if (outcome === "accepted") setDismissed(true);
  }

  return (
    <div className="mb-6 rounded-lg bg-surface p-4 shadow-[0_8px_24px_rgb(32_36_52/8%)]">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon */}
        <img src="/icons/app/icon-192.png" alt="" width={40} height={40} className="rounded-sm" />
        <div className="flex-1">
          <p className="text-[15px] font-medium">Install the FocusGuard app</p>
          {option === "android-prompt" && (
            <p className="text-[13px] text-on-background-muted">
              Adds it to your home screen. It opens full screen, like any other app.
            </p>
          )}
          {option === "android-steps" && (
            <p className="text-[13px] text-on-background-muted">
              In Chrome, tap the <span className="font-medium">⋮</span> menu, then{" "}
              <span className="font-medium">Add to Home screen</span> (or <span className="font-medium">Install app</span>).
            </p>
          )}
          {option === "ios-steps" && (
            <p className="text-[13px] text-on-background-muted">
              Tap the <span className="font-medium">Share</span> button <ShareIcon />, then{" "}
              <span className="font-medium">Add to Home Screen</span>. Open FocusGuard from that icon and sign in once more.
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={dismiss} className="rounded-sm px-3 py-1.5 text-[14px] text-on-background-muted">
          Not now
        </button>
        {option === "android-prompt" && (
          <button type="button" onClick={install} className="rounded-sm bg-accent px-4 py-1.5 text-[14px] font-medium text-white">
            Install
          </button>
        )}
      </div>
    </div>
  );
}

export type InstallState = "installed" | "ready" | "ios" | "manual";

function currentInstallState(): InstallState {
  if (isStandalone()) return "installed";
  if (deferredPrompt) return "ready";
  if (getPlatform() === "ios") return "ios";
  return "manual";
}

/** Install status for the dedicated /install page (ignores "Not now"). */
export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, currentInstallState, () => "manual" as InstallState);
}

/** Shows the browser's install dialog. Must run from a tap or click. */
export async function runInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const prompt = deferredPrompt;
  if (!prompt) return "unavailable";
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome;
}

export function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline -mt-0.5" aria-hidden>
      <path d="M12 3v12M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" strokeLinecap="round" />
    </svg>
  );
}
