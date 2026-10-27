"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { HeroCard } from "@/components/ui/hero-card";
import { PrimaryActionButton } from "@/components/ui/button";
import { SecondaryActionButton } from "@/components/ui/secondary-action-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Hairline } from "@/components/ui/hairline";
import { SectionLabel } from "@/components/ui/section-label";
import { completeSession, endSessionEarly, getSession } from "../api/sessions";
import {
  detectMotionSource,
  getPlatform,
  requestOrientationAccess,
  type MotionSource,
  type Platform,
} from "../lib/face-down-sensor";
import { useSessionMonitoring, type MonitoringMode } from "../hooks/use-session-monitoring";
import { useWakeLock, type WakeLockStatus } from "../hooks/use-wake-lock";
import { formatDuration } from "@/lib/format-session";
import { ParticipantDashboard } from "./participant-dashboard";
import type { CommunitySession, ParticipantSessionState } from "../types";

/** How often a participant re-reads the session row, to learn the host
 * ended it early — same cadence as the waiting room's own polling. */
const END_POLL_INTERVAL_MS = 5000;

type SetupProblem = "denied" | "no-sensor";

// Device type never changes mid-visit, so there's nothing to subscribe to.
const subscribeToNothing = () => () => {};

function computeRemainingSeconds(endTime: string | null): number {
  if (!endTime) return 0;
  return Math.max(0, (new Date(endTime).getTime() - Date.now()) / 1000);
}

/**
 * The shared countdown plus this device's own monitoring — the web
 * counterpart to community_session_page.dart. The countdown is computed
 * locally from `session.endTime`, not polled: every device reaches the
 * same wall-clock instant independently, which is the whole point of an
 * authoritative end time.
 *
 * A participant starts on a placement step (the web's PlacementView):
 * tapping "Start" is the user gesture iOS requires before it will grant
 * motion access. Participants are always on a phone — an iPhone or an
 * Android phone, with platform-specific instructions for each — so
 * face-down mode is required, not best-effort: if motion access is
 * blocked or the browser reports no sensor (typically an in-app browser
 * like WhatsApp's, or Chrome's motion-sensor site setting), they
 * stay on the placement step with instructions — and keep showing as
 * "Preparing" on the host's dashboard — rather than silently dropping to
 * a weaker check. The host skips it (they're running the dashboard) and
 * is monitored tab-only.
 *
 * `endTime` is state, not just the prop: a participant polls the session
 * row and, if the host ended it early, adopts the real end time — which
 * stops the countdown and monitoring the same way running out of time
 * does.
 */
