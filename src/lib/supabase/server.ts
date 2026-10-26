import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";

/**
 * The Supabase client for use in Server Components, Server Actions, and
 * Route Handlers. Reads/writes the session via Next.js's cookie store,
 * which is what keeps a signed-in user's session valid across a server
 * round-trip rather than only in the browser.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, which can't set cookies.
            // Harmless as long as middleware.ts is also refreshing the
            // session, which it is.
          }
        },
      },
    },
  );
}
