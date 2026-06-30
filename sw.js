const CACHE_NAME = "dz_portal-cache-v1";

const urlsToCache = [
  "/dz_portal/",
  "/dz_portal/index.html",
  "/dz_portal/assets/css/style.css",
  "/dz_portal/assets/icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
