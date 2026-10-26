import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateRoomForm } from "@/features/rooms/components/create-room-form";

export default async function CreateRoomPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) redirect("/sign-in");

  // Defense in depth — the Community home already hides this link from
  // non-hosts, but the database is the real authority (rooms' insert
  // policy requires role = 'host'); a non-host hitting the URL directly
  // should see the same "not available" instead of a confusing RLS error.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "host") redirect("/workshop");

  return (
    <main className="mx-auto min-h-screen w-full max-w-sm">
      <header className="flex items-center px-8 pt-8">
        <Link href="/workshop" className="text-[15px] font-medium text-accent">
          ← Community
        </Link>
      </header>
      <h1 className="px-8 pt-4 text-[26px] font-semibold tracking-[-0.2px]">
        New Room
      </h1>
      <CreateRoomForm hostUserId={user.id} />
    </main>
  );
}
