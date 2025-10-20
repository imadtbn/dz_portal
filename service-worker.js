// ✅ DZ Portal Service Worker
const CACHE_NAME = "dzportal-cache-v2";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest.json",
  "./icons/icon.png",
  "./icons/Flag_of_Algeria.svg",
  "./icons/mobilispace.webp",
  "./icons/AADL.png",
  "./icons/djezzy1.webp",
  "./icons/travail.png",
  "./icons/energy.png",
  "./icons/transport.svg",
  "./icons/inteurier.png",
  "./icons/EXTERIEUR.webp",
  "./icons/commerc.png",
  "./icons/DGDN.png",
  "./icons/poste.png",
  "./icons/algerietelecom.png",
  "./icons/education.png",
  "./icons/justis.png",
  "./icons/flexy.png",
  "./icons/ESI.png",
  "./icons/ooredoo1.webp",
  "./icons/formation.png",
  "./icons/anem.png",
  "./icons/sante.jpg"
];

// ✅ التثبيت: تخزين الموارد الثابتة
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ✅ التفعيل: حذف الكاش القديم
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ✅ الجلب: جلب من الكاش أولاً ثم من الشبكة
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // تخزين فقط ملفات نفس النطاق
  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(req));
  } else {
    event.respondWith(networkFirst(req));
  }
});

// ⚙️ إستراتيجية: الكاش أولاً (للموارد المحلية)
async function cacheFirst(req) {
  const cachedResponse = await caches.match(req);
  return cachedResponse || fetch(req);
}

// ⚙️ إستراتيجية: الشبكة أولاً (للموارد الخارجية)
async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(req);
    return cached || Response.error();
  }
}

// ✅ دعم تثبيت التطبيق
self.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  self.deferredPrompt = e;
});

// ✅ تنبيه المستخدم بالتحديث الجديد
self.addEventListener("message", event => {
  if (event.data === "checkForUpdate") {
    self.skipWaiting();
  }
});
