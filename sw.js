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

// تثبيت Service Worker وتخزين الملفات الأساسية
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

// 🔄 الاستراتيجية الجديدة: الشبكة أولاً مع التحديث التلقائي للكاش
self.addEventListener('fetch', (event) => {
  // نقوم بتطبيق الاستراتيجية فقط على طلبات GET الآتية من موقعنا
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    // 1. محاولة جلب النسخة الأحدث من الشبكة أولاً
    fetch(event.request)
      .then((networkResponse) => {
        // إذا كانت الاستجابة ناجحة وسليمة، نحدث الكاش بالنسخة الجديدة فوراً
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // 2. إذا فشلت الشبكة (أوفلاين أو الهواتف ضعيفة التغطية)، نعود للكاش فوراً
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // 3. إذا لم يجد الملف في الكاش وكان الطلب لصفحة HTML، نعرض صفحة الأوفلاين
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }

          // استجابة فارغة لتجنب الانهيار
          return new Response('عذراً، لا يوجد اتصال بالإنترنت والمورد غير مخزن مؤقتاً.', {
            status: 408,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        });
      })
  );
});