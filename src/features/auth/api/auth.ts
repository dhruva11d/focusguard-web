import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Account, AccountRole } from "../types";

export type AuthResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

/**
 * A plain-language reason for each error code Supabase returns, followed by
 * the raw code and message so the exact cause is still visible — ported
 * 1:1 from SupabaseAuthRepository._authFailure in the Flutter app, so the
 * two apps show identical error text for identical failures.
 */
function mapAuthError(error: AuthError): string {
  const reason = (() => {
    switch (error.code) {
      case "invalid_credentials":
        return "Email or password is incorrect.";
      case "email_not_confirmed":
        return 'This email is not verified yet. Use "Send a new verification link".';
      case "user_already_exists":
        return "An account with this email already exists. Sign in instead.";
      case "over_email_send_rate_limit":
      case "email_rate_limit_exceeded":
        return "Too many emails were sent. Wait a few minutes, then try again.";
      case "over_request_rate_limit":
        return "Too many attempts. Wait a minute, then try again.";
      case "weak_password":
        return "Password is too weak. Use at least 8 characters.";
      case "user_banned":
        return "This account has been deleted.";
      default:
        return "Sign-in failed.";
    }
  })();
  return `${reason} (${error.code ?? "no code"}: ${error.message})`;
}

async function loadAccount(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<Account> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return {
    id: data.id,
    displayName: data.display_name,
    role: data.role === "host" ? "host" : "general",
  };
}

/** The signed-in, email-verified account, or `null` if nobody is signed in. */
export async function getCurrentAccount(): Promise<Account | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) return null;
  return loadAccount(supabase, user.id);
}

/**
 * Creates the account and sends a verification email. The profile row
 * (display name and role) is created server-side from these values, by
 * the same `handle_new_user` trigger the Flutter app's sign-up uses.
 */
export async function register(params: {
  email: string;
  password: string;
  displayName: string;
  role: AccountRole;
  emailRedirectTo: string;
}): Promise<AuthResult<void>> {
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: { display_name: params.displayName, role: params.role },
      emailRedirectTo: params.emailRedirectTo,
    },
  });
  if (error) return { error: mapAuthError(error) };
  return { data: undefined };
}

/** Fails with a message asking the user to verify their email if unconfirmed. */
export async function signIn(params: {
  email: string;
  password: string;
}): Promise<AuthResult<Account>> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword(params);
  if (error) return { error: mapAuthError(error) };

  const user = data.user;
  if (!user.email_confirmed_at) {
    await supabase.auth.signOut();
    return {
      error: "Please verify your email, then sign in again. (email_not_confirmed: unconfirmed)",
    };
  }

  const account = await loadAccount(supabase, user.id);
  return { data: account };
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

/**
 * Calls the same `delete-account` Edge Function the Flutter app uses
 * (SupabaseAuthRepository.deleteAccount) — the account is disabled
 * immediately and purged after a 6-hour hold, shared backend logic, not
 * duplicated here. No device-token/offline-outbox cleanup step: the web
 * app has neither.
 */
export async function deleteAccount(): Promise<AuthResult<void>> {
  const supabase = createClient();
  const { error, data } = await supabase.functions.invoke("delete-account");
  if (error) {
    return { error: `Could not delete your account: ${error.message}` };
  }
  if (data?.error) {
    return { error: `Could not delete your account: ${data.error}` };
  }
  await supabase.auth.signOut();
  return { data: undefined };
}

/** Sends a fresh verification email for an account that isn't confirmed yet. */
export async function resendVerification(params: {
  email: string;
  emailRedirectTo: string;
}): Promise<AuthResult<void>> {
  const supabase = createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: params.email,
    options: { emailRedirectTo: params.emailRedirectTo },
  });
  if (error) return { error: mapAuthError(error) };
  return { data: undefined };
}
