      // main 

    // دالة بسيطة لفتح/غلق المجموعات
    function toggleGroup(header) {
      const content = header.nextElementSibling;
      const icon = header.querySelector('.toggle-icon');
      if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
      } else {
        content.style.display = 'none';
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
      }
    }
    // افتح المجموعة الأولى افتراضيًا
    document.querySelectorAll('.service-group .group-content').forEach((el, idx) => {
      if (idx === 0) el.style.display = 'block';
      else el.style.display = 'none';
    });
    
    (function () {
      // انتظر DOM ثم نفّذ
      document.addEventListener('DOMContentLoaded', () => {
        /* -------------------- عناصر أساسية -------------------- */
        const body = document.body;
        const installButton = document.getElementById('install-button');
        const searchInput = document.getElementById('searchInput');
        const darkBtn = document.getElementById('darkModeToggle');
        const langBtn = document.getElementById('googleLangToggle');


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


    // محرك البحث
    document.addEventListener("DOMContentLoaded", function () {

      const searchInput = document.getElementById("searchInput");
      const cards = document.querySelectorAll(".sector-card");

      if (!searchInput) return;

      searchInput.addEventListener("input", function () {

        const value = this.value.toLowerCase().trim();

        cards.forEach(card => {
          const text = card.textContent.toLowerCase();

          if (text.includes(value)) {
            card.style.display = "block";
          } else {
            card.style.display = "none";
          }
        });

      });

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



    if (location.hash) {
      const section = document.querySelector(location.hash);
      if (section) section.scrollIntoView({ behavior: "smooth" });
    }


     const sidebar = document.querySelector(".sidebar");
    const menuBtn = document.querySelector(".menu-toggle");
    const links = document.querySelectorAll(".sidebar a");

    menuBtn.onclick = () => {
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");
    };

    overlay.onclick = () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    };

    /* إغلاق القائمة عند الضغط على أي رابط */
    links.forEach(link => {
      link.onclick = () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
      }
    });