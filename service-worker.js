

const CACHE_NAME = "dz-portal-cache-v1";
const urlsToCache = [
  "/dz_portal/",
  "/dz_portal/index.html",
  "/dz_portal/icons/icon-192.png",
  "/dz_portal/icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});




self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("dz-cache-v1").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./style.css",
        "./manifest.webmanifest.json",
        "./icons/icon-192.png",
        "./icons/icon-512.png"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
