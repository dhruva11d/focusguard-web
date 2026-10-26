import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SectionLabel } from "@/components/ui/section-label";
import { Hairline } from "@/components/ui/hairline";
import { SettingsRow } from "@/components/ui/settings-row";
import { AccountSection } from "./account-section";
import { SettingsSkeleton } from "./settings-skeleton";

/**
 * Settings — ported from settings_page.dart, scoped to About and Account
 * (Sign out, Delete account). The Focus/Notifications/Mode/Developer
 * sections aren't included: default-duration persistence, Do Not Disturb
 * silencing, and the Personal/Community mode switcher are native-platform
 * features with no web equivalent built yet, and the Developer section is
 * a Flutter debug-build-only tool.
 *
 * See `(shell)/page.tsx`'s doc comment for why this uses an explicit
 * `<Suspense>` instead of a `loading.tsx` file.
 */
export default function PersonalSettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <PersonalSettingsPageContent />
    </Suspense>
  );
}

async function PersonalSettingsPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) redirect("/sign-in");

  return (
    <main className="mx-auto min-h-screen w-full max-w-sm px-8 py-8">
      <h1 className="pb-6 text-[26px] font-semibold tracking-[-0.2px]">Settings</h1>

      <SectionLabel>Account</SectionLabel>
      <div className="h-2" />
      <AccountSection />

      <div className="h-8" />
      <SectionLabel>About</SectionLabel>
      <div className="h-2" />
      <SettingsRow
        icon={<ShieldIcon />}
        title="FocusGuard"
        subtitle="Stay off your phone while you focus — leaving FocusGuard during a session counts as an interruption."
      />
      <Hairline />
    </main>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
