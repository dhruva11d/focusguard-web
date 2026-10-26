"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface FloatingPillNavItem {
  href: string;
  label: string;
  icon: (color: string) => ReactNode;
}

const BAR_HEIGHT = 76;
const PUCK_SIZE = 68;

/**
 * Floating capsule bottom nav — ported from lib/design/floating_pill_nav.dart:
 * one glass pill holding every tab, with a frosted "lens" that slides to sit
 * over the active tab, rather than a tinted pill growing a label. Selection
 * comes from the current route (`usePathname`) instead of a controlled
 * index — the web equivalent of Flutter's `selectedIndex`/`onSelected`,
 * since each tab here really is its own route rather than an
 * `IndexedStack` entry.
 */
export function FloatingPillNav({ items }: { items: FloatingPillNavItem[] }) {
  const pathname = usePathname();
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.href === pathname),
  );
  const slotPercent = 100 / items.length;
  const puckLeft = `calc(${slotPercent * selectedIndex}% + ${slotPercent / 2}% - ${PUCK_SIZE / 2}px)`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-6 pb-4">
      <div className="w-full max-w-sm">
        <div
          className="relative overflow-hidden rounded-full border border-[var(--glass-border)] p-1 backdrop-blur-[var(--glass-blur)]"
          style={{
            height: BAR_HEIGHT,
            background: "linear-gradient(to bottom, var(--glass-highlight), var(--glass-fill))",
            boxShadow: "0 12px 32px rgb(53 65 90 / 14%), inset 0 0 10px rgb(53 65 90 / 16%)",
          }}
        >
          <div
            className="absolute transition-[left] duration-[380ms] [transition-timing-function:cubic-bezier(0.645,0.045,0.355,1)]"
            style={{ left: puckLeft, top: (BAR_HEIGHT - PUCK_SIZE) / 2, width: PUCK_SIZE, height: PUCK_SIZE }}
          >
            <Puck />
          </div>

          <div className="relative flex h-full">
            {items.map((item, i) => {
              const selected = i === selectedIndex;
              const color = selected ? "var(--color-on-background)" : "var(--color-on-background-faint)";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className="flex flex-1 items-center justify-center"
                >
                  <span
                    className="flex transition-transform duration-[380ms] [transition-timing-function:cubic-bezier(0.645,0.045,0.355,1)] active:scale-90"
                    style={{ transform: selected ? "scale(1.2)" : "scale(1)" }}
                  >
                    {item.icon(color)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

/**
 * The glass lens over the selected tab, styled as a bead of water resting
 * on the bar — ported from `_Puck`/`_PuckContactShadowPainter`: a soft
 * halo, a directional contact shadow, a stronger inner blur than the bar
 * itself, a refractive bezel, a specular crescent, a tight glint, and rim
 * darkening along the base. Approximated with layered gradients instead
 * of a custom painter — CSS can't stack two independently blurred glass
 * layers as cheaply as Flutter's Stack can, but the same visual read
 * (an actual lens of glass, not a flat colored disc) carries over.
 */
function Puck() {
  return (
    <div className="relative h-full w-full">
      <div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: "0 3px 16px rgb(53 65 90 / 10%), 0 0 6px rgb(53 65 90 / 4%)" }}
      />
      <div
        className="absolute -inset-x-2 -bottom-2 h-5 rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, rgb(53 65 90 / 24%), transparent 70%)",
          filter: "blur(4px)",
        }}
      />
      <div
        className="absolute inset-0 overflow-hidden rounded-full backdrop-blur-[30px]"
        style={{ background: "rgb(255 255 255 / 12%)" }}
      >
        <div
          className="absolute inset-0 rounded-full border-[1.5px]"
          style={{
            borderColor: "rgb(255 255 255 / 70%)",
            background:
              "linear-gradient(135deg, rgb(255 255 255 / 85%), rgb(255 255 255 / 20%) 25%, transparent 65%, rgb(0 0 0 / 10%))",
          }}
        />
        <div
          className="absolute left-1/2 top-[3%] h-[22%] w-[65%] -translate-x-1/2 rounded-t-full"
          style={{ background: "linear-gradient(to bottom, rgb(255 255 255 / 75%), transparent)" }}
        />
        <div
          className="absolute h-[16%] w-[16%] rounded-full"
          style={{
            left: "29%",
            top: "24%",
            background: "radial-gradient(circle, rgb(255 255 255 / 75%), transparent 70%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[30%] rounded-b-full"
          style={{ background: "linear-gradient(to bottom, transparent, rgb(0 0 0 / 5%))" }}
        />
      </div>
    </div>
  );
}
