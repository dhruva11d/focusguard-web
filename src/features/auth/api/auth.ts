import type { Account, AccountRole } from "../types";

export type AuthResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

async function authPost<T>(action: string, body: unknown): Promise<AuthResult<T>> {
  try {
    const response = await fetch(`/api/auth/${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify(body),
    });
    if (response.status === 204) return { data: undefined as T };
    const payload = await response.json().catch(() => ({})) as { error?: string; message?: string } & T;
    if (!response.ok) return { error: payload.error ?? payload.message ?? "The request could not be completed." };
    return { data: payload };
  } catch {
    return { error: "Could not reach the FocusGuard backend." };
  }
}

export async function getCurrentAccount(): Promise<Account | null> {
  try {
    const response = await fetch("/api/backend/api/auth/me", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) return null;
    const user = await response.json() as { userId: string; displayName: string; role: string };
    return { id: user.userId, displayName: user.displayName, role: user.role === "host" ? "host" : "general" };
  } catch {
    return null;
  }
}

export async function register(params: {
  email: string;
  password: string;
  displayName: string;
  role: AccountRole;
}): Promise<AuthResult<void>> {
  return authPost<void>("register", params);
}

export async function signIn(params: { email: string; password: string }): Promise<AuthResult<Account>> {
  return authPost<Account>("login", params);
}

export async function signOut(): Promise<void> {
  await authPost<void>("logout", {});
}

export async function deleteAccount(): Promise<AuthResult<void>> {
  try {
    const { backendFetch } = await import("@/lib/backend/client");
    await backendFetch<void>("/api/account", { method: "DELETE" });
    return { data: undefined };
  } catch (error) {
    return { error: error instanceof Error ? `Could not delete your account: ${error.message}` : "Could not delete your account." };
  }
}

export async function resendVerification(params: { email: string }): Promise<AuthResult<void>> {
  return authPost<void>("resend-verification", params);
}
