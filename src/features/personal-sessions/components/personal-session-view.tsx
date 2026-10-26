"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeroCard } from "@/components/ui/hero-card";
import { SecondaryActionButton } from "@/components/ui/secondary-action-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDuration, formatFocusedSummary } from "@/lib/format-session";
import { stopAlarm } from "../lib/alarm-player";
import { usePersonalFocusSession } from "../hooks/use-personal-focus-session";
import type { PersonalSessionStatus } from "../types";

/**
 * The active timer and the terminal screens in one component — ported
 * from focus_session_page.dart's status-driven view switch, minus
 * PlacementView (no phone-placement step) and minus ViolationView's
 * pause-and-resume (a violation here is terminal — see the hook's doc
 * comment for why).
 */
export function PersonalSessionView({
  userId,
  totalSeconds,
}: {
  userId: string;
  totalSeconds: number;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { status, remaining, endSession } = usePersonalFocusSession({ userId, totalSeconds });

  // The alarm only matters while this screen is up to hear it — stop it
  // the moment the user leaves, even if its own 30s cap hasn't elapsed.
  useEffect(() => {
    if (status !== "interrupted") return;
    return () => stopAlarm();
  }, [status]);

  if (status !== "active") {
    return (
      <TerminalView
        status={status}
        focusedSeconds={totalSeconds - remaining}
        onDone={() => {
          stopAlarm();
          router.push("/personal");
        }}
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col items-center justify-center gap-8 px-8">
      <HeroCard className="w-full">
        <div className="flex flex-col items-center text-center">
          <p className="text-[15px] text-hero-on-surface-muted">Focus is active</p>
          <p className="pt-2 text-[56px] leading-none font-semibold tracking-[-1px] tabular-nums">
            {formatDuration(remaining)}
          </p>
          <div className="pt-5">
            <p className="text-[18px] font-medium">You&rsquo;re focused</p>
            <p className="pt-1 text-[15px] text-hero-on-surface-muted">
              Keep this tab open and visible
            </p>
          </div>
        </div>
      </HeroCard>

      <SecondaryActionButton tint="var(--color-violation)" onClick={() => setConfirmOpen(true)}>
        End Session
      </SecondaryActionButton>

      <ConfirmDialog
        open={confirmOpen}
        title="End Session?"
        message="Your progress so far will be saved."
        cancelLabel="Cancel"
        confirmLabel="End Session"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          endSession();
        }}
      />
    </main>
  );
}

const TERMINAL_COPY: Record<
  Exclude<PersonalSessionStatus, "active">,
  { title: string; tint: string; icon: "check" | "stop" | "alert" }
> = {
  completed: { title: "Session Complete", tint: "var(--color-secure)", icon: "check" },
  cancelled: { title: "Session Ended Early", tint: "var(--color-on-background-muted)", icon: "stop" },
  interrupted: { title: "Session Interrupted", tint: "var(--color-violation)", icon: "alert" },
};

/** Ported from completion_view.dart — deliberately calm, not celebratory,
 * even for the interrupted case. */
function TerminalView({
  status,
  focusedSeconds,
  onDone,
}: {
  status: Exclude<PersonalSessionStatus, "active">;
  focusedSeconds: number;
  onDone: () => void;
}) {
  const { title, tint, icon } = TERMINAL_COPY[status];
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col items-center justify-center gap-4 px-8 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full border"
        style={{
          background: `color-mix(in srgb, ${tint} 14%, var(--color-surface))`,
          borderColor: `color-mix(in srgb, ${tint} 50%, transparent)`,
        }}
      >
        {icon === "check" && <CheckIcon color={tint} />}
        {icon === "stop" && <StopIcon color={tint} />}
        {icon === "alert" && <AlertIcon color={tint} />}
      </div>
      <h1 className="text-[22px] font-semibold tracking-[-0.2px]">{title}</h1>
      <p className="text-[17px] text-on-background-muted">
        {formatFocusedSummary(focusedSeconds)} focused
      </p>
      {status === "interrupted" && (
        <p className="text-[13px] text-on-background-faint">
          Ended automatically when this tab was left.
        </p>
      )}
      <div className="h-2" />
      <button onClick={onDone} className="text-[15px] font-medium text-accent">
        Done
      </button>
    </main>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
      <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StopIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function AlertIcon({ color }: { color: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">
      <path d="M12 8v5" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="0.9" fill={color} stroke="none" />
      <path
        d="M10.3 3.9L2.9 17.1c-.6 1 .1 2.4 1.3 2.4h15.6c1.2 0 1.9-1.3 1.3-2.4L13.7 3.9c-.6-1.1-2-1.1-2.6 0z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
