"use client";

import Image from "next/image";
import { FloatingPillNav, type FloatingPillNavItem } from "@/components/ui/floating-pill-nav";

/** Personal Mode's three tabs — ported from MainShell's `_items`. */
const items: FloatingPillNavItem[] = [
  { href: "/personal", label: "Focus", icon: (color) => <FocusIcon color={color} /> },
  { href: "/personal/history", label: "History", icon: (color) => <HistoryIcon color={color} /> },
  { href: "/personal/settings", label: "Settings", icon: (color) => <SettingsIcon color={color} /> },
];

export function PersonalNav() {
  return <FloatingPillNav items={items} />;
}

/** The actual "Minimalist Meditating Lotus Icon" artwork (a black-line
 * doodle, same house style as the onboarding illustrations) — not
 * recolorable like the other two tabs' stroke icons, so selection is
 * conveyed by opacity instead (full when selected, muted otherwise),
 * on top of the puck/scale cues `FloatingPillNav` already provides. */
function FocusIcon({ color }: { color: string }) {
  const selected = color === "var(--color-on-background)";
  return (
    <Image
      src="/images/nav-focus-lotus.png"
      alt=""
      width={26}
      height={26}
      style={{ opacity: selected ? 1 : 0.45 }}
    />
  );
}

function HistoryIcon({ color }: { color: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon({ color }: { color: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6">
      <path d="M4 7h10M17 7h3M4 12h3M10 12h10M4 17h10M17 17h3" strokeLinecap="round" />
      <circle cx="14" cy="7" r="2" fill={color} stroke="none" />
      <circle cx="7" cy="12" r="2" fill={color} stroke="none" />
      <circle cx="14" cy="17" r="2" fill={color} stroke="none" />
    </svg>
  );
}
