import Link from "next/link";

/**
 * The "← Label" back navigation at the top of a screen. One row: the arrow
 * and label are centered on the cross axis with a fixed gap, and the link
 * is only as wide as its content.
 *
 * The arrow's viewBox is cropped to the stroke's drawn edge, so the
 * link's left edge lines up exactly with the page heading below it. No
 * horizontal padding for the same reason; vertical padding gives a
 * comfortable tap target without shifting anything sideways.
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-sm py-1.5 text-[15px] font-medium leading-none text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <svg
        width="16"
        height="16"
        viewBox="4 4 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="shrink-0"
      >
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
