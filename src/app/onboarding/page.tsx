import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingView } from "@/features/onboarding/components/onboarding-view";

const SAFE_DESTINATIONS = new Set(["/workshop", "/personal"]);

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) redirect("/sign-in");

  const destination = next && SAFE_DESTINATIONS.has(next) ? next : "/workshop";

  return <OnboardingView next={destination} />;
}
