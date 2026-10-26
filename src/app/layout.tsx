import type { Metadata } from "next";
import { Jost, DotGothic16 } from "next/font/google";
import "./globals.css";

// Matches lib/app/theme/app_typography.dart: Jost, restrained to the same
// three weights the Flutter app uses (no 300/700/800).
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Matches StatPill's GoogleFonts.dotGothic16 — the dot-matrix digits on
// the session-history screen's small metric pills.
const dotGothic16 = DotGothic16({
  variable: "--font-dot-gothic",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "FocusGuard",
  description: "Stay accountable in a shared focus session.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jost.variable} ${dotGothic16.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-on-background">
        {children}
      </body>
    </html>
  );
}
