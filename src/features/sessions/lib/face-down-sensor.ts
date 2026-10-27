/**
 * Face-down detection from a browser tab — the web stand-in for the
 * Flutter app's phone-placement sensors, for iPhones and Android phones
 * alike. Two sources, tried in order:
 *
 * - `orientation` (Device Orientation API): `beta` is the front-to-back
 *   tilt, ~0° lying flat face up, ~±180° flat face down. Needs a
 *   gyroscope — every iPhone, most Android phones.
 * - `gravity` (Device Motion API's accelerationIncludingGravity): gravity
 *   along the screen's axis, ~+9.8 m/s² face up, ~−9.8 face down. Needs
 *   only an accelerometer, which every phone has — the fallback for
 *   budget Android phones whose browser reports no orientation. Android
 *   only: iOS always has orientation, and older iOS versions reported
 *   this axis with the opposite sign.
 *
 * Either only works while the page is visible with the screen on (events
 * stop the moment the tab is hidden), which is why the session page also
 * holds a screen wake lock.
 *
 * Readings are only trusted while the sensor looks *live*. A real phone
 * streams readings continuously (tens a second) with tiny natural
 * jitter, even lying perfectly still. A faked sensor — e.g. the Sensors
 * panel in a laptop browser's developer tools, set to "face down" —
 * either fires only when its value is changed, or repeats exactly the
 * same numbers. Either pattern reads as "not live", which counts as not
 * face down.
 */

/** Within ~30° of fully face down — loose enough that a phone resting on
 * a camera bump or a pencil case still reads as placed. */
const FACE_DOWN_MIN_ABS_BETA = 150;
/** The same ~30° expressed as gravity: −9.81 · cos(30°) ≈ −8.5. */
const FACE_DOWN_MAX_GRAVITY_Z = -8.5;

/** No reading for this long while visible: the stream has stopped. */
const STALE_AFTER_MS = 2_000;

/** This much history, all bit-for-bit identical, means frozen values. */
const FROZEN_WINDOW_MS = 5_000;
const FROZEN_MIN_READINGS = 20;

/** Setup-time check: a real phone in hand produces this many varying
 * readings well within the detection window. */
const SETUP_MIN_READINGS = 10;

const LIVENESS_CHECK_INTERVAL_MS = 500;

export type Platform = "ios" | "android" | "other";

/**
 * Which phone platform this is — "other" for a laptop or computer. iPadOS
 * reports a desktop "Macintosh" user agent, so touch support is what
 * tells it apart from a real Mac. This is only the up-front filter for
 * the honest case (a student who opened the link on a laptop) and for
 * picking platform-specific instructions; a spoofed user agent still has
 * to get past the sensor liveness checks.
 */
export function getPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

export type MotionSource = "orientation" | "gravity";

type Sample = { faceDown: boolean; a: number; b: number | null };

const SOURCES: Record<MotionSource, { event: string; read: (e: Event) => Sample | null }> = {
  orientation: {
    event: "deviceorientation",
    read(e) {
      const { beta, gamma } = e as DeviceOrientationEvent;
      if (beta === null) return null;
      return { faceDown: Math.abs(beta) >= FACE_DOWN_MIN_ABS_BETA, a: beta, b: gamma };
    },
  },
  gravity: {
    event: "devicemotion",
    read(e) {
      const gravity = (e as DeviceMotionEvent).accelerationIncludingGravity;
      if (!gravity || gravity.z === null) return null;
      return { faceDown: gravity.z <= FACE_DOWN_MAX_GRAVITY_Z, a: gravity.z, b: gravity.x };
    },
  },
};

type EventWithPermission = { requestPermission?: () => Promise<"granted" | "denied"> };

export type OrientationAccess = "granted" | "denied" | "not-required";

/**
 * iOS 13+ gates motion events behind a permission prompt that can only
 * be shown from a user gesture — so this must be the first `await`
 * inside a click handler, before anything else yields to the event loop.
 * Android has no prompt: "not-required" (a site whose motion sensors were
 * blocked in Chrome's site settings just never fires events, which
 * detectMotionSource reports as no sensor).
 */
