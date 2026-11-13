import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAccountServer } from "@/lib/backend/server";
import { CreateRoomForm } from "@/features/rooms/components/create-room-form";

export default async function CreateRoomPage() {
  const account = await getCurrentAccountServer();
  if (!account) redirect("/sign-in");
  if (account.role !== "host") redirect("/workshop");

  return (
    <main className="mx-auto min-h-screen w-full max-w-sm">
      <header className="flex items-center px-8 pt-8">
        <Link href="/workshop" className="text-[15px] font-medium text-accent">← Community</Link>
      </header>
      <h1 className="px-8 pt-4 text-[26px] font-semibold tracking-[-0.2px]">New Room</h1>
      <CreateRoomForm />
    </main>
  );
}
