import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentAccountServer, serverBackendGet } from "@/lib/backend/server";
import { QuietActionRow } from "@/components/ui/quiet-action-row";
import { Hairline } from "@/components/ui/hairline";
import { SectionLabel } from "@/components/ui/section-label";
import { GlowActionTile } from "@/components/ui/glow-action-tile";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { InstallAppCard } from "@/features/install/install-prompt";
import type { Room } from "@/features/rooms/types";

type MyRoom = Room & { membershipRole: string; joinedAt: string };

export default async function WorkshopPage() {
  const account = await getCurrentAccountServer();
  if (!account) redirect("/sign-in");
  let rooms: MyRoom[] = [];
  let roomsError = false;
  try {
    rooms = await serverBackendGet<MyRoom[]>("/api/rooms/my") ?? [];
  } catch {
    roomsError = true;
  }
  const isHost = account.role === "host";

  return (
    <main className="mx-auto min-h-screen w-full max-w-sm px-8 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.2px]">Focus together.</h1>
          <p className="text-[15px] text-on-background-muted">Share a room, stay accountable.</p>
        </div>
        <SignOutButton />
      </div>

      <InstallAppCard />

      <QuietActionRow href="/personal" icon={<StopwatchIcon />} title="Personal focus" subtitle="Measure your own focus time, solo." />
      <Hairline />

      {isHost && (
        <div className="mt-4 mb-8">
          <GlowActionTile href="/workshop/create" icon={<PlusCircleIcon />} title="Create a room" subtitle="Start a shared focus session." gradient="linear-gradient(135deg, var(--color-accent), var(--color-lavender))" shadowColor="rgb(154 145 222 / 35%)" />
        </div>
      )}

      <QuietActionRow href="/workshop/join" icon={<QrCodeIcon />} title="Join a room" subtitle="Enter a room code once to become a member." />
      <Hairline />
      <QuietActionRow href="/workshop/history" icon={<Image src="/icons/vuesax/outline/clock.png" alt="" width={22} height={22} />} title="History" subtitle="Your past community sessions." />
      <Hairline />

      <div className="mt-8">
        <SectionLabel>Your rooms</SectionLabel>
        <div className="h-2" />
        {roomsError ? (
          <p className="py-2 text-[15px] text-violation">Could not load your rooms.</p>
        ) : rooms.length === 0 ? (
          <p className="py-2 text-[15px] text-on-background-muted">No rooms yet. Join one with a code, or host your own.</p>
        ) : rooms.map((room) => (
          <div key={room.id}>
            <QuietActionRow href={`/workshop/room/${room.id}`} icon={<GroupsIcon />} title={room.name} subtitle={room.hostId === account.id ? "You host this room" : "Member"} />
            <Hairline />
          </div>
        ))}
      </div>
    </main>
  );
}

function StopwatchIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M10 2h4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function PlusCircleIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><circle cx="12" cy="12" r="9.5" /><path d="M12 8v8M8 12h8" strokeLinecap="round" /></svg>;
}
function QrCodeIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM19 14h2M14 19h2M19 19h2" strokeLinecap="round" /></svg>;
}
function GroupsIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" /><circle cx="17" cy="9" r="2.5" /><path d="M15.5 14.3c2.3.3 4 2.4 4 5" strokeLinecap="round" /></svg>;
}
