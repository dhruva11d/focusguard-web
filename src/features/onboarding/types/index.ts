import type { ReactNode } from "react";

export interface OnboardingSlide {
  /** Path under /public once the real doodle illustration is placed —
   * null falls back to `icon` in a soft gradient badge, same conditional
   * `_SlideView` uses in the Flutter app. */
  image: string | null;
  icon: ReactNode;
  title: string;
  body: string;
}
