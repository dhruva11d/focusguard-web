import type { ReactNode } from "react";
import Link from "next/link";
import { ColoredGlassCard } from "./colored-glass-card";

/**
 * A large tappable choice — "Create a room" — ported from
 * lib/design/glow_action_tile.dart. Reserved for the one genuine
 * "pick this big option" moment per screen.
 */
export function GlowActionTile({
  href,
  icon,
  title,
  subtitle,
  gradient,
  shadowColor,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  gradient: string;
  shadowColor: string;
}) {
  return (
    <Link href={href} className="block transition-transform active:scale-[0.98]">
      <ColoredGlassCard gradient={gradient} shadowColor={shadowColor}>
        <div className="flex items-center gap-4">
          {icon}
          <div className="flex-1">
            <p className="text-[18px] font-medium tracking-[-0.1px]">{title}</p>
            <p className="text-[13px] text-white/85">{subtitle}</p>
          </div>
          <ChevronRight />
        </div>
      </ColoredGlassCard>
    </Link>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity={0.85} strokeWidth="2">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
