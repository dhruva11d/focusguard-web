import type { ReactNode } from "react";

/**
 * A single cardless settings row — icon, title/subtitle, and either a
 * chevron (tappable) or a custom `trailing` control — ported from
 * settings_page.dart's `_SettingsRow`. No `href`: every row here is an
 * in-place action (sign out, delete account), not a navigation link.
 */
export function SettingsRow({
  icon,
  title,
  subtitle,
  trailing,
  onClick,
  tone = "default",
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onClick?: () => void;
  tone?: "default" | "destructive";
}) {
  const content = (
    <div className="flex min-h-14 items-center gap-4 py-3">
      <span style={{ color: tone === "destructive" ? "var(--color-violation)" : "var(--color-on-background-muted)" }}>
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-[15px]" style={{ color: tone === "destructive" ? "var(--color-violation)" : undefined }}>
          {title}
        </p>
        {subtitle && <p className="text-[13px] text-on-background-muted">{subtitle}</p>}
      </div>
      {trailing}
      {!trailing && onClick && <ChevronRight />}
    </div>
  );

  if (!onClick) return content;
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
