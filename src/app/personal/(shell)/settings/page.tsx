import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentAccountServer } from "@/lib/backend/server";
import { SectionLabel } from "@/components/ui/section-label";
import { Hairline } from "@/components/ui/hairline";
import { SettingsRow } from "@/components/ui/settings-row";
import { AccountSection } from "./account-section";
import { SettingsSkeleton } from "./settings-skeleton";

export default function PersonalSettingsPage() {
  return <Suspense fallback={<SettingsSkeleton />}><PersonalSettingsPageContent /></Suspense>;
}

async function PersonalSettingsPageContent() {
  const account = await getCurrentAccountServer();
  if (!account) redirect("/sign-in");

  return (
    <main className="mx-auto min-h-screen w-full max-w-sm px-8 py-8">
      <h1 className="pb-6 text-[26px] font-semibold tracking-[-0.2px]">Settings</h1>
      <SectionLabel>Account</SectionLabel>
      <div className="h-2" />
      <AccountSection />
      <div className="h-8" />
      <SectionLabel>About</SectionLabel>
      <div className="h-2" />
      <SettingsRow icon={<ShieldIcon />} title="FocusGuard" subtitle="Stay off your phone while you focus — leaving FocusGuard during a session counts as an interruption." />
      <Hairline />
    </main>
  );
}

function ShieldIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
