import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";

async function cookieHeaders(response: APIResponse): Promise<string> {
  const headers = await response.headersArray();
  return headers
    .filter(({ name }) => name.toLowerCase() === "set-cookie")
    .map(({ value }) => value)
    .join("\n")
    .toLowerCase();
}

async function login(request: APIRequestContext, email = "focus@example.test") {
  return request.post("/api/auth/login", {
    data: { email, password: "test-password" },
  });
}

test("unknown auth actions return a JSON 404", async ({ request }) => {
  const response = await request.post("/api/auth/not-a-supported-action");

  expect(response.status()).toBe(404);
  expect(await response.json()).toEqual({ error: "Unknown auth action." });
});

test("verification without a token redirects to the unverified result", async ({ request }) => {
  const response = await request.get("/api/auth/verify-email", { maxRedirects: 0 });

  expect(response.status()).toBe(307);
  const location = new URL(response.headers().location);
  expect(location.pathname).toBe("/email-verified");
  expect(location.searchParams.get("verified")).toBe("0");
});

test("logout without a refresh cookie clears both session cookies locally", async ({ request }) => {
  const response = await request.post("/api/auth/logout");

  expect(response.status()).toBe(204);
  const cookies = await cookieHeaders(response);
  expect(cookies).toContain("focusguard_access=");
  expect(cookies).toContain("focusguard_refresh=");
  expect(cookies.match(/httponly/g)).toHaveLength(2);
  expect(cookies.match(/max-age=0/g)).toHaveLength(2);
});

test("login hides tokens in JSON, stores HttpOnly cookies, and proxy forwards the access token", async ({ request }) => {
  const loginResponse = await login(request);

  expect(loginResponse.status()).toBe(200);
  expect(await loginResponse.json()).toEqual({
    id: "user-123",
    displayName: "Test Focus User",
    role: "host",
  });
  const loginCookies = await cookieHeaders(loginResponse);
  expect(loginCookies).toContain("focusguard_access=test-access-token");
  expect(loginCookies).toContain("focusguard_refresh=test-refresh-token");
  expect(loginCookies.match(/httponly/g)).toHaveLength(2);

  const meResponse = await request.get("/api/backend/api/auth/me");
  expect(meResponse.status()).toBe(200);
  expect(await meResponse.json()).toEqual({
    userId: "user-123",
    email: "focus@example.test",
    displayName: "Test Focus User",
  });
});

test("backend proxy refreshes an expired access token and retries the request", async ({ request }) => {
  const loginResponse = await login(request, "expired@example.test");
  expect(loginResponse.status()).toBe(200);

  const meResponse = await request.get("/api/backend/api/auth/me");
  expect(meResponse.status()).toBe(200);
  expect(await meResponse.json()).toMatchObject({ userId: "user-123" });

  const refreshedCookies = await cookieHeaders(meResponse);
  expect(refreshedCookies).toContain("focusguard_access=refreshed-access-token");
  expect(refreshedCookies).toContain("focusguard_refresh=rotated-refresh-token");
  expect(refreshedCookies.match(/httponly/g)).toHaveLength(2);
});
