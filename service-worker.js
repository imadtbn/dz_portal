// ✅ DZ Portal Service Worker (نسخة محسّنة ومستقرة)
const CACHE_NAME = "dzportal-cache-v5";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest.json",
  // جميع الأيقونات الحالية
  "./icons/icon.png",
  "./icons/Flag_of_Algeria.svg",
  "./icons/AADL.png",
  "./icons/ABC.png",
  "./icons/AGB.jpg",
  "./icons/ALLO CHORTTA.webp",
  "./icons/BADR.jpg",
  "./icons/BEA.png",
  "./icons/BNA.jpg",
  "./icons/BNH.jpg",
  "./icons/CASNOS.png",
  "./icons/CFN.png",
  "./icons/CGN.jpg",
  "./icons/CNAR.png",
  "./icons/COMMERC.png",
  "./icons/Cnas.png",
  "./icons/DGDN.png",
  "./icons/DGF.png",
  "./icons/ESI.png",
  "./icons/EXTERIEUR.webp",
  "./icons/Etusa Mob.webp",
  "./icons/FERRIES.png",
  "./icons/HSBC.png",
  "./icons/Instagram.png",
  "./icons/Khadamaty.png",
  "./icons/Logomediateur.png",
  "./icons/Qrcodepage.png",
  "./icons/TASSILI.png",
  "./icons/TAWASSEL.webp",
  "./icons/TOFFOLA.png",
  "./icons/TRUST.png",
  "./icons/aapi.png",
  "./icons/ade.png",
  "./icons/air-algerie.png",
  "./icons/albaraka.jpg",
  "./icons/algerietelecom.png",
  "./icons/alliance.png",
  "./icons/amana.jpg",
  "./icons/anem.png",
  "./icons/apoce.png",
  "./icons/arabe-bank.jpg",
  "./icons/arabe-bank.png",
  "./icons/axa.png",
  "./icons/bdl.png",
  "./icons/bea.png",
  "./icons/caar.jpg",
  "./icons/caarama.png",
  "./icons/carama.png",
  "./icons/cardif.png",
  "./icons/citibank.webp",
  "./icons/cnep.png",
  "./icons/commerc.png",
  "./icons/cpa.jpg",
  "./icons/dgpc.svg",
  "./icons/djezzy.png",
  "./icons/djezzy1.webp",
  "./icons/douane.png",
  "./icons/econom.png",
  "./icons/education.png",
  "./icons/energy.png",
  "./icons/flexy.png",
  "./icons/formation.png",
  "./icons/fransabank.jpg",
  "./icons/gam.png",
  "./icons/gig.jpg",
  "./icons/google-play-logo.png",
  "./icons/gosp.jpg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/ina-elections.png",
  "./icons/inpux.jpg",
  "./icons/inteurier.png",
  "./icons/justis.png",
  "./icons/macirvie.png",
  "./icons/mahatati.webp",
  "./icons/mobilis.png",
  "./icons/mobilispace.webp",
  "./icons/naftal.webp",
  "./icons/natixis.png",
  "./icons/onpo.png",
  "./icons/ooredoo.png",
  "./icons/ooredoo1.webp",
  "./icons/opgi.png",
  "./icons/poste.png",
  "./icons/ppgn.jpg",
  "./icons/saa.svg",
  "./icons/sante.jpg",
  "./icons/seaal.webp",
  "./icons/sntf.png",
  "./icons/enpi.png",
  "./icons/icons/flightradar24.jpg",
  "./icons/societe_general_algerie.webp",
  "./icons/sonelgaz.png",
  "./icons/tansport.svg",
  "./icons/tariki.jpg",
  "./icons/telegram.png",
  "./icons/transport.svg",
  "./icons/travail.png"
    "./icons/travail.png",
];

// ✅ التثبيت: تخزين الموارد الثابتة
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)));
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

  // تجاهل الطلبات غير GET أو امتدادات Chrome
  if (req.method !== "GET" || url.protocol.startsWith("chrome-extension")) return;

  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(req));
  } else {
    event.respondWith(networkFirst(req));
  }
});

// ⚙️ الكاش أولاً
async function cacheFirst(req) {
  const cached = await caches.match(req);
  return cached || fetch(req);
}

// ⚙️ الشبكة أولاً
async function networkFirst(req) {
  if (req.method !== "GET") return fetch(req);

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

// ✅ دعم تثبيت التطبيق (PWA)
self.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  self.deferredPrompt = e;
});

// 🔄 تحديث فوري عند توفر نسخة جديدة
self.addEventListener("message", event => {
  if (event.data === "checkForUpdate") self.skipWaiting();
});
