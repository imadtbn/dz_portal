// اسم الكاش
const CACHE_NAME = "dz-portal-cache-v3";

// الملفات الأساسية (تتضمن صفحة offline)
const OFFLINE_URL = "/dz_portal/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([OFFLINE_URL]);
    })
  );
  self.skipWaiting();
});

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

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // تخزين الملفات التي يتم جلبها بنجاح
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic"
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // إذا الشبكة فشلت نرجع من الكاش
        return caches.match(event.request).then((cachedResponse) => {
          // إذا لم نجد أي كاش نرجع صفحة offline
          return cachedResponse || caches.match(OFFLINE_URL);
        });
      })
  );
});