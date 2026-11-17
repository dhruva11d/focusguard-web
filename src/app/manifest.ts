import type { MetadataRoute } from "next";

/**
 * Makes FocusGuard installable to the home screen (Android: Chrome's
 * "Install app"; iOS: Safari's Share → Add to Home Screen), where it opens
 * full screen like a native app instead of in a browser tab.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "FocusGuard",
    short_name: "FocusGuard",
    description: "Stay accountable in a shared focus session.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f5f8",
    theme_color: "#f4f5f8",
    icons: [
      { src: "/icons/app/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/app/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/app/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
