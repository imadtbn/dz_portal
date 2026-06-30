const CACHE_NAME = "dz-portal-cache-v1";
const OFFLINE_URL = "/dz_portal/index.html";

const urlsToCache = [
  "/dz_portal/",
  "/dz_portal/index.html",
  "/dz_portal/assets/css/style-main.css",
  "/dz_portal/assets/css/style-section-header.css",
  "/dz_portal/assets/js/main.js",
  "/dz_portal/icon-192.png",
  "/dz_portal/icon-512.png",
  "/dz_portal/manifest.json"
];

// تثبيت Service Worker وتخزين الملفات الأساسية في الكاش
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        urlsToCache.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("تعذر تخزين الملف في الكاش:", url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// تفعيل Service Worker وحذف الكاش القديم
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// استراتيجية: الشبكة أولًا للصفحات، الكاش أولًا للموارد الثابتة
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);
    })
  );
});