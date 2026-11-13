export class BackendApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "BackendApiError";
  }
}

function messageFromBody(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null) {
    const record = body as Record<string, unknown>;
    if (typeof record.error === "string") return record.error;
    if (typeof record.message === "string") return record.message;
  }
  return fallback;
}

/** Browser requests stay same-origin; the Next route attaches the HttpOnly JWT. */
export async function backendFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(`/api/backend${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.status === 204) return null as T;

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    throw new BackendApiError(
      messageFromBody(body, `Backend request failed (${response.status}).`),
      response.status,
    );
  }
  return body as T;
}

export function jsonBody(value: unknown): string {
  return JSON.stringify(value);
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
