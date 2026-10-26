"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrimaryActionButton } from "@/components/ui/button";
import { Hairline } from "@/components/ui/hairline";
import { SectionLabel } from "@/components/ui/section-label";
import { DurationPicker } from "@/components/ui/duration-picker";
import { getRoster } from "../api/rooms";
import { startSession, getActiveSession } from "@/features/sessions/api/sessions";
import type { Room, RoomParticipant } from "../types";

const POLL_INTERVAL_MS = 5000;

/**
 * Ported from waiting_room_page.dart. The roster is still a one-time
 * fetch (no live updates); session-start discovery is a plain repeated
 * query, not Supabase Realtime, matching the Flutter app's own choice —
 * a participant sitting here with no signal the host started would be a
 * real classroom usability problem, so non-host devices poll while this
 * page is visible.
 */
export function WaitingRoom({
  room,
  isHost,
  initialDurationMinutes,
}: {
  room: Room;
  isHost: boolean;
  initialDurationMinutes: number;
}) {
  const router = useRouter();
  const [roster, setRoster] = useState<RoomParticipant[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(initialDurationMinutes);
  const navigatedRef = useRef(false);

  // Also run once on mount (not just by the poll), so returning to an
  // already-active room goes straight to it instead of showing a stale
  // "Start Session" button.
  const checkForActiveSession = useCallback(async () => {
    const result = await getActiveSession(room.id);
    if (!result.data || navigatedRef.current) return;
    navigatedRef.current = true;
    router.push(`/workshop/room/${room.id}/session/${result.data.id}`);
  }, [room.id, router]);

  useEffect(() => {
    let cancelled = false;

    // Inlined rather than a reusable callback — this is a one-time
    // fetch (no poll), so a `cancelled` guard against a response that
    // arrives after unmount is all it needs.
    (async () => {
      const result = await getRoster(room.id);
      if (cancelled) return;
      if (result.data) {
        setRoster(result.data);
        setErrorMessage(null);
      } else {
        setErrorMessage(result.error);
      }
    })();

    checkForActiveSession();
    if (isHost) {
      return () => {
        cancelled = true;
      };
    }

    const interval = setInterval(checkForActiveSession, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [room.id, isHost, checkForActiveSession]);

  async function handleStartSession() {
    setStarting(true);
    const result = await startSession({ roomId: room.id, durationSeconds: durationMinutes * 60 });
    setStarting(false);
    if (!result.data) {
      setErrorMessage(result.error);
      return;
    }
    router.push(`/workshop/room/${room.id}/session/${result.data.id}`);
  }

  const formattedCode = `${room.code.slice(0, 3)} ${room.code.slice(3)}`;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col">
      <header className="flex items-center justify-between px-8 pt-8">
        <h1 className="text-[18px] font-medium tracking-[-0.1px]">{room.name}</h1>
        <Link href="/workshop" aria-label="Back to Community" className="text-on-background-muted">
          <CloseIcon />
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs font-semibold tracking-[0.3px] text-on-background-muted">
            ROOM CODE
          </p>
          <p className="text-[42px] font-semibold tracking-[4px]">{formattedCode}</p>
        </div>

        <div className="h-12" />
        <SectionLabel>Participants</SectionLabel>
        <div className="h-2" />

        {errorMessage ? (
          <p className="py-2 text-[15px] text-violation">{errorMessage}</p>
        ) : roster === null ? null : roster.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <Image
              src="/images/two-empty-chairs.png"
              alt=""
              width={224}
              height={160}
              className="h-[160px] w-auto object-contain"
            />
            <p className="text-[15px] text-on-background-muted">No one here yet.</p>
          </div>
        ) : (
          roster.map((participant) => (
            <div key={participant.userId}>
              <ParticipantRow participant={participant} />
              <Hairline />
            </div>
          ))
        )}
      </div>

      {isHost && (
        <div className="px-8 py-8">
          <SectionLabel>Focus duration</SectionLabel>
          <div className="h-2" />
          <DurationPicker initialMinutes={initialDurationMinutes} onChange={setDurationMinutes} />
          <div className="h-6" />
          <PrimaryActionButton onClick={handleStartSession} disabled={starting}>
            {starting ? "Starting…" : "Start Session"}
          </PrimaryActionButton>
        </div>
      )}
    </div>
  );
}

function ParticipantRow({ participant }: { participant: RoomParticipant }) {
  const isHost = participant.role === "host";
  return (
    <div className="flex items-center gap-4 py-2">
      <span className={isHost ? "text-pending" : "text-on-background-muted"}>
        {isHost ? <StarIcon /> : <PersonIcon />}
      </span>
      <div>
        <p className="text-[15px]">{participant.displayName}</p>
        <p className="text-[13px] text-on-background-muted">
          {isHost ? "Host" : "Participant"}
        </p>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l2.6 5.5 6 .7-4.4 4.1 1.2 6-5.4-3-5.4 3 1.2-6-4.4-4.1 6-.7Z" strokeLinejoin="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c0-3.9 3.4-7 7.5-7s7.5 3.1 7.5 7" strokeLinecap="round" />
    </svg>
  );
}
