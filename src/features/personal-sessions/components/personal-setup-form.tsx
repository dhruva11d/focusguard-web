"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryActionButton } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { DurationPicker } from "@/components/ui/duration-picker";

const DEFAULT_DURATION_MINUTES = 25;

/**
 * Duration selection, ported from session_setup_page.dart minus the
 * physical placement step — starting here goes straight to the active
 * timer, since there's no phone to place face-down on the web.
 */
export function PersonalSetupForm() {
  const router = useRouter();
  const [minutes, setMinutes] = useState(DEFAULT_DURATION_MINUTES);

  return (
    <div>
      <SectionLabel>Focus duration</SectionLabel>
      <div className="h-2" />
      <DurationPicker initialMinutes={minutes} onChange={setMinutes} />
      <div className="h-6" />
      <PrimaryActionButton onClick={() => router.push(`/personal/session?minutes=${minutes}`)}>
        Start Focus Session
      </PrimaryActionButton>
    </div>
  );
}
