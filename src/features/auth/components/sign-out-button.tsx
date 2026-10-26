"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "../api/auth";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    await signOut();
    router.push("/sign-in");
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="text-[15px] font-medium text-violation disabled:opacity-45"
    >
      Sign out
    </button>
  );
}
