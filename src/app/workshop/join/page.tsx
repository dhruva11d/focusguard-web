import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JoinRoomForm } from "@/features/rooms/components/join-room-form";

export default async function JoinRoomPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) redirect("/sign-in");

  return (
    <main className="mx-auto min-h-screen w-full max-w-sm">
      <header className="flex items-center px-8 pt-8">
        <Link href="/workshop" className="text-[15px] font-medium text-accent">
          ← Community
        </Link>
      </header>
      <h1 className="px-8 pt-4 text-[26px] font-semibold tracking-[-0.2px]">
        Join Room
      </h1>
      <JoinRoomForm userId={user.id} />
    </main>
  );
}
