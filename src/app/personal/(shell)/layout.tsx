import { PersonalNav } from "@/features/personal-sessions/components/personal-nav";

/**
 * Personal Mode's tabbed shell — ported from MainShell: the Focus and
 * History screens share this floating nav; the active-session screen
 * (`/personal/session`) deliberately sits outside this route group, the
 * same way `FocusSessionPage` has no bottom nav in the Flutter app.
 */
export default function PersonalShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-24">{children}</div>
      <PersonalNav />
    </>
  );
}
