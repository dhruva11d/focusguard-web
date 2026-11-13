import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import { clearSessionCookies, setSessionCookies, type TokenResponse } from "@/lib/backend/session";

type Context = { params: Promise<{ action: string }> };

async function post(request: NextRequest, { params }: Context) {
  const { action } = await params;
  const allowed = new Set(["login", "register", "logout", "resend-verification", "cancel-deletion"]);
  if (!allowed.has(action)) return NextResponse.json({ error: "Unknown auth action." }, { status: 404 });

  const body = action === "logout"
    ? { refreshToken: request.cookies.get("focusguard_refresh")?.value ?? "" }
    : await request.json().catch(() => ({}));

  if (action === "logout" && !body.refreshToken) {
    const response = new NextResponse(null, { status: 204 });
    clearSessionCookies(response);
    return response;
  }

  let upstream: Response;
  try {
    upstream = await fetch(new URL(`/api/auth/${action}`, env.BACKEND_API_URL), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    if (action === "logout") {
      const response = new NextResponse(null, { status: 204 });
      clearSessionCookies(response);
      return response;
    }
    return NextResponse.json({ error: "Could not reach the FocusGuard backend." }, { status: 502 });
  }

  if (!upstream.ok) {
    const response = new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json", "cache-control": "no-store" },
    });
    if (action === "logout") clearSessionCookies(response);
    return response;
  }

  if (action === "login") {
    const tokens = await upstream.json() as TokenResponse & {
      userId: string; displayName: string; role: string;
    };
    const response = NextResponse.json({
      id: tokens.userId,
      displayName: tokens.displayName,
      role: tokens.role === "host" ? "host" : "general",
    }, { headers: { "cache-control": "no-store" } });
    setSessionCookies(response, tokens);
    return response;
  }

  const response = new NextResponse(upstream.status === 204 ? null : await upstream.text(), {
    status: upstream.status,
    headers: {
      ...(upstream.headers.get("content-type") ? { "content-type": upstream.headers.get("content-type")! } : {}),
      "cache-control": "no-store",
    },
  });
  if (action === "logout") clearSessionCookies(response);
  return response;
}

export const POST = post;

export async function GET(request: NextRequest, { params }: Context) {
  const { action } = await params;
  if (action !== "verify-email") return NextResponse.json({ error: "Unknown auth action." }, { status: 404 });

  const token = request.nextUrl.searchParams.get("token");
  let verified = false;
  if (token) {
    try {
      const url = new URL("/api/auth/verify-email", env.BACKEND_API_URL);
      url.searchParams.set("token", token);
      const upstream = await fetch(url, { cache: "no-store" });
      verified = upstream.ok;
    } catch {
      verified = false;
    }
  }
  return NextResponse.redirect(new URL(`/email-verified?verified=${verified ? "1" : "0"}`, request.url));
}
