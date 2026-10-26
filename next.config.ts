import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components / Partial Prefetching are still-stabilizing Next 16
  // features that require extra ceremony (Suspense boundaries, explicit
  // "use cache") around ordinary dynamic rendering — e.g. the root route's
  // auth-based redirect() can't prerender under them. Left off in favor of
  // standard dynamic rendering, which handles cookies()/redirect() as-is.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
