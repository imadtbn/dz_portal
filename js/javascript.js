
(function () {
    // انتظر DOM ثم نفّذ
    document.addEventListener('DOMContentLoaded', () => {
        /* -------------------- عناصر أساسية -------------------- */
        const body = document.body;
        const installButton = document.getElementById('install-button');
        const searchInput = document.getElementById('searchInput');
        const darkBtn = document.getElementById('darkModeToggle');
        const langBtn = document.getElementById('googleLangToggle');

        /* -------------------- 1) إدارة فتح/طي الأقسام (H2/H3) -------------------- */
        (function initSections() {
            const headers = Array.from(document.querySelectorAll('section h2, section h3'));

            const closeEl = el => { if (!el) return; el.classList.remove('show'); el.style.display = 'none'; };
            const openEl = el => { if (!el) return; el.classList.add('show'); el.style.display = 'block'; };

            headers.forEach((header, index) => {
                // اجلب العنصر التالي (UL أو DIV) أو ابحث داخل نفس العنصر عند استخدام onclick يدوي
                let nextElement = header.nextElementSibling;
                // إذا كان nextElement نصيًا أو عنصرًا غير مناسب ابحث عن ul أو div لاحق
                if (!nextElement || !/^(UL|DIV)$/i.test(nextElement.tagName)) {
                    nextElement = header.parentElement.querySelector('#' + header.getAttribute('data-target')) || header.nextElementSibling;
                }
                if (!nextElement || !/^(UL|DIV)$/i.test(nextElement.tagName)) {
                    // لا نتعامل مع هذا الهيدر
                    return;
                }

                // ids آمنة
                header.id = header.id || 'header-' + index;
                nextElement.id = nextElement.id || 'content-' + index;

                const toggle = (ev) => {
                    // منع التنفيذ إذا كانت النقرات على روابط داخل الهيدر
                    if (ev && ev.target && ev.target.tagName === 'A') return;

                    const isVisible = nextElement.classList.contains('show');
                    const isH2 = header.tagName === 'H2';
                    const section = header.closest('section');

                    if (isH2) {
                        // أغلق كل H2s الأخرى
                        document.querySelectorAll('section h2').forEach(h => {
                            if (h !== header) {
                                h.classList.remove('open');
                                const sibling = h.nextElementSibling;
                                if (sibling) closeEl(sibling);
                            }
                        });
                    } else {
                        // H3: أغلق الأخوات داخل نفس الحاوية
                        const container = header.parentElement;
                        if (container) {
                            container.querySelectorAll('h3').forEach(h3 => {
                                if (h3 !== header) {
                                    h3.classList.remove('open');
                                    const s = h3.nextElementSibling;
                                    if (s) closeEl(s);
                                }
                            });
                        }
                        // تأكد أن H2 الأصلية مفتوحة
                        const parentH2 = section ? section.querySelector('h2') : null;
                        const parentContent = parentH2 ? parentH2.nextElementSibling : null;
                        if (parentContent && !parentContent.classList.contains('show')) {
                            document.querySelectorAll('section h2').forEach(h => {
                                if (h !== parentH2) {
                                    h.classList.remove('open');
                                    const s = h.nextElementSibling;
                                    if (s) closeEl(s);
                                }
                            });
                            parentH2 && parentH2.classList.add('open');
                            openEl(parentContent);
                        }
                    }

                    if (!isVisible) {
                        openEl(nextElement);
                        header.classList.add('open');
                        // تحديث أيقونة
                        const icon = header.querySelector('.toggle-icon');
                        if (icon) icon.textContent = '▼';
                    } else {
                        closeEl(nextElement);
                        header.classList.remove('open');
                        const icon = header.querySelector('.toggle-icon');
                        if (icon) icon.textContent = '▶';
                    }
                };

                // دعم كل من النقر البرمجي (onclick في HTML) والاستماع الديناميكي
                header.addEventListener('click', toggle);

                // عداد العناصر داخل الهيدر
                const countSpan = header.querySelector('.count');
                if (countSpan) {
                    if (nextElement.tagName === 'UL') {
                        const items = nextElement.querySelectorAll('li');
                        countSpan.textContent = ` (${items.length} خدمة)`;
                    } else if (nextElement.tagName === 'DIV') {
                        const totalItems = nextElement.querySelectorAll('ul li').length;
                        countSpan.textContent = ` (${totalItems} خدمة)`;
                    }
                }
            });
        })();

        /* -------------------- 2) البحث داخل الأقسام -------------------- */
        (function initSearch() {
            if (!searchInput) return;
            searchInput.addEventListener('input', function () {
                const q = this.value.toLowerCase().trim();
                const sections = document.querySelectorAll('section');

                sections.forEach(section => {
                    const uls = section.querySelectorAll('ul');
                    let sectionHasMatch = false;

                    // افحص كل القوائم داخل القسم
                    uls.forEach(ul => {
                        const items = Array.from(ul.querySelectorAll('li'));
                        let ulHasMatch = false;
                        items.forEach(li => {
                            const text = li.innerText.toLowerCase();
                            const match = q === '' ? true : text.includes(q);
                            li.style.display = match ? '' : 'none';
                            if (match) ulHasMatch = true;
                        });
                        ul.style.display = ulHasMatch ? 'block' : 'none';
                        if (ulHasMatch) sectionHasMatch = true;
                        // اضف صنف show لو لزم
                        ul.classList.toggle('show', ulHasMatch);
                    });

                    // إذا لم يحتوي القسم على قوائم، افحص نص القسم كاملاً
                    if (uls.length === 0) {
                        const text = section.innerText.toLowerCase();
                        sectionHasMatch = q === '' ? true : text.includes(q);
                    }

                    section.style.display = sectionHasMatch || q === '' ? '' : 'none';
                });
            });
        })();

        /* -------------------- 3) الوضع الليلي -------------------- */
        (function initDarkMode() {
            if (!darkBtn) return;
            const enabled = localStorage.getItem('darkMode') === 'true';
            if (enabled) {
                body.classList.add('dark-mode');
                darkBtn.innerHTML = '<i class="fas fa-sun"></i>';
            } else {
                darkBtn.innerHTML = '<i class="fas fa-moon"></i>';
            }

            darkBtn.addEventListener('click', () => {
                const now = body.classList.toggle('dark-mode');
                localStorage.setItem('darkMode', now);
                darkBtn.innerHTML = now ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            });
        })();

        /* -------------------- 4) ترجمة الصفحة (فتح Google Translate) -------------------- */
        (function initTranslate() {
            if (!langBtn) return;
            const langs = ['ar', 'fr', 'en'];
            let current = 0;
            langBtn.textContent = langs[current].toUpperCase();
            langBtn.addEventListener('click', () => {
                current = (current + 1) % langs.length;
                const lang = langs[current];
                langBtn.textContent = lang.toUpperCase();
                const url = window.location.href;
                const googleUrl = `https://translate.google.com/translate?hl=${lang}&sl=auto&tl=${lang}&u=${encodeURIComponent(url)}`;
                window.open(googleUrl, '_blank');
            });
        })();

        /* -------------------- 5) زر تثبيت PWA -------------------- */
        (function initPWA() {
            if (!installButton) return;
            let deferredPrompt = null;

            const setInstalledState = () => {
                installButton.innerHTML = '<i class="fas fa-check"></i> مُثبت';
                installButton.disabled = true;
                installButton.classList.add('installed');
                installButton.style.opacity = '0.8';
                installButton.style.cursor = 'default';
            };
            const setInstallAvailable = () => {
                installButton.innerHTML = '<i class="fas fa-download"></i> تثبيت التطبيق';
                installButton.disabled = false;
                installButton.classList.remove('installed');
                installButton.style.opacity = '1';
                installButton.style.cursor = 'pointer';
                installButton.style.display = 'inline-block';
            };

            // افتراضيًا أخفِ الزر إلى أن يبدو beforeinstallprompt
            installButton.style.display = 'none';
            setInstallAvailable();

            if (navigator.getInstalledRelatedApps) {
                navigator.getInstalledRelatedApps()
                    .then(apps => { if (apps && apps.length) setInstalledState(); })
                    .catch(() => { });
            }

            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                setInstallAvailable();
                // استعرض الحوار عند النقر مرة واحدة
                installButton.addEventListener('click', async function handler() {
                    if (!deferredPrompt) return;
                    try {
                        await deferredPrompt.prompt();
                        const choice = await deferredPrompt.userChoice;
                        if (choice && choice.outcome === 'accepted') setInstalledState();
                        else setInstallAvailable();
                    } catch (err) {
                        console.error('install prompt error', err);
                        setInstallAvailable();
                    } finally {
                        deferredPrompt = null;
                    }
                }, { once: true });
            });

            window.addEventListener('appinstalled', () => setInstalledState());
        })();

        /* -------------------- 6) تسجيل Service Worker موحّد وآمن -------------------- */
        (function registerSW() {
            if (!('serviceWorker' in navigator)) return;
            // استخدم مسار نسبي متوافق مع استضافة GitHub Pages أو المجلد الجذري
            const swPathCandidates = ['./service-worker.js', '/dz_portal/service-worker.js', '/service-worker.js'];
            const tryRegister = (pathIndex = 0) => {
                if (pathIndex >= swPathCandidates.length) return;
                navigator.serviceWorker.register(swPathCandidates[pathIndex])
                    .then(reg => console.log('SW registered at', reg.scope))
                    .catch(err => {
                        console.warn('SW register failed for', swPathCandidates[pathIndex], err);
                        // جرّب المسار التالي
                        tryRegister(pathIndex + 1);
                    });
            };
            tryRegister(0);
        })();

        /* -------------------- 7) زر الرجوع للأعلى -------------------- */
        (function initScrollTop() {

            const scrollBtn = document.getElementById('scrollTopBtn');
            if (!scrollBtn) return;

            window.addEventListener('scroll', () => {
                if (document.documentElement.scrollTop > 300) {
                    scrollBtn.style.display = 'block';
                } else {
                    scrollBtn.style.display = 'none';
                }
            });

            window.scrollToTop = function () {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
        })();
        /* -------------------- تحذيرات سريعة في الكونسول إن عناصر مفقودة -------------------- */
        if (!searchInput) console.warn('عنصر #searchInput غير موجود. تفعيل البحث معطل.');
        if (!darkBtn) console.warn('عنصر #darkModeToggle غير موجود. الوضع الليلي معطل.');
        if (!langBtn) console.warn('عنصر #googleLangToggle غير موجود. زر الترجمة معطل.');
        if (!installButton) console.warn('عنصر #install-button غير موجود. زر تثبيت معطل.');

    }); // end DOMContentLoaded
})(); // end IIFE

