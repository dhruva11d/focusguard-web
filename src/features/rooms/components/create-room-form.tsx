"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryActionButton } from "@/components/ui/button";
import { GlassInput } from "@/components/ui/glass-input";
import { SectionLabel } from "@/components/ui/section-label";
import { DurationPicker } from "@/components/ui/duration-picker";
import { createRoom } from "../api/rooms";

const MAX_ROOM_NAME_LENGTH = 60; // CommunityLimits.maxRoomNameLength
const DEFAULT_DURATION_MINUTES = 25;

/**
 * Ported from create_room_page.dart — minus the "Your name" field the
 * Flutter screen still asks for. That field predates the account system;
 * the display name now comes from the signed-in account, so asking for
 * it again here would be redundant (and is worth fixing on the Flutter
 * side too).
 */
export function CreateRoomForm({ hostUserId }: { hostUserId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState(DEFAULT_DURATION_MINUTES);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !submitting && name.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createRoom({ name: name.trim(), hostUserId });
    if (!result.data) {
      setSubmitting(false);
      setError(result.error);
      return;
    }
    router.push(`/workshop/room/${result.data.id}?duration=${minutes}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-8 py-8">
      <div>
        <SectionLabel>Room name</SectionLabel>
        <div className="h-2" />
        <GlassInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_ROOM_NAME_LENGTH}
          placeholder="e.g. MCA Focus"
        />
      </div>

      <div>
        <SectionLabel>Focus duration</SectionLabel>
        <div className="h-2" />
        <DurationPicker initialMinutes={minutes} onChange={setMinutes} />
      </div>

      {error && <p className="text-[15px] text-violation">{error}</p>}

      <PrimaryActionButton type="submit" disabled={!canSubmit}>
        {submitting ? "Creating…" : "Create Room"}
      </PrimaryActionButton>
    </form>
  );
}
