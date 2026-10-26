/** A 1px divider — ported from lib/design/hairline.dart. */
export function Hairline({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-hairline ${className}`} />;
}
