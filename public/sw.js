// Authenticated pages are intentionally never cached. TrainOS contains private
// employee progress, quiz and operational data; an offline HTML fallback could
// show one employee another employee's last session on a shared device.
const CACHE_NAME = "trainos-static-v3";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith("ditch-training-") || key.startsWith("trainos-static-"))
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API requests and navigations remain network-only. Returning without
  // respondWith lets the browser perform its normal request and auth flow.
  if (url.pathname.startsWith("/api/") || request.mode === "navigate") return;

  // Static assets — stale-while-revalidate
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        const network = fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });

        return cached || network;
      }),
    );
  }
});