/* ===== الإشعارات عبر 8 Google Script ===== */
document.addEventListener("DOMContentLoaded", function () {
    const box = document.getElementById("notificationBox");
    const apiUrl = "https://script.google.com/macros/s/AKfycbwap_0FcirukQreMhIVn1PS0kSEzoxPFrNKn1u94yR7z1l-ndxADsFNlx50CPePvs6j/exec";

    let lastMsg = "";
    let lastFetch = 0;
    const FETCH_INTERVAL = 60000; // 60 ثانية

    async function checkUpdates() {
        const now = Date.now();
        if (now - lastFetch < FETCH_INTERVAL / 2) return;
        lastFetch = now;

        try {
            const res = await fetch(apiUrl + "?t=" + now);
            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();

            if (data && data.message && data.message !== lastMsg) {
                lastMsg = data.message;
                showNotification(data.message);
            }
        } catch (err) {
            console.warn("⚠️ فشل جلب الإشعار:", err.message);
        }
    }

    function showNotification(msg) {
        if (!box) {
            console.warn("⚠️ لا يوجد عنصر #notificationBox لعرض الإشعار");
            return;
        }
        box.textContent = "🔔 " + msg;
        box.style.display = "block";
        box.style.background = "#fffae5";
        box.style.color = "#333";
        box.style.padding = "10px";
        box.style.border = "1px solid #ccc";
        box.style.borderRadius = "8px";
        box.style.margin = "15px auto";
        box.style.width = "fit-content";
        box.style.transition = "opacity 0.4s";

        // إخفاء بعد 6 ثواني تدريجياً
        setTimeout(() => {
            box.style.opacity = "0";
            setTimeout(() => {
                box.style.display = "none";
                box.style.opacity = "1";
            }, 500);
        }, 6000);
    }

    // تشغيل أولي ثم تكرار دوري
    checkUpdates();
    setInterval(checkUpdates, FETCH_INTERVAL);
});

