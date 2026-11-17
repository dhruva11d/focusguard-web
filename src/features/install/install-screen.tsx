"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PrimaryActionButton } from "@/components/ui/button";
import { runInstall, ShareIcon, useInstallState } from "./install-prompt";

/**
 * Public install page — the landing page's Install button opens this, so
 * nobody has to sign in first. Browsers only allow the install dialog from
 * a tap on the page that owns the app, so this shows one large button and
 * runs the dialog straight from it.
 */
export function InstallScreen() {
  const state = useInstallState();
  const [done, setDone] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [waited, setWaited] = useState(false);

  // Chrome can take a moment to offer the install dialog after load.
  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  async function install() {
    setDeclined(false);
    const outcome = await runInstall();
    if (outcome === "accepted") setDone(true);
    if (outcome === "dismissed") setDeclined(true);
  }

  const checking = state === "manual" && !waited;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-8 py-10">
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon */}
      <img src="/icons/app/icon-192.png" alt="" width={72} height={72} className="rounded-lg" />
      <h1 className="pt-6 text-[26px] font-semibold tracking-[-0.2px]">Install FocusGuard</h1>
      <p className="pt-1 text-[15px] text-on-background-muted">
        Adds FocusGuard to your home screen. It opens full screen, like any other app. You sign in after installing.
      </p>

      <div className="pt-8">
        {done || state === "installed" ? (
          <>
            <p className="text-[18px] font-medium text-secure">
              {done ? "FocusGuard is installed." : "FocusGuard is already installed."}
            </p>
            <p className="pt-1 text-[15px] text-on-background-muted">
              {done ? "Open it from your home screen to sign in." : "You are using it as an app right now."}
            </p>
            {state === "installed" && (
              <div className="pt-6">
                <Link href="/" className="text-[15px] font-medium text-accent">Open FocusGuard</Link>
              </div>
            )}
          </>
        ) : state === "ready" ? (
          <>
            <PrimaryActionButton onClick={install}>Install FocusGuard</PrimaryActionButton>
            {declined && (
              <p className="pt-3 text-center text-[13px] text-on-background-muted">
                Install was cancelled. Tap the button to try again.
              </p>
            )}
          </>
        ) : state === "ios" ? (
          <ol className="space-y-3 text-[15px]">
            <li>
              1. Tap the <span className="font-medium">Share</span> button <ShareIcon /> in Safari.
            </li>
            <li>
              2. Choose <span className="font-medium">Add to Home Screen</span>.
            </li>
            <li>3. Open FocusGuard from the new icon and sign in.</li>
            <li className="text-[13px] text-on-background-muted">
              Not in Safari? Open this page in Safari first. iPhone only installs apps from there.
            </li>
          </ol>
        ) : checking ? (
          <PrimaryActionButton disabled>Getting ready…</PrimaryActionButton>
        ) : (
          <div className="space-y-3 text-[15px]">
            <p>
              Your browser did not offer an install button here. In Chrome, tap the{" "}
              <span className="font-medium">⋮</span> menu, then{" "}
              <span className="font-medium">Install app</span> or{" "}
              <span className="font-medium">Add to Home screen</span>.
            </p>
            <p className="text-[13px] text-on-background-muted">
              On a computer, look for the install icon at the right end of the address bar.
            </p>
          </div>
        )}
      </div>

      {!(done || state === "installed") && (
        <div className="pt-8">
          <Link href="/" className="text-[15px] font-medium text-accent">Continue in the browser instead</Link>
        </div>
      )}
    </main>
  );
}
