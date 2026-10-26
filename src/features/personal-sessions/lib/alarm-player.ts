const ALARM_ASSET_PATH = "/audio/alarm.mp3";

/** Ported from AlarmConfig.maxDuration: an alarm never rings indefinitely,
 * even if nobody dismisses the screen. */
const MAX_DURATION_MS = 30_000;

let audio: HTMLAudioElement | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Loops the same alarm sound the Flutter app bundles
 * (assets/audio/alarm.mp3), capped at the same 30s max duration — the web
 * counterpart to AssetAlarmPlayer, minus the vibration pulse (no Vibration
 * API access from a background tab) and minus the SystemSound fallback
 * (no platform-level alert sound to fall back to on the web).
 */
/**
 * Safari 17+ (iOS): the "playback" audio session plays through the
 * ring/silent switch, the way a media app does — by default, page audio
 * is muted by it. It can't override the volume buttons, and nothing on
 * the web can; this only removes the one-flick way to silence it.
 */
function preferPlaybackAudioSession() {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) session.type = "playback";
}

export function playAlarm() {
  stopAlarm();
  preferPlaybackAudioSession();
  audio = new Audio(ALARM_ASSET_PATH);
  audio.loop = true;
  audio.play().catch(() => {
    // Autoplay can still be blocked in rare cases — failing silently here
    // is fine, since this is a secondary alert, not the record of what
    // happened (the session is already saved by the time this runs).
  });
  stopTimer = setTimeout(stopAlarm, MAX_DURATION_MS);
}

export function stopAlarm() {
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio = null;
  }
}
