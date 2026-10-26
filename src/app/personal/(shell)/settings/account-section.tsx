"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SettingsRow } from "@/components/ui/settings-row";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { signOut, deleteAccount } from "@/features/auth/api/auth";

/** Ported from SettingsPage's `_signOut`/`_confirmDeleteAccount`. */
export function AccountSection() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    router.push("/sign-in");
  }

  async function handleDeleteAccount() {
    setConfirmOpen(false);
    setBusy(true);
    const result = await deleteAccount();
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/sign-in");
  }

  return (
    <div>
      <SettingsRow
        icon={<SignOutIcon />}
        title="Sign out"
        subtitle="You will need to sign in again to use the app"
        onClick={handleSignOut}
      />
      <SettingsRow
        icon={<DeleteIcon />}
        title="Delete account"
        subtitle="Permanently removes your account and data"
        tone="destructive"
        onClick={() => setConfirmOpen(true)}
      />
      {error && <p className="pt-2 text-[13px] text-violation">{error}</p>}
      {busy && <p className="pt-2 text-[13px] text-on-background-muted">Working…</p>}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete account?"
        message="Your account is disabled immediately and permanently deleted after 6 hours. Rooms you host will close, and you will be removed from every room and shared session list."
        cancelLabel="Cancel"
        confirmLabel="Delete"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}

function SignOutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 16l4-4-4-4M19 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  );
}
