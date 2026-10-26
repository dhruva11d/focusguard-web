import { z } from "zod";

/**
 * Validated environment config, read once at import time — bulletproof-react's
 * `src/config` convention. Fails loudly at startup if a var is missing or
 * malformed, instead of letting `undefined` leak into a Supabase client call
 * somewhere deep in the app.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
