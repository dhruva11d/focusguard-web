import { redirect } from "next/navigation";
import { getCurrentAccountServer } from "@/lib/backend/server";
import { OnboardingView } from "@/features/onboarding/components/onboarding-view";

const SAFE_DESTINATIONS = new Set(["/workshop", "/personal"]);

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const account = await getCurrentAccountServer();
  if (!account) redirect("/sign-in");
  return <OnboardingView next={next && SAFE_DESTINATIONS.has(next) ? next : "/workshop"} />;
}
