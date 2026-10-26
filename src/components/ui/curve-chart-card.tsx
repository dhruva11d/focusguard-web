"use client";

import Image from "next/image";
import { HeroCard } from "./hero-card";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const VIEW_WIDTH = 320;
const CHART_HEIGHT = 120;
const TOP_INSET = 14;
const BOTTOM_INSET = 16;

interface Point {
  x: number;
  y: number;
}

function cubicSegment(points: Point[], i: number) {
  const p0 = points[i === 0 ? 0 : i - 1];
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[i + 2 >= points.length ? points.length - 1 : i + 2];
  const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
  const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
  return { c1, c2, p2 };
}

/**
 * Catmull-Rom-through-Bezier curve math, ported 1:1 from `_CurvePainter`
 * (curve_chart_card.dart) — same control-point formula, translated from
 * Flutter's `Canvas.drawPath` to an SVG path string. Solid up to the
 * selected day, dotted after it, with a flat lead-in/lead-out so the line
 * runs edge to edge.
 */
function buildPaths(values: number[], selectedIndex: number) {
  const baseline = CHART_HEIGHT - BOTTOM_INSET;
  const usable = baseline - TOP_INSET;
  const peak = Math.max(0, ...values);
  const slot = VIEW_WIDTH / 7;
  const yFor = (v: number) => (peak <= 0 ? baseline : baseline - (v / peak) * usable);

  const days: Point[] = values.map((v, i) => ({ x: (i + 0.5) * slot, y: yFor(v) }));
  const points: Point[] = [{ x: 0, y: days[0].y }, ...days, { x: VIEW_WIDTH, y: days[6].y }];

  const split = selectedIndex + 1;
  let solid = `M ${points[0].x} ${points[0].y}`;
  let dotted = "";
  for (let i = 0; i < points.length - 1; i++) {
    const { c1, c2, p2 } = cubicSegment(points, i);
    if (i < split) {
      solid += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
    } else {
      if (i === split) dotted += `M ${points[i].x} ${points[i].y}`;
      dotted += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
    }
  }

  return { solid, dotted, baseline, marker: days[selectedIndex] };
}

/**
 * The reference stats screen's hero: a dark smoky-glass card holding a
 * smooth weekly curve with a marker on the selected day, a row of
 * S M T W T F S chips, and a "‹ Jun 6 – Jun 12 ›" range control — ported
 * from lib/design/curve_chart_card.dart.
 */
export function CurveChartCard({
  title,
  selectedValueLabel,
  values,
  selectedIndex,
  onDaySelected,
  rangeLabel,
  onPreviousWeek,
  onNextWeek,
}: {
  title: string;
  selectedValueLabel: string;
  values: number[];
  selectedIndex: number;
  onDaySelected: (index: number) => void;
  rangeLabel: string;
  onPreviousWeek?: () => void;
  onNextWeek?: () => void;
}) {
  const { solid, dotted, baseline, marker } = buildPaths(values, selectedIndex);

  return (
    <HeroCard className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -inset-x-6 -bottom-16 h-[200px]"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in srgb, var(--color-misty-sky) 55%, transparent), transparent 70%)",
        }}
      />
      <div className="relative">
        <div className="flex items-baseline justify-between">
          <p className="text-[17px] font-medium">{title}</p>
          <p className="text-[17px] font-medium tabular-nums">{selectedValueLabel}</p>
        </div>

        <div className="h-4" />
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-[120px] w-full"
          role="img"
          aria-label={`${title}, ${DAY_NAMES[selectedIndex]}: ${selectedValueLabel}`}
        >
          <line
            x1={0}
            y1={baseline}
            x2={VIEW_WIDTH}
            y2={baseline}
            stroke="var(--color-hero-on-surface)"
            strokeOpacity={0.3}
            strokeWidth={1}
            strokeDasharray="2 4"
          />
          <path
            d={solid}
            fill="none"
            stroke="var(--color-hero-on-surface)"
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          {dotted && (
            <path
              d={dotted}
              fill="none"
              stroke="var(--color-hero-on-surface)"
              strokeOpacity={0.6}
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeDasharray="1.5 4"
            />
          )}
          <line
            x1={marker.x}
            y1={marker.y}
            x2={marker.x}
            y2={baseline}
            stroke="var(--color-hero-on-surface)"
            strokeOpacity={0.3}
            strokeWidth={1}
            strokeDasharray="2 3"
          />
          <circle cx={marker.x} cy={marker.y} r={13} fill="var(--color-hero-on-surface)" fillOpacity={0.16} />
          <circle
            cx={marker.x}
            cy={marker.y}
            r={13}
            fill="none"
            stroke="var(--color-hero-on-surface)"
            strokeOpacity={0.35}
            strokeWidth={1}
          />
          <circle cx={marker.x} cy={marker.y} r={3} fill="var(--color-hero-on-surface)" />
        </svg>

        <div className="h-2" />
        <div className="flex justify-between">
          {DAY_LETTERS.map((letter, i) => (
            <button
              key={i}
              type="button"
              aria-label={DAY_NAMES[i]}
              onClick={() => onDaySelected(i)}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-[12px] transition-colors duration-200"
              style={{
                background: i === selectedIndex ? "white" : "transparent",
                border: i === selectedIndex ? "none" : "1px solid rgb(255 255 255 / 25%)",
                color: i === selectedIndex ? "var(--color-hero-surface)" : "rgb(244 245 248 / 60%)",
              }}
            >
              {letter}
            </button>
          ))}
        </div>

        <div className="h-2" />
        <div className="flex items-center justify-center gap-2">
          <WeekArrow direction="left" onClick={onPreviousWeek} />
          <p className="max-w-[55%] truncate text-center text-[15px] text-hero-on-surface">
            {rangeLabel}
          </p>
          <WeekArrow direction="right" onClick={onNextWeek} />
        </div>
      </div>
    </HeroCard>
  );
}

function WeekArrow({ direction, onClick }: { direction: "left" | "right"; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label={direction === "left" ? "Previous week" : "Next week"}
      disabled={!onClick}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center disabled:opacity-25"
    >
      <Image
        src={`/icons/vuesax/outline/arrow-${direction}.png`}
        alt=""
        width={20}
        height={20}
        className="opacity-80 invert"
      />
    </button>
  );
}
