import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  setSessionCookies,
  type TokenResponse,
} from "@/lib/backend/session";

type Context = { params: Promise<{ path: string[] }> };
type RefreshResult = { tokens: TokenResponse | null; invalid: boolean };

async function refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
  try {
    const response = await fetch(new URL("/api/auth/refresh", env.BACKEND_API_URL), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (response.ok) return { tokens: await response.json() as TokenResponse, invalid: false };
    return { tokens: null, invalid: response.status === 400 || response.status === 401 };
  } catch {
    return { tokens: null, invalid: false };
  }
}

async function forward(request: NextRequest, { params }: Context) {
  const { path } = await params;
  const backendPath = `/${path.map((part) => encodeURIComponent(part)).join("/")}`;
  const url = new URL(backendPath, env.BACKEND_API_URL);
  url.search = request.nextUrl.search;
  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : await request.arrayBuffer();
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  const send = (token?: string) => {
    const headers = new Headers();
    for (const name of ["accept", "content-type", "last-event-id"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    if (token) headers.set("authorization", `Bearer ${token}`);
    return fetch(url, { method: request.method, headers, body, cache: "no-store", signal: request.signal });
  };

  let upstream = await send(accessToken);
  let refreshed: TokenResponse | null = null;
  let invalidRefresh = false;
  if (upstream.status === 401 && refreshToken) {
    const result = await refreshAccessToken(refreshToken);
    refreshed = result.tokens;
    invalidRefresh = result.invalid;
    if (refreshed) upstream = await send(refreshed.accessToken);
  }

  const headers = new Headers();
  for (const name of ["content-type", "cache-control", "etag", "last-modified", "retry-after"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (upstream.headers.get("content-type")?.includes("text/event-stream")) {
    headers.set("cache-control", "no-cache, no-transform");
    headers.set("x-accel-buffering", "no");
  }
  const response = new NextResponse(
    upstream.status === 204 || upstream.status === 304 ? null : upstream.body,
    { status: upstream.status, headers },
  );
  if (refreshed) setSessionCookies(response, refreshed);
  else if (invalidRefresh || (request.method === "DELETE" && backendPath === "/api/account" && upstream.ok)) {
    clearSessionCookies(response);
  }
  return response;
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
