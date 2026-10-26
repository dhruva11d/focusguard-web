"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Two short descending two-tone pings — distinct from the solo-session
 * alarm (alarm.mp3), which is meant to be jarring; this one only has to
 * catch a teacher's attention mid-sentence. */
function chime(ctx: AudioContext) {
  const start = ctx.currentTime + 0.01;
  const notes: [frequency: number, offset: number][] = [
    [880, 0],
    [660, 0.2],
    [880, 0.55],
    [660, 0.75],
  ];
  for (const [frequency, offset] of notes) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = start + offset;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(t);
    oscillator.stop(t + 0.2);
  }
}

/**
 * The host dashboard's alert sound. Browsers only let a page start audio
 * after the user interacts with it, so `unlocked` starts false unless the
 * host already clicked something in this document (e.g. "Start Session"
 * in the waiting room, which is a client-side navigation) — otherwise
 * the dashboard shows a "Turn on sound alerts" button that calls
 * `enable` from its click. Plays on the host's own device, which is the
 * point: a student can mute their phone, not the teacher's laptop.
 */
export function useAlertSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(false);
  const [unlocked, setUnlocked] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (typeof AudioContext === "undefined") return;
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    ctx.onstatechange = () => setUnlocked(ctx.state === "running");
    ctx.resume().catch(() => {});
    return () => {
      ctx.onstatechange = null;
      ctx.close().catch(() => {});
      ctxRef.current = null;
    };
  }, []);

  const enable = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    mutedRef.current = false;
    setMuted(false);
    ctx.resume().then(() => {
      setUnlocked(ctx.state === "running");
      chime(ctx); // confirms to the host that sound actually works
    }, () => {});
  }, []);

  const toggleMuted = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
  }, []);

  const play = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || mutedRef.current || ctx.state !== "running") return;
    chime(ctx);
  }, []);

  return { unlocked, muted, enable, toggleMuted, play };
}