/* ===== العداد 9 الوهمي ===== */
document.addEventListener("DOMContentLoaded", function () {
    // عناصر العداد
    const dailyEl = document.getElementById('daily-visits');
    const totalEl = document.getElementById('total-visits');
    if (!dailyEl || !totalEl) return; // تأكد من وجودها

    // أرقام أولية
    let daily = Math.floor(Math.random() * 10000 + 1000);   // زيارات اليوم
    let total = 3000000 + Math.floor(Math.random() * 50000); // إجمالي الزيارات

    // تحديث العرض
    function updateCounter() {
        dailyEl.textContent = daily.toLocaleString('en-US');
        totalEl.textContent = total.toLocaleString('en-US');
    }

    // عرض القيم الأولية
    updateCounter();

    // تحديث دوري كل 1.2 ثانية
    setInterval(() => {
        daily += Math.floor(Math.random() * 10 + 1);
        total += Math.floor(Math.random() * 20 + 1);
        updateCounter();
    }, 1200);
});

/* ===== رسالة 10 الاشتراك ===== */
function showSubscribeMsg() {
    const msgEl = document.getElementById('subscribeMsg');
    if (msgEl) {
        msgEl.textContent = '✅ شكراً على اشتراكك! ستصلك آخر التحديثات عبر البريد.';
        setTimeout(() => { msgEl.textContent = ''; }, 8000);
    }
}

