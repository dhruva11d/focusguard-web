"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryActionButton } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { joinRoom } from "../api/rooms";

const ROOM_CODE_LENGTH = 6;

/**
 * Ported from join_room_page.dart — minus the "Your name" field, for the
 * same reason as CreateRoomForm: the display name now comes from the
 * signed-in account.
 */
export function JoinRoomForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !submitting && code.length === ROOM_CODE_LENGTH;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const joinResult = await joinRoom({ code });
    setSubmitting(false);
    if (joinResult.error) {
      setError(joinResult.error);
      return;
    }
    router.push(`/workshop/room/${joinResult.data}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-8 py-8">
      <div>
        <SectionLabel>Room code</SectionLabel>
        <div className="h-2" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, ROOM_CODE_LENGTH))}
          inputMode="numeric"
          placeholder="482913"
          className="w-full rounded-md border border-hairline bg-[var(--glass-fill)]
            px-4 py-4 text-center text-[26px] font-semibold tracking-[8px] text-on-background
            outline-none backdrop-blur-[var(--glass-blur)] placeholder:text-on-background-faint
            focus:border-accent/60"
        />
      </div>

      {error && <p className="text-[15px] text-violation">{error}</p>}

      <PrimaryActionButton type="submit" disabled={!canSubmit}>
        {submitting ? "Joining…" : "Join Room"}
      </PrimaryActionButton>
    </form>
  );
}
