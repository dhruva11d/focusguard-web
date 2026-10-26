import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * The app's one tactile primary action — ported from
 * lib/design/primary_action_button.dart: a solid black pill, white text,
 * no blur or gradient layers. `:active` handles the press-scale feedback
 * natively instead of tracking press state in JS, since the web already
 * has that pseudo-class.
 */
export function PrimaryActionButton({
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode }) {
  return (
    <button
      disabled={disabled}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-full bg-black text-white
        shadow-[0_4px_16px_rgb(53_65_90_/_10%)]
        transition-[opacity,transform] duration-[var(--motion-fast)] [transition-timing-function:var(--motion-fast-ease)]
        active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100
        text-[18px] font-medium tracking-[-0.1px]
        ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
