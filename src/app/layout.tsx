import type { Metadata, Viewport } from "next";
import { Jost, DotGothic16 } from "next/font/google";
import { InstallPromptCapture } from "@/features/install/install-prompt";
import { RegisterServiceWorker } from "@/features/install/register-service-worker";
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
  applicationName: "FocusGuard",
  // iOS ignores the manifest's icons and display mode; these make "Add to
  // Home Screen" open full screen with the app icon.
  appleWebApp: {
    capable: true,
    title: "FocusGuard",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/app/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f5f8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jost.variable} ${dotGothic16.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-on-background">
        {children}
        <InstallPromptCapture />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
