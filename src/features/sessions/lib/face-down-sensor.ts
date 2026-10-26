/**
 * Face-down detection from a browser tab, via the Device Orientation API —
 * the web stand-in for the Flutter app's phone-placement sensors. `beta`
 * is the front-to-back tilt: ~0° lying flat face up, ~±180° flat face
 * down. Only works while the page is visible with the screen on (events
 * stop the moment the tab is hidden), which is why the session page also
 * holds a screen wake lock.
 *
 * Readings are only trusted while the sensor looks *live*. A real phone
 * streams orientation continuously (tens of readings a second) with tiny
 * natural jitter, even lying perfectly still. A faked sensor — e.g. the
 * Sensors panel in a laptop browser's developer tools, set to "face
 * down" — either fires only when its value is changed, or repeats
 * exactly the same numbers. Either pattern reads as "not live", which
 * counts as not face down.
 */

/** Within ~30° of fully face down — loose enough that a phone resting on
 * a camera bump or a pencil case still reads as placed. */
const FACE_DOWN_MIN_ABS_BETA = 150;

/** No reading for this long while visible: the stream has stopped. */
const STALE_AFTER_MS = 2_000;

/** This much history, all bit-for-bit identical, means frozen values. */
const FROZEN_WINDOW_MS = 5_000;
const FROZEN_MIN_READINGS = 20;

/** Setup-time check: a real phone in hand produces this many varying
 * readings well within the detection window. */
const SETUP_MIN_READINGS = 10;

const LIVENESS_CHECK_INTERVAL_MS = 500;

type OrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export type OrientationAccess = "granted" | "denied" | "not-required";

/**
 * Whether this is a phone (or tablet) — something that can lie face down
 * on a desk. iPadOS reports a desktop "Macintosh" user agent, so touch
 * support is what tells it apart from a real Mac. This is only the
 * up-front filter for the honest case (a student who opened the link on
 * a laptop); a spoofed user agent still has to get past the sensor
 * liveness checks.
 */
export function isLikelyPhone(): boolean {
  if (typeof navigator === "undefined") return true;
  const ua = navigator.userAgent;
  if (/iPhone|iPod|Android/i.test(ua)) return true;
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

/**
 * iOS 13+ gates orientation events behind a permission prompt that can
 * only be shown from a user gesture — so this must be the first `await`
 * inside a click handler, before anything else yields to the event loop.
 * Other platforms (Android, desktop) have no prompt: "not-required".
 */
export async function requestOrientationAccess(): Promise<OrientationAccess> {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
    return "not-required";
  }
  const Event = DeviceOrientationEvent as OrientationEventWithPermission;
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
 * Whether this device has a real, streaming orientation sensor. Desktop
 * browsers define DeviceOrientationEvent but either never fire it or
 * fire once with all-null values; a faked sensor fires rarely or with
 * constant values. The phone is in the student's hand at this point
 * (they just tapped Start), so a real sensor shows both volume and
 * variation within the window.
 */
export function detectOrientationSensor(timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      resolve(false);
      return;
    }
    let count = 0;
    let firstBeta: number | null = null;
    let varied = false;
    const timer = setTimeout(() => finish(false), timeoutMs);

    function handle(e: DeviceOrientationEvent) {
      if (e.beta === null) return;
      count++;
      if (firstBeta === null) firstBeta = e.beta;
      else if (e.beta !== firstBeta) varied = true;
      if (count >= SETUP_MIN_READINGS && varied) finish(true);
    }
    function finish(result: boolean) {
      clearTimeout(timer);
      window.removeEventListener("deviceorientation", handle);
      resolve(result);
    }
    window.addEventListener("deviceorientation", handle);
  });
}

export type OrientationReading = {
  /** Face down *and* live — what monitoring should act on. */
  faceDown: boolean;
  /** Whether readings are currently arriving and look like a real sensor. */
  live: boolean;
};

/**
 * Calls `onChange` whenever the trusted reading changes; returns the
 * unsubscribe. Also re-checks on a timer, since a stream that stops
 * produces no events to react to.
 */
export function watchFaceDown(onChange: (reading: OrientationReading) => void): () => void {
  let lastReadingAt = 0;
  let rawFaceDown = false;
  let samples: { at: number; beta: number; gamma: number | null }[] = [];
  let emitted: OrientationReading | null = null;

  function isFrozen(now: number): boolean {
    if (samples.length < FROZEN_MIN_READINGS) return false;
    // Only judge once the history actually spans most of the window.
    if (now - samples[0].at < FROZEN_WINDOW_MS * 0.8) return false;
    const { beta, gamma } = samples[0];
    return samples.every((s) => s.beta === beta && s.gamma === gamma);
  }

  function emit(now: number) {
    const live = now - lastReadingAt <= STALE_AFTER_MS && !isFrozen(now);
    const next = { faceDown: live && rawFaceDown, live };
    if (emitted && emitted.faceDown === next.faceDown && emitted.live === next.live) return;
    emitted = next;
    onChange(next);
  }

  function handle(e: DeviceOrientationEvent) {
    if (e.beta === null) return;
    const now = Date.now();
    lastReadingAt = now;
    rawFaceDown = Math.abs(e.beta) >= FACE_DOWN_MIN_ABS_BETA;
    samples.push({ at: now, beta: e.beta, gamma: e.gamma });
    samples = samples.filter((s) => now - s.at <= FROZEN_WINDOW_MS);
    emit(now);
  }

  window.addEventListener("deviceorientation", handle);
  const interval = setInterval(() => emit(Date.now()), LIVENESS_CHECK_INTERVAL_MS);
  return () => {
    window.removeEventListener("deviceorientation", handle);
    clearInterval(interval);
  };
}
