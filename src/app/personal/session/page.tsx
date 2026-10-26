import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PersonalSessionView } from "@/features/personal-sessions/components/personal-session-view";

const DEFAULT_MINUTES = 25;
const MAX_MINUTES = 180; // DurationPicker's slider max

export default async function PersonalSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ minutes?: string }>;
}) {
  const { minutes } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) redirect("/sign-in");

  const parsedMinutes = Number(minutes);
  const totalSeconds =
    Number.isFinite(parsedMinutes) && parsedMinutes > 0
      ? Math.round(Math.min(parsedMinutes, MAX_MINUTES) * 60)
      : DEFAULT_MINUTES * 60;

  return <PersonalSessionView userId={user.id} totalSeconds={totalSeconds} />;
} 
