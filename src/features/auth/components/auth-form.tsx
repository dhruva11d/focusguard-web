"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryActionButton } from "@/components/ui/button";
import { register, signIn, resendVerification } from "../api/auth";
import { hasSeenOnboarding } from "@/lib/onboarding-storage";
import type { AccountRole } from "../types";

/**
 * Sign in, or create an account — ported from
 * lib/features/auth/presentation/pages/auth_page.dart. Shown until a
 * verified account is signed in.
 */
export function AuthForm() {
  const router = useRouter();
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<AccountRole>("general");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  const canSubmit =
    email.trim().includes("@") &&
    password.length >= 8 &&
    (!registering || displayName.trim().length > 0) &&
    !busy;

  function toggleMode() {
    setRegistering((r) => !r);
    setError(null);
    setNotice(null);
  }

  function verificationRedirect() {
    return `${window.location.origin}/email-verified`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const trimmedEmail = email.trim();

    if (registering) {
      const result = await register({
        email: trimmedEmail,
        password,
        displayName: displayName.trim(),
        role,
        emailRedirectTo: verificationRedirect(),
      });
      if (result.error) {
        setBusy(false);
        setError(result.error);
        return;
      }
      setBusy(false);
      setRegistering(false);
      setPendingVerificationEmail(trimmedEmail);
      setNotice(`Check ${trimmedEmail} for a verification link, then sign in.`);
      return;
    }

    const result = await signIn({ email: trimmedEmail, password });
    if (result.error) {
      setBusy(false);
      setError(result.error);
      return;
    }
    if (!hasSeenOnboarding()) {
      router.push("/onboarding?next=/workshop");
      return;
    }
    router.push("/workshop");
  }

  async function handleResend() {
    if (!pendingVerificationEmail) return;
    setBusy(true);
    setError(null);
    const result = await resendVerification({
      email: pendingVerificationEmail,
      emailRedirectTo: verificationRedirect(),
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNotice(`A new link is on its way to ${pendingVerificationEmail}. Open the newest one.`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-8 py-12"
    >
      <h1 className="text-[26px] font-semibold tracking-[-0.2px]">
        {registering ? "Create your account" : "Sign in"}
      </h1>

      <Field label="Email">
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Password (8+ characters)">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete={registering ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-on-background-muted"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </Field>

      {registering && (
        <>
          <Field label="Display name">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="flex gap-2">
            {(["general", "host"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRole(option)}
                className={`flex-1 rounded-full border px-4 py-2 text-[15px] transition-colors ${
                  role === option
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-hairline text-on-background-muted"
                }`}
              >
                {option === "general" ? "General user" : "Host"}
              </button>
            ))}
          </div>
          <p className="-mt-3 text-[13px] text-on-background-muted">
            Hosts create community rooms. Your role is set now and can&apos;t
            be changed later.
          </p>
        </>
      )}

      {error && <p className="text-[15px] text-violation">{error}</p>}
      {notice && <p className="text-[15px] text-on-background-muted">{notice}</p>}

      <PrimaryActionButton type="submit" disabled={!canSubmit}>
        {registering ? "Create account" : "Sign in"}
      </PrimaryActionButton>

      {pendingVerificationEmail && (
        <button
          type="button"
          onClick={handleResend}
          disabled={busy}
          className="text-[15px] font-medium text-accent disabled:opacity-45"
        >
          Send a new verification link
        </button>
      )}

      <button
        type="button"
        onClick={toggleMode}
        disabled={busy}
        className="text-[15px] font-medium text-accent disabled:opacity-45"
      >
        {registering ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-hairline bg-surface px-4 py-3 text-[15px] text-on-background outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] text-on-background-muted">{label}</span>
      {children}
    </label>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.88 5.1A10.6 10.6 0 0 1 12 5c7 0 10.5 7 10.5 7a13.3 13.3 0 0 1-3.17 4.1M6.6 6.6C3.44 8.6 1.5 12 1.5 12s3.5 7 10.5 7a10.4 10.4 0 0 0 3.4-.57" />
    </svg>
  );
}
