import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "focusguard_access";
export const REFRESH_COOKIE = "focusguard_refresh";

export type TokenResponse = {
  accessToken: string;
  expiresInMs: number;
  refreshToken: string;
  refreshTokenExpiresInMs: number;
};

export function setSessionCookies(response: NextResponse, tokens: TokenResponse) {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(1, Math.floor(tokens.expiresInMs / 1000)),
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(1, Math.floor(tokens.refreshTokenExpiresInMs / 1000)),
  });
}

export function clearSessionCookies(response: NextResponse) {
  const secure = process.env.NODE_ENV === "production";
  const options = { httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge: 0 };
  response.cookies.set(ACCESS_COOKIE, "", options);
  response.cookies.set(REFRESH_COOKIE, "", options);
}
