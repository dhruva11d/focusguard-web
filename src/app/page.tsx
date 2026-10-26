import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * The login gate — mirrors bootstrap.dart's `resolveInitialLocation`:
 * every visit lands on sign-in unless a verified account is already
 * signed in.
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email_confirmed_at) {
    redirect("/workshop");
  }
  redirect("/sign-in");
}
