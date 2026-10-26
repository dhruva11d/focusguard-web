function mulberry32(seed: number) {
  let state = seed;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function speckles(seed: number, count: number): [number, number][] {
  const random = mulberry32(seed);
  const points: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    points.push([random() * 100, random() * 100]);
  }
  return points;
}

// Lower than Flutter's 1400 — real DOM circles aren't free the way raw
// canvas points are, and this density already reads as grain at normal
// viewing distance.
const COUNT = 600;
const LIGHT = speckles(1, COUNT);
const DARK = speckles(2, COUNT);

/**
 * A very faint photographic grain laid over a glass or colored surface —
 * ported from lib/design/grain_overlay.dart. Speckle positions are
 * generated once (seeded, so every instance shows the same pattern, like
 * the Flutter version's `math.Random(1)`/`math.Random(2)`) in percentage
 * coordinates, so they spread across whatever size the card is painted
 * at — but each dot's own radius stays a fixed 0.6px, exactly like the
 * Flutter painter scaling point *position* by canvas size while leaving
 * `strokeWidth` constant.
 */
export function GrainOverlay({ opacity = 0.07 }: { opacity?: number }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      {LIGHT.map(([x, y], i) => (
        <circle key={`l${i}`} cx={`${x}%`} cy={`${y}%`} r={0.6} fill="white" fillOpacity={opacity} />
      ))}
      {DARK.map(([x, y], i) => (
        <circle key={`d${i}`} cx={`${x}%`} cy={`${y}%`} r={0.6} fill="black" fillOpacity={opacity * 0.8} />
      ))}
    </svg>
  );
}