export async function requestOrientationAccess(): Promise<OrientationAccess> {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
    return "not-required";
  }
  const Event = DeviceOrientationEvent as unknown as EventWithPermission;
  if (typeof Event.requestPermission !== "function") return "not-required";
  try {
    return (await Event.requestPermission()) === "granted" ? "granted" : "denied";
  } catch {
    // Thrown when not called from a user gesture, or by in-app browsers
    // (e.g. WhatsApp's) that don't implement the prompt at all.
    return "denied";
  }
}

/**
 * The best real, streaming sensor this device offers, or `null`. Desktop
 * browsers define the events but either never fire them or fire once
 * with null values; a faked sensor fires rarely or with constant values.
 * The phone is in the student's hand at this point (they just tapped
 * Start), so a real sensor shows both volume and variation within the
 * window. Orientation wins as soon as it qualifies; gravity is only the
 * answer if orientation never did.
 */
export function detectMotionSource(timeoutMs = 1500): Promise<MotionSource | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const candidates: MotionSource[] =
      getPlatform() === "android" ? ["orientation", "gravity"] : ["orientation"];
    const progress = new Map<MotionSource, { count: number; first: number | null; varied: boolean }>();
    const listeners: [string, (e: Event) => void][] = [];

    const qualifies = (source: MotionSource) => {
      const p = progress.get(source);
      return !!p && p.count >= SETUP_MIN_READINGS && p.varied;
    };

    for (const source of candidates) {
      const state = { count: 0, first: null as number | null, varied: false };
      progress.set(source, state);
      const listener = (e: Event) => {
        const sample = SOURCES[source].read(e);
        if (!sample) return;
        state.count++;
        if (state.first === null) state.first = sample.a;
        else if (sample.a !== state.first) state.varied = true;
        if (source === "orientation" && qualifies("orientation")) finish("orientation");
      };
      window.addEventListener(SOURCES[source].event, listener);
      listeners.push([SOURCES[source].event, listener]);
    }

    const timer = setTimeout(() => {
      finish(qualifies("orientation") ? "orientation" : qualifies("gravity") ? "gravity" : null);
    }, timeoutMs);

    function finish(result: MotionSource | null) {
      clearTimeout(timer);
      for (const [event, listener] of listeners) window.removeEventListener(event, listener);
      resolve(result);
    }
  });
}

export type OrientationReading = {
  /** Face down *and* live — what monitoring should act on. */
  faceDown: boolean;
  /** Whether readings are currently arriving and look like a real sensor. */
  live: boolean;
};

/**
 * Calls `onChange` whenever the trusted reading from `source` changes;
 * returns the unsubscribe. Also re-checks on a timer, since a stream that
 * stops produces no events to react to.
 */
export function watchFaceDown(
  source: MotionSource,
  onChange: (reading: OrientationReading) => void,
): () => void {
  const { event, read } = SOURCES[source];
  let lastReadingAt = 0;
  let rawFaceDown = false;
  let samples: { at: number; a: number; b: number | null }[] = [];
  let emitted: OrientationReading | null = null;

  function isFrozen(now: number): boolean {
    if (samples.length < FROZEN_MIN_READINGS) return false;
    // Only judge once the history actually spans most of the window.
    if (now - samples[0].at < FROZEN_WINDOW_MS * 0.8) return false;
    const { a, b } = samples[0];
    return samples.every((s) => s.a === a && s.b === b);
  }

  function emit(now: number) {
    const live = now - lastReadingAt <= STALE_AFTER_MS && !isFrozen(now);
    const next = { faceDown: live && rawFaceDown, live };
    if (emitted && emitted.faceDown === next.faceDown && emitted.live === next.live) return;
    emitted = next;
    onChange(next);
  }

  function handle(e: Event) {
    const sample = read(e);
    if (!sample) return;
    const now = Date.now();
    lastReadingAt = now;
    rawFaceDown = sample.faceDown;
    samples.push({ at: now, a: sample.a, b: sample.b });
    samples = samples.filter((s) => now - s.at <= FROZEN_WINDOW_MS);
    emit(now);
  }

  window.addEventListener(event, handle);
  const interval = setInterval(() => emit(Date.now()), LIVENESS_CHECK_INTERVAL_MS);
  return () => {
    window.removeEventListener(event, handle);
    clearInterval(interval);
  };
}