export function SessionView({
  session,
  roomName,
  currentUserId,
  isHost,
}: {
  session: CommunitySession;
  roomName: string;
  currentUserId: string;
  isHost: boolean;
}) {
  const router = useRouter();
  const [endTime, setEndTime] = useState(session.endTime);
  const [endedEarly, setEndedEarly] = useState(false);
  const [remaining, setRemaining] = useState(() => computeRemainingSeconds(session.endTime));
  const [mode, setMode] = useState<MonitoringMode>(isHost ? "tab-only" : "setup");
  const [startingMonitoring, setStartingMonitoring] = useState(false);
  const [setupProblem, setSetupProblem] = useState<SetupProblem | null>(null);
  const [ending, setEnding] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const completedRef = useRef(false);

  const active = remaining > 0;
  // Assumed a phone on the server so phones (the only supported case)
  // never flash the "open this on your phone" screen during hydration.
  const platform = useSyncExternalStore(subscribeToNothing, getPlatform, () => "ios" as Platform);
  const isPhone = platform !== "other";
  const [motionSource, setMotionSource] = useState<MotionSource | null>(null);
  const { localState, violationCount, faceDown, sensorLive, markCompleted } = useSessionMonitoring({
    sessionId: session.id,
    userId: currentUserId,
    active,
    mode,
    motionSource,
  });
  // A face-down phone would otherwise auto-lock within a minute or two,
  // hiding the tab; a host's laptop sleeping would stop the dashboard.
  const wakeLock = useWakeLock(active && mode !== "setup");

  useEffect(() => {
    if (completedRef.current) return;
    const interval = setInterval(() => {
      const next = computeRemainingSeconds(endTime);
      setRemaining(next);
      if (next <= 0 && !completedRef.current) {
        completedRef.current = true;
        markCompleted();
        // Nobody else closes a session that simply ran out of time.
        if (isHost) completeSession(session.id);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime, markCompleted, isHost, session.id]);

  useEffect(() => {
    if (isHost || !active) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      const result = await getSession(session.id);
      if (cancelled || !result.data || result.data.status === "active") return;
      const reportedEnd = result.data.endTime;
      const nowIso = new Date().toISOString();
      setEndedEarly(true);
      setEndTime(reportedEnd && reportedEnd < nowIso ? reportedEnd : nowIso);
    }, END_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isHost, active, session.id]);

  async function handleStartMonitoring() {
    setStartingMonitoring(true);
    setSetupProblem(null);
    // Must be the first await — iOS only shows the prompt from a gesture.
    const access = await requestOrientationAccess();
    if (access === "denied") {
      setSetupProblem("denied");
      setStartingMonitoring(false);
      return;
    }
    const source = await detectMotionSource();
    if (!source) {
      setSetupProblem("no-sensor");
      setStartingMonitoring(false);
      return;
    }
    setMotionSource(source);
    setMode("face-down");
    setStartingMonitoring(false);
  }

  async function handleEndSession() {
    setConfirmOpen(false);
    setEnding(true);
    const result = await endSessionEarly(session.id);
    setEnding(false);
    if (result.error) {
      setEndError(result.error);
      return;
    }
    router.push("/workshop");
  }

  const copy = statusCopy({ active, endedEarly, mode, localState, faceDown, sensorLive });

  return (
    <main className="mx-auto min-h-screen w-full max-w-sm px-8 py-8">
      {active && mode === "face-down" && faceDown && <FaceDownOverlay remaining={remaining} />}

      <h1 className="pb-6 text-[18px] font-medium tracking-[-0.1px]">{roomName}</h1>

      <HeroCard>
        <div className="flex flex-col items-center text-center">
          <p className="text-[15px] text-hero-on-surface-muted">
            {active ? "Focus is active" : "Session complete"}
          </p>
          <p className="pt-2 text-[56px] leading-none font-semibold tracking-[-1px] tabular-nums">
            {formatDuration(remaining)}
          </p>
          <div className="pt-5">
            <p className="text-[18px] font-medium" style={{ color: copy.color }}>
              {copy.title}
            </p>
            <p className="pt-1 text-[15px] text-hero-on-surface-muted">{copy.body}</p>
            {violationCount > 0 && (
              <p className="pt-3 text-[13px] text-hero-on-surface-muted">
                Interruptions so far: {violationCount}
              </p>
            )}
          </div>
        </div>
      </HeroCard>

      {active && mode === "setup" && !isPhone && <NotAPhoneHelp />}
      {active && mode === "setup" && isPhone && (
        <>
          <div className="h-8" />
          <PrimaryActionButton onClick={handleStartMonitoring} disabled={startingMonitoring}>
            {startingMonitoring ? "Starting…" : "Start focus monitoring"}
          </PrimaryActionButton>
          {setupProblem ? (
            <SetupProblemHelp problem={setupProblem} platform={platform} />
          ) : (
            <>
              <p className="pt-3 text-center text-[13px] text-on-background-muted">
                {platform === "ios"
                  ? "Tap Allow when asked for motion access — it’s how FocusGuard knows your phone is face down."
                  : "Your phone’s motion sensor is how FocusGuard knows it’s face down — keep this page open."}
              </p>
              {platform === "android" && <PocketModeTip />}
            </>
          )}
        </>
      )}
      {active && mode === "face-down" && <WakeLockWarning status={wakeLock} platform={platform} />}
      {active && mode === "face-down" && platform === "android" && localState === "violation" && (
        <PocketModeTip />
      )}

      {isHost && (
        <>
          <div className="h-8" />
          <SecondaryActionButton
            tint="var(--color-violation)"
            disabled={ending}
            onClick={() => setConfirmOpen(true)}
          >
            {ending ? "Ending…" : "End Session"}
          </SecondaryActionButton>
          {endError && <p className="pt-2 text-[13px] text-violation">{endError}</p>}

          <div className="h-8" />
          <Hairline />
          <div className="h-6" />
          <SectionLabel>Participants</SectionLabel>
          <div className="h-2" />
          <ParticipantDashboard sessionId={session.id} currentUserId={currentUserId} />
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="End Session?"
        message="This will end the community session for all participants."
        cancelLabel="Cancel"
        confirmLabel="End Session"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleEndSession}
      />
    </main>
  );
}

function statusCopy({
  active,
  endedEarly,
  mode,
  localState,
  faceDown,
  sensorLive,
}: {
  active: boolean;
  endedEarly: boolean;
  mode: MonitoringMode;
  localState: ParticipantSessionState;
  faceDown: boolean;
  sensorLive: boolean;
}): { title: string; body: string; color?: string } {
  if (!active && endedEarly) return { title: "Session ended", body: "The host ended this session." };
  if (!active) return { title: "Well done", body: "This session has ended." };
  if (mode === "setup") {
    return {
      title: "Place your phone face down",
      body: "Tap Start below, then put your phone face down on the desk with this tab open.",
    };
  }
  if (mode === "face-down" && !sensorLive) {
    return {
      title: "Motion sensor not responding",
      body: "Reload this page and tap Start again — until then this counts as an interruption",
      color: "var(--color-violation)",
    };
  }
  if (localState === "violation") {
    return {
      title: "Focus interrupted",
      body:
        mode === "face-down"
          ? "Put your phone back face down to resume"
          : "Keep this tab open and visible",
      color: "var(--color-violation)",
    };
  }
  if (mode === "face-down" && localState === "preparing") {
    return {
      title: "Place your phone face down",
      body: "Monitoring starts once it's face down",
    };
  }
  if (mode === "face-down" && !faceDown) {
    // Lifted, but still inside the grace period.
    return {
      title: "Put your phone back down",
      body: "This will count as an interruption in a moment",
      color: "var(--color-pending)",
    };
  }
  return {
    title: "You're focused",
    body: mode === "face-down" ? "Leave your phone face down" : "Keep this tab open and visible",
  };
}

/** Shown in place of the usual hint when Start couldn't enable face-down
 * detection, with the fix for this platform. "denied" only happens on
 * iOS — Android has no motion prompt. */
function SetupProblemHelp({ problem, platform }: { problem: SetupProblem; platform: Platform }) {
  if (problem === "denied") {
    return (
      <div className="pt-4 text-center">
        <p className="text-[15px] font-medium text-violation">Motion access is required</p>
        <p className="pt-1 text-[13px] text-on-background-muted">
          FocusGuard can&rsquo;t tell your phone is face down without it. Reload this page and
          tap Start again, then choose Allow. If you&rsquo;re not asked again, close this tab
          and open the link fresh in Safari.
        </p>
      </div>
    );
  }
  if (platform === "android") {
    return (
      <div className="pt-4 text-center">
        <p className="text-[15px] font-medium text-violation">Open this link in Chrome</p>
        <p className="pt-1 text-[13px] text-on-background-muted">
          This browser isn&rsquo;t sharing your phone&rsquo;s motion sensor. Copy the link, open
          it in Chrome (not inside WhatsApp or another app), and sign in there. Already in
          Chrome? Check Chrome › Settings › Site settings › Motion sensors is allowed, then
          reload.
        </p>
        <CopyLinkButton />
      </div>
    );
  }
  return (
    <div className="pt-4 text-center">
      <p className="text-[15px] font-medium text-violation">Open this link in Safari</p>
      <p className="pt-1 text-[13px] text-on-background-muted">
        This browser isn&rsquo;t sharing your phone&rsquo;s motion sensor — usually because the
        link was opened inside WhatsApp or another app. Copy the link, paste it into Safari,
        and sign in there.
      </p>
      <CopyLinkButton />
    </div>
  );
}

/** Shown instead of the Start button on a laptop or computer: monitoring
 * means checking the phone itself is face down, so it can only run there.
 * The host's dashboard flags anyone stuck here as "Not set up". */
function NotAPhoneHelp() {
  return (
    <div className="pt-8 text-center">
      <p className="text-[15px] font-medium text-violation">Open this link on your phone</p>
      <p className="pt-1 text-[13px] text-on-background-muted">
        FocusGuard checks that your phone stays face down during the session, so it has to
        run on the phone itself — not a laptop or computer. Send yourself this link, open it
        on your phone (Safari on iPhone, Chrome on Android), and sign in there.
      </p>
      <CopyLinkButton />
    </div>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // Clipboard blocked — the instructions still say what to do.
    }
  }

  return (
    <button onClick={copyLink} className="pt-3 text-[15px] font-medium text-accent">
      {copied ? "Link copied" : "Copy link"}
    </button>
  );
}

/**
 * Some Android phones (common on Xiaomi, Realme and Samsung models) turn
 * the screen off when it's face down or the proximity sensor is covered —
 * "Pocket mode" / "Prevent accidental touches". That hides the page,
 * which counts as an interruption, so honest students need to know to
 * turn it off. Shown before Start, and again after an interruption, when
 * a screen that switched itself off is the likely explanation.
 */
function PocketModeTip() {
  return (
    <p className="pt-3 text-center text-[13px] text-pending">
      If your screen turns off by itself when placed face down, turn off Pocket mode or
      &ldquo;Prevent accidental touches&rdquo; in Settings › Display (or Settings › Lock
      screen) — otherwise it counts as an interruption.
    </p>
  );
}

/** If the screen can't be held on, auto-lock will hide the tab
 * mid-session and charge the student a violation they didn't commit —
 * so say so up front, with this platform's setting that prevents it. */
function WakeLockWarning({ status, platform }: { status: WakeLockStatus; platform: Platform }) {
  if (status !== "failed") return null;
  return (
    <p className="pt-4 text-center text-[13px] text-pending">
      {platform === "android"
        ? "Your screen may turn off by itself, which counts as an interruption. Turn off Battery Saver, or set Settings › Display › Screen timeout to the longest option for this session."
        : "Your screen may lock by itself, which counts as an interruption. Turn off Low Power Mode, or set Settings › Display & Brightness › Auto-Lock to Never for this session."}
    </p>
  );
}

/**
 * Near-black while the phone lies face down: nobody can see the screen,
 * and on OLED phones black pixels draw almost no power — the closest a
 * web page can get to dimming the display, since it can't set
 * brightness itself. Disappears the moment the phone is turned over.
 */
function FaceDownOverlay({ remaining }: { remaining: number }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black">
      <p className="text-[15px] text-white/15 tabular-nums">{formatDuration(remaining)}</p>
    </div>
  );
}
