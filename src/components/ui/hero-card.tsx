import type { HTMLAttributes, ReactNode } from "react";
import { GrainOverlay } from "./grain-overlay";

/**
 * The one dark, smoky-navy glass card per screen — ported from
 * lib/design/hero_card.dart. The main contrast element in the "light
 * environment, dark primary card" hierarchy: everything else on screen
 * is light/neutral, and this is the single object that carries weight.
 * Text inside should use `text-hero-on-surface`/`text-hero-on-surface-muted`,
 * not the normal on-background roles — those are tuned for light surfaces.
 */
export function HeroCard({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/10 text-hero-on-surface shadow-[0_16px_40px_rgb(53_65_90_/_22%)] ${className}`}
      style={{
        background:
          "linear-gradient(135deg, var(--color-hero-surface), var(--color-hero-surface-gradient-end))",
      }}
      {...props}
    >
      <GrainOverlay opacity={0.09} />
      <div className="relative p-8">{children}</div>
    </div>
  );
}
