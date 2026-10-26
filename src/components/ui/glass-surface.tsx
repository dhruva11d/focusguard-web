import type { HTMLAttributes, ReactNode } from "react";

/**
 * "Liquid Glass" — ported from lib/design/glass_surface.dart: a soft
 * ambient shadow, a frosted backdrop blur, a low-opacity fill with a
 * top-edge highlight, and a hairline border. The one recipe every glass
 * surface in the app builds on.
 */
export function GlassSurface({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-lg border border-[var(--glass-border)]
        shadow-[0_12px_32px_rgb(53_65_90_/_10%)]
        backdrop-blur-[var(--glass-blur)]
        bg-gradient-to-b from-[var(--glass-highlight)] to-[var(--glass-fill)]
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
