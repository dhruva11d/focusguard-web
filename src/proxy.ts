import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  setSessionCookies,
  type TokenResponse,
} from "@/lib/backend/session";

function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function rotate(refreshToken: string): Promise<{ tokens?: TokenResponse; invalid: boolean }> {
  try {
    const response = await fetch(new URL("/api/auth/refresh", env.BACKEND_API_URL), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (response.ok) return { tokens: await response.json() as TokenResponse, invalid: false };
    return { invalid: response.status === 400 || response.status === 401 };
  } catch {
    return { invalid: false };
  }
}

function isProtected(pathname: string) {
  return pathname === "/" || ["/onboarding", "/workshop", "/personal"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  if (!isProtected(request.nextUrl.pathname)) return NextResponse.next();

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const expiresAt = access ? tokenExpiresAt(access) : null;
  const shouldRefresh = !access || expiresAt === null || expiresAt < Date.now() + 60_000;

  if (shouldRefresh && refresh) {
    const result = await rotate(refresh);
    if (result.tokens) {
      request.cookies.set(ACCESS_COOKIE, result.tokens.accessToken);
      request.cookies.set(REFRESH_COOKIE, result.tokens.refreshToken);
      const response = NextResponse.next({ request });
      setSessionCookies(response, result.tokens);
      return response;
    }
    if (!result.invalid) return NextResponse.next();
  } else if (!shouldRefresh) {
    return NextResponse.next();
  }

  const response = NextResponse.redirect(new URL("/sign-in", request.url));
  clearSessionCookies(response);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
