import { redirect } from "next/navigation";
import { getCurrentAccountServer } from "@/lib/backend/server";
import { PersonalSessionView } from "@/features/personal-sessions/components/personal-session-view";

const DEFAULT_MINUTES = 25;
const MAX_MINUTES = 180;

export default async function PersonalSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ minutes?: string }>;
}) {
  const { minutes } = await searchParams;
  const account = await getCurrentAccountServer();
  if (!account) redirect("/sign-in");
  const parsedMinutes = Number(minutes);
  const totalSeconds = Number.isFinite(parsedMinutes) && parsedMinutes > 0
    ? Math.round(Math.min(parsedMinutes, MAX_MINUTES) * 60)
    : DEFAULT_MINUTES * 60;
  return <PersonalSessionView userId={account.id} totalSeconds={totalSeconds} />;
}
