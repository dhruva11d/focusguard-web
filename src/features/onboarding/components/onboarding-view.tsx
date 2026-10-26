"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PrimaryActionButton } from "@/components/ui/button";
import { markOnboardingSeen } from "@/lib/onboarding-storage";
import { onboardingSlides } from "./onboarding-slides";

const SWIPE_THRESHOLD_PX = 50;

/**
 * First-run introduction — ported from onboarding_page.dart: swipeable
 * slides, a dot pager, Skip in the corner, Next/Get Started at the
 * bottom. Always light-themed in Flutter (the illustrations were drawn
 * against the light palette only); this app is light-only anyway, so
 * that override doesn't apply here.
 */
export function OnboardingView({ next }: { next: string }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const isLast = page === onboardingSlides.length - 1;

  function finish() {
    markOnboardingSeen();
    router.push(next);
  }

  function goTo(index: number) {
    setPage(Math.max(0, Math.min(onboardingSlides.length - 1, index)));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX == null) return;
    const delta = e.changedTouches[0].clientX - startX;
    if (delta <= -SWIPE_THRESHOLD_PX) goTo(page + 1);
    else if (delta >= SWIPE_THRESHOLD_PX) goTo(page - 1);
  }

  const slide = onboardingSlides[page];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-0 py-0">
      <div className="flex justify-end px-4 pt-4">
        <button onClick={finish} className="px-4 py-2 text-[15px] font-medium text-accent">
          Skip
        </button>
      </div>

      <div
        className="flex flex-1 flex-col items-center justify-center px-12 text-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slide.image ? (
          <Image src={slide.image} alt="" width={300} height={200} style={{ height: 200, width: "auto" }} />
        ) : (
          <div
            className="flex h-40 w-40 items-center justify-center rounded-full text-accent"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 28%, transparent), color-mix(in srgb, var(--color-accent) 4%, transparent))",
            }}
          >
            {slide.icon}
          </div>
        )}

        <div className="h-8" />
        <h1 className="text-[22px] font-semibold tracking-[-0.2px]">{slide.title}</h1>
        <div className="h-2" />
        <p className="text-[15px] text-on-background-muted">{slide.body}</p>
      </div>

      <div className="flex items-center justify-center gap-1.5 py-4">
        {onboardingSlides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className="h-2 rounded-full transition-[width,background] duration-[var(--motion-medium)]"
            style={{
              width: i === page ? 22 : 8,
              background: i === page ? "var(--color-accent)" : "var(--color-hairline)",
            }}
          />
        ))}
      </div>

      <div className="px-8 pb-8">
        <PrimaryActionButton onClick={isLast ? finish : () => goTo(page + 1)}>
          {isLast ? "Get Started" : "Next"}
        </PrimaryActionButton>
      </div>
    </main>
  );
}
