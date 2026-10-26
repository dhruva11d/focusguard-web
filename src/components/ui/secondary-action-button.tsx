import type { ButtonHTMLAttributes } from "react";

/**
 * A lower-emphasis tactile action — "End Session" — ported from
 * lib/design/secondary_action_button.dart: the same glass recipe as the
 * primary button, muted rather than accent-colored. `tint` lets a
 * specific action borrow a semantic color (e.g. violation red) while
 * keeping the same shape language.
 */
export function SecondaryActionButton({
  tint,
  children,
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tint?: string }) {
  const color = disabled ? "var(--color-on-background-faint)" : (tint ?? "var(--color-on-background)");
  return (
    <button
      disabled={disabled}
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
      }}
      className={`h-13 w-full rounded-full border bg-[var(--glass-fill)]
        text-[18px] font-medium tracking-[-0.1px] backdrop-blur-[var(--glass-blur)]
        transition-[opacity,transform] duration-[var(--motion-fast)] [transition-timing-function:var(--motion-fast-ease)]
        active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100
        ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
