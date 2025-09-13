// اسم الكاش
const CACHE_NAME = "dz-portal-cache-v1";

// الملفات التي يتم تخزينها عند التثبيت
const urlsToCache = [
  "/dz_portal/",
  "/dz_portal/index.html",
  "/dz_portal/manifest.webmanifest.json",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://imadtbn.github.io/dz_portal/icons/icon-192.png",
  "https://imadtbn.github.io/dz_portal/icons/icon-512.png"
];

// تثبيت Service Worker وتخزين الملفات
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// تفعيل Service Worker وتنظيف الكاش القديم
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// جلب الملفات من الكاش أولاً ثم من الشبكة
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});