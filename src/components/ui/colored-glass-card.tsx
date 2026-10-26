import type { HTMLAttributes, ReactNode } from "react";
import { GrainOverlay } from "./grain-overlay";

/**
 * "Colored glass" — ported from lib/design/colored_glass_card.dart: a
 * vivid gradient, an organic asymmetric radius, a soft white highlight
 * blob in the top-left corner, and a faint grain, the way real glass
 * actually reflects. Reserved for the one or two cards a screen means to
 * make bold — never a repeated per-item treatment.
 */
export function ColoredGlassCard({
  gradient,
  /** The gradient's deepest color at 35% alpha, e.g. "rgb(154 145 222 / 35%)". */
  shadowColor,
  /** Defaults to the organic asymmetric shape; pass e.g. "44px" for a
   * uniform stadium radius (StatPill's `_radius` override). */
  radius = "44px 28px 48px 28px",
  /** False drops the drop shadow entirely. */
  shadow = true,
  /** False drops the white corner-highlight blob (the glassy sheen). */
  highlight = true,
  children,
  className = "",
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  gradient: string;
  shadowColor: string;
  radius?: string;
  shadow?: boolean;
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden p-6 text-white ${className}`}
      style={{
        background: gradient,
        borderRadius: radius,
        boxShadow: shadow ? `0 16px 36px ${shadowColor}` : "none",
        ...style,
      }}
      {...props}
    >
      <GrainOverlay />
      {highlight && (
        <div
          className="pointer-events-none absolute -top-3 -left-3 size-35 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgb(255 255 255 / 45%), rgb(255 255 255 / 0%))",
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
