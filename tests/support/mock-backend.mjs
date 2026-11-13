import { createServer } from "node:http";

const port = Number(process.env.MOCK_BACKEND_PORT ?? 3211);

function send(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const requestText = Buffer.concat(chunks).toString("utf8");
  let body = {};
  if (requestText) {
    try {
      body = JSON.parse(requestText);
    } catch {
      return send(response, 400, { error: "Invalid JSON" });
    }
  }

  if (request.method === "GET" && url.pathname === "/actuator/health") {
    return send(response, 200, { status: "UP", groups: ["liveness", "readiness"] });
  }
  if (request.method === "GET" && url.pathname === "/health") {
    response.writeHead(200, { "content-type": "text/plain" });
    return response.end("ok");
  }

  if (request.method === "POST" && url.pathname === "/api/auth/login") {
    const expired = body.email === "expired@example.test";
    return send(response, 200, {
      userId: "user-123",
      displayName: "Test Focus User",
      role: "host",
      accessToken: expired ? "expired-access-token" : "test-access-token",
      expiresInMs: 60_000,
      refreshToken: "test-refresh-token",
      refreshTokenExpiresInMs: 3_600_000,
    });
  }

  if (request.method === "POST" && url.pathname === "/api/auth/refresh") {
    if (body.refreshToken !== "test-refresh-token") {
      return send(response, 401, { error: "Invalid refresh token" });
    }
    return send(response, 200, {
      accessToken: "refreshed-access-token",
      expiresInMs: 60_000,
      refreshToken: "rotated-refresh-token",
      refreshTokenExpiresInMs: 3_600_000,
    });
  }

  if (request.method === "GET" && url.pathname === "/api/auth/me") {
    const authorization = request.headers.authorization;
    if (authorization === "Bearer expired-access-token") {
      return send(response, 401, { error: "Access token expired" });
    }
    if (
      authorization !== "Bearer test-access-token" &&
      authorization !== "Bearer refreshed-access-token"
    ) {
      return send(response, 401, { error: "Unauthorized" });
    }
    return send(response, 200, {
      userId: "user-123",
      email: "focus@example.test",
      displayName: "Test Focus User",
    });
  }

  return send(response, 404, { error: "Mock endpoint not found", path: url.pathname });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mock Spring API listening on http://127.0.0.1:${port}`);
});
