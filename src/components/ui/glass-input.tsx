import type { InputHTMLAttributes } from "react";

/**
 * Ported from lib/design/glass_text_field.dart: frosted fill, hairline
 * border, large radius — the one text input styling every screen uses
 * instead of a bare input.
 */
export function GlassInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-hairline bg-[var(--glass-fill)]
        px-4 py-4 text-[15px] text-on-background outline-none backdrop-blur-[var(--glass-blur)]
        placeholder:text-on-background-faint
        focus:border-accent/60
        ${props.className ?? ""}`}
    />
  );
}
