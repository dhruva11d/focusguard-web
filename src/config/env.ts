import "server-only";
import { z } from "zod";

const schema = z.object({
  BACKEND_API_URL: z.string().url().default("http://localhost:8081"),
});

export const env = schema.parse({
  BACKEND_API_URL: process.env.BACKEND_API_URL,
});
