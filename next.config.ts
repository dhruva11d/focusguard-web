import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components / Partial Prefetching are still-stabilizing Next 16
  // features that require extra ceremony (Suspense boundaries, explicit
  // "use cache") around ordinary dynamic rendering — e.g. the root route's
  // auth-based redirect() can't prerender under them. Left off in favor of
  // standard dynamic rendering, which handles cookies()/redirect() as-is.
  // The service worker must never be served stale, or a fixed version
  // could take days to reach installed apps.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
  experimental: {
    agentUpgrade: "security",
  },
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
