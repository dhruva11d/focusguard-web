import "server-only";

import { cookies } from "next/headers";
import { env } from "@/config/env";
import type { Account } from "@/features/auth/types";
import { ACCESS_COOKIE } from "./session";

export async function serverBackendGet<T>(path: string): Promise<T | null> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  const response = await fetch(new URL(path, env.BACKEND_API_URL), {
    headers: { authorization: `Bearer ${token}`, accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 204 || response.status === 401 || response.status === 404) return null;
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string; message?: string } | null;
    throw new Error(body?.error ?? body?.message ?? `Backend request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

type BackendAccount = { userId: string; email: string; displayName: string; role: string };

export async function getCurrentAccountServer(): Promise<Account | null> {
  try {
    const user = await serverBackendGet<BackendAccount>("/api/auth/me");
    if (!user) return null;
    return {
      id: user.userId,
      displayName: user.displayName,
      role: user.role === "host" ? "host" : "general",
    };
  } catch {
    return null;
  }
}