/* ===== صندوق 11 الطقس ===== */
const weatherBox = document.getElementById("weatherBox");
const weatherInfo = document.getElementById("weatherInfo");
const weatherIcon = document.getElementById("weatherIcon");
const refreshWeatherBtn = document.getElementById("refreshWeatherBtn");

// حفظ آخر موقع مستخدم في localStorage
function saveLastLocation(lat, lon) {
    localStorage.setItem("lastLat", lat);
    localStorage.setItem("lastLon", lon);
    localStorage.setItem("lastUpdate", Date.now());
}

// تحميل آخر موقع محفوظ
function getLastLocation() {
    return {
        lat: localStorage.getItem("lastLat"),
        lon: localStorage.getItem("lastLon")
    };
}

// جلب بيانات الطقس من OpenWeatherMap
async function fetchWeather(lat, lon) {
    try {
        const apiKey = "c9600bb5dcccfb988100da9bf01b2f2f"; // ضع مفتاحك من https://openweathermap.org/
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=ar&appid=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("فشل في جلب الطقس");
        const data = await res.json();
        const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
        weatherIcon.src = icon;
        weatherInfo.textContent = `${data.name}: ${Math.round(data.main.temp)}°C ${data.weather[0].description}`;
        saveLastLocation(lat, lon);
    } catch (e) {
        console.error("خطأ في جلب بيانات الطقس:", e);
        weatherInfo.textContent = "تعذر جلب الطقس";
    }
}

// محاولة تحديد الموقع
function getWeatherWithGPS() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
            err => {
                console.warn("رفض المستخدم إذن GPS أو حدث خطأ:", err);
                const last = getLastLocation();
                if (last.lat && last.lon) fetchWeather(last.lat, last.lon);
                else weatherInfo.textContent = "الرجاء تفعيل GPS لجلب الطقس.";
            }
        );
    } else {
        const last = getLastLocation();
        if (last.lat && last.lon) fetchWeather(last.lat, last.lon);
    }
}

// تحديث كل ساعة
setInterval(getWeatherWithGPS, 3600000); // 1 ساعة

// تحديث يدوي
refreshWeatherBtn.addEventListener("click", getWeatherWithGPS);

// تشغيل عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", getWeatherWithGPS);

/* ==============12 إرسال التعليقات ====================== */
function toggleSection(id, header) {
    const section = document.getElementById(id);
    const icon = header.querySelector('.toggle-icon');
    if (section.style.display === "none") {
        section.style.display = "block";
        icon.textContent = "▼";
    } else {
        section.style.display = "none";
        icon.textContent = "▶";
    }
}

function formSubmitted() {
    document.getElementById("statusMessage").innerHTML =
        "⏳ يتم الآن إرسال التعليق...";
}


function onIframeLoad() {
    const form = document.getElementById("commentForm");
    if (form) {
        document.getElementById("statusMessage").innerHTML =
            "✅ تم إرسال تعليقك بنجاح. شكرًا لك!";
        form.reset();
    }
}


// ===== تثبيت الهيدر في الأعلى 13 =====
// ضبط padding-top للـ body تلقائياً حسب ارتفاع الهيدر
function adjustBodyPadding() {
    const header = document.querySelector("header");
    document.body.style.paddingTop = header.offsetHeight + "px";
}
window.addEventListener("load", adjustBodyPadding);
window.addEventListener("resize", adjustBodyPadding);

//---- 14 زر المشاركة -->
function sharePage() {
    if (navigator.share) {
        navigator.share({
            title: 'البوابة الجزائرية للخدمات الرقمية',
            text: 'شارك البوابة الجزائرية للخدمات الرقمية مع أصدقائك وساهم في تعميم الثقافة الرقمية',
            url: window.location.href
        });
    } else {
        alert("المشاركة غير مدعومة في هذا المتصفح. انسخ الرابط: " + window.location.href);
    }
}

//---- زر المشاركة نهاية -->
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/dz_portal/service-worker.js");
}

//----  loading', 'lazy تحميل الصور  -->

document.querySelectorAll('img:not([loading])').forEach(img => {
    img.setAttribute('loading', 'lazy');
});

// المستخدم ينزل للأسفل → إخفاء الهيدر

let lastScroll = 0;

window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    const current = window.scrollY;

    if (current > lastScroll) {
        // المستخدم ينزل للأسفل → إخفاء الهيدر
        header.classList.add("hide-header");
    } else {
        // المستخدم يصعد للأعلى → إظهار الهيدر
        header.classList.remove("hide-header");
    }

    lastScroll = current;
});
