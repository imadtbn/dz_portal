// ✅ DZ Portal Service Worker (نسخة موسعة)
const CACHE_NAME = "dzportal-cache-v3";

// 🗂️ تخزين الموارد الأساسية + جميع الأيقونات
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest.json",
  "./icons/icon.png",
  "./icons/Flag_of_Algeria.svg"
];

// عند التثبيت: فحص مجلد الأيقونات وتخزين كل ملف فيه تلقائيا
self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // إضافة الموارد الأساسية
      await cache.addAll(CORE_ASSETS);

      // جلب قائمة الأيقونات ديناميكياً (كل ما في مجلد icons/)
      try {
        const icons = await fetch("./icons/");
        const text = await icons.text();
        const matches = [...text.matchAll(/href="([^"]+\.(png|jpg|jpeg|svg|webp))"/g)].map(m => "./icons/" + m[1]);
        if (matches.length) {
          await cache.addAll(matches);
        }
      } catch (err) {
        console.warn("⚠️ لم يتم جلب جميع الأيقونات:", err);
      }
    })()
  );
  self.skipWaiting();
});

// عند التفعيل: حذف الكاش القديم
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// عند الجلب: استخدام الكاش أولاً للموارد المحلية
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(req));
  } else {
    event.respondWith(networkFirst(req));
  }
});

// 📦 الكاش أولاً (للموارد المحلية)
async function cacheFirst(req) {
  const cached = await caches.match(req);
  return cached || fetch(req);
}

// 🌐 الشبكة أولاً (للموارد الخارجية)
async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(req);
    return cached || Response.error();
  }
}

// ✅ دعم تثبيت التطبيق (PWA)
self.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  self.deferredPrompt = e;
});

// 🔄 التحديث الفوري عند توفر نسخة جديدة
self.addEventListener("message", event => {
  if (event.data === "checkForUpdate") {
    self.skipWaiting();
  }
});
