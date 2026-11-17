/*
 * FocusGuard service worker — offline fallback only.
 *
 * Page loads always go to the network first, so signed-in pages, rooms and
 * sessions are never served stale. Only when a page load fails (no
 * connection) does this serve the cached "You're offline" screen instead
 * of the browser's error page. Nothing else is cached or intercepted.
 *
 * Bump CACHE when offline.html or its assets change.
 */
const CACHE = "focusguard-offline-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/app/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // cache: "reload" skips the HTTP cache so a fresh copy is stored.
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(OFFLINE_URL);
        return cached ?? Response.error();
      }),
    );
    return;
  }

  // The offline page's own icon, served from cache when the network is down.
  if (request.method === "GET" && PRECACHE.includes(new URL(request.url).pathname)) {
    event.respondWith(fetch(request).catch(() => caches.match(request).then((r) => r ?? Response.error())));
  }
});
