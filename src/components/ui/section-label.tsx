/** Ported from lib/design/section_label.dart: labelSmall, muted, wide tracking. */
export function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold tracking-[0.3px] text-on-background-muted uppercase">
      {children}
    </p>
  );
}
