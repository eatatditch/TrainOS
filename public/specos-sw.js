// SpecOS answers can contain current internal recipes and operational data.
// Keep its service worker installable, but never persist authenticated HTML or
// API responses on shared restaurant devices.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("specos-")).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});
