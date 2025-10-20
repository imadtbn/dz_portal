const CACHE_NAME = "dz-portal-v1";
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./style.css",
  "./script.js"
];

// عند التثبيت: تخزين الملفات مؤقتًا
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('dz-portal-v1').then(cache => {
      return cache.addAll([
        '/dz_portal/',
        '/dz_portal/index.html',
        '/dz_portal/icons/icon.png',
        '/dz_portal/manifest.webmanifest.json'
      ]);
    })
  );
});


// عند الجلب: الرد من الكاش أو من الشبكة
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// عند التحديث: حذف النسخ القديمة
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

