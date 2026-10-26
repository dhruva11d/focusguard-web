import type { CSSProperties } from "react";

/** A shimmering placeholder block — see the `.shimmer` keyframes in
 * globals.css. `radius` defaults to a generic rounded rect; pass a pixel
 * value or "999px" for a pill/circle shape. */
export function Skeleton({
  className = "",
  radius = "var(--radius-md)",
  style,
}: {
  className?: string;
  radius?: string;
  style?: CSSProperties;
}) {
  return <div className={`shimmer ${className}`} style={{ borderRadius: radius, ...style }} />;
}
