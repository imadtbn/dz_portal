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

// استراتيجية: الشبكة أولًا للصفحات، الكاش أولًا للموارد الثابتة مع التخزين الديناميكي
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. إذا كان الملف موجوداً في الكاش، قم بإرجاعه فوراً
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. إذا لم يكن في الكاش، حاول جلبه من الشبكة
      return fetch(event.request).then((networkResponse) => {
        // التأكد من أن الاستجابة صالحة قبل تخزينها في الكاش (فقط لملفات الموقع نفسه لتجنب مشاكل CORS)
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic" &&
          event.request.url.startsWith(self.location.origin)
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch((err) => {
              console.warn("تعذر تخزين الطلب في الكاش:", event.request.url, err);
            });
          });
        }
        return networkResponse;
      }).catch(() => {
        // 3. في حالة انقطاع الشبكة تماماً، قم بإرجاع استجابة فارغة لتجنب خطأ الـ TypeError
        return new Response('Network error happened', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' },
        });
      });
    })
  );
});
