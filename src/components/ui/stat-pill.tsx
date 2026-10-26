import { ColoredGlassCard } from "./colored-glass-card";

/** The stat-pill trio from the reference stats screen — ported from
 * AppGradients' pillMagenta/pillIndigo/pillSunset. */
export const STAT_PILL_GRADIENTS = {
  magenta: {
    gradient: "linear-gradient(135deg, #E879E8, #E9947F, #4A4A3A)",
    shadowColor: "rgb(232 121 232 / 30%)",
  },
  indigo: {
    gradient: "linear-gradient(135deg, #2B2E6B, #4F5BBE, #8EB8D8)",
    shadowColor: "rgb(79 91 190 / 30%)",
  },
  sunset: {
    gradient: "linear-gradient(135deg, #C8453F, #F0803C, #F7C35C)",
    shadowColor: "rgb(240 128 60 / 30%)",
  },
} as const;

function changeText(percent: number): string {
  const arrow = percent > 0 ? "↑ " : percent < 0 ? "↓ " : "";
  return `${arrow}${Math.abs(percent)}%`;
}

/**
 * A small vivid metric pill — label, a dot-matrix value, and an optional
 * change badge — ported from lib/design/stat_pill.dart. Built on
 * `ColoredGlassCard`, so it shares the colored-glass blur, highlight and
 * grain; only the gradient and the compact stadium shape differ.
 */
export function StatPill({
  label,
  value,
  unit,
  tone,
  changePercent,
}: {
  label: string;
  value: string;
  unit?: string;
  tone: keyof typeof STAT_PILL_GRADIENTS;
  changePercent?: number | null;
}) {
  const { gradient, shadowColor } = STAT_PILL_GRADIENTS[tone];
  return (
    <ColoredGlassCard
      gradient={gradient}
      shadowColor={shadowColor}
      radius="44px"
      highlight={false}
      className="!p-[14px_18px]"
    >
      <p className="truncate text-[13px] text-white/85">{label}</p>
      <div className="h-1.5" />
      <div className="flex items-end gap-1.5">
        <span
          className="font-[family-name:var(--font-dot-gothic)] text-[26px] leading-none text-white"
        >
          {value}
        </span>
        {unit && <span className="pb-0.5 text-[13px] text-white/75">{unit}</span>}
        {changePercent != null && (
          <span className="ml-auto rounded-full border border-white/60 bg-white/12 px-2 py-0.5 text-[11px] text-white">
            {changeText(changePercent)}
          </span>
        )}
      </div>
    </ColoredGlassCard>
  );
}

/** The plain white "+" pill shortcut — ported from `AddPill`. */
export function AddPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-[90px] items-center justify-center rounded-[44px] bg-white/92 shadow-[0_10px_24px_rgb(0_0_0_/_10%)] transition-transform duration-150 active:scale-[0.97]"
    >
      <PlusIcon />
    </a>
  );
}

function PlusIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#202434" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
