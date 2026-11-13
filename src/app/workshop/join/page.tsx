import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAccountServer } from "@/lib/backend/server";
import { JoinRoomForm } from "@/features/rooms/components/join-room-form";

export default async function JoinRoomPage() {
  const account = await getCurrentAccountServer();
  if (!account) redirect("/sign-in");

  return (
    <main className="mx-auto min-h-screen w-full max-w-sm">
      <header className="flex items-center px-8 pt-8">
        <Link href="/workshop" className="text-[15px] font-medium text-accent">← Community</Link>
      </header>
      <h1 className="px-8 pt-4 text-[26px] font-semibold tracking-[-0.2px]">Join Room</h1>
      <JoinRoomForm />
    </main>
  );
}
