import type { ReactNode } from "react";
import Link from "next/link";

/**
 * A secondary action — icon + title/subtitle + chevron — ported from
 * community_home_page.dart's `_QuietActionRow`. Deliberately plainer than
 * [GlowActionTile], so it doesn't compete for attention.
 */
export function QuietActionRow({
  href,
  onClick,
  icon,
  title,
  subtitle,
}: {
  href?: string;
  onClick?: () => void;
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  const content = (
    <div className="flex items-center gap-4 py-2">
      <span className="text-on-background-muted">{icon}</span>
      <div className="flex-1">
        <p className="text-[15px]">{title}</p>
        <p className="text-[13px] text-on-background-muted">{subtitle}</p>
      </div>
      <ChevronRight />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {content}
    </button>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-on-background-faint" strokeWidth="2">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
