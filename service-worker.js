// ✅ DZ Portal Service Worker (نسخة محسّنة ومستقرة)
const CACHE_NAME = "dz_portal";
const STATIC_ASSETS = [
    "./",
    "./index.html",
    "./manifest.webmanifest.json",
    "./assets/css/style-main.css",
    "./assets/js/main.js",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
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

// ✅ الجلب: كاش أولاً للموارد المحلية، شبكة أولاً للباقي
self.addEventListener("fetch", event => {
    const req = event.request;
    const url = new URL(req.url);

    if (req.method !== "GET" || url.protocol.startsWith("chrome-extension")) return;

    if (url.origin === location.origin) {
        event.respondWith(cacheFirst(req));
    } else {
        event.respondWith(networkFirst(req));
    }
});

async function cacheFirst(req) {
    const cached = await caches.match(req);
    return cached || fetch(req);
}

async function networkFirst(req) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const fresh = await fetch(req);
        if (req.url.startsWith("http")) cache.put(req, fresh.clone());
        return fresh;
    } catch {
        const cached = await cache.match(req);
        return cached || Response.error();
    }
}

// 🔄 تحديث فوري عند توفر نسخة جديدة
self.addEventListener("message", event => {
    if (event.data === "checkForUpdate") self.skipWaiting();
});
