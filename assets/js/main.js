// Hide loader
// Smart Loader - يظهر مرة واحدة فقط داخل نفس الجلسة
window.addEventListener('load', () => {

  const loader = document.getElementById('loader');

  // هل تم عرض اللودر مسبقاً داخل نفس الجلسة؟
  const loaderShown = sessionStorage.getItem('loaderShown');

  if (loaderShown) {

    // إخفاء فوري بدون عرض اللودر
    loader.style.display = 'none';

  } else {

    // أول دخول فقط
    sessionStorage.setItem('loaderShown', 'true');

    setTimeout(() => {
      loader.classList.add('hidden');

      // إزالة اللودر نهائياً بعد انتهاء الانيميشن
      setTimeout(() => {
        loader.style.display = 'none';
      }, 500);

    }, 600); // مدة عرض اللودر (600ms)

  }
});


// Theme toggle
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const icon = document.querySelector('.theme-toggle i');
  icon.classList.toggle('fa-moon');
  icon.classList.toggle('fa-sun');
}

// Scroll to top
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Search functionality
document.getElementById('globalSearch').addEventListener('input', function (e) {
  const query = e.target.value.toLowerCase();
  const cards = document.querySelectorAll('.sector-card');

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(query) ? 'block' : 'none';
  });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Add bounce animation
const style = document.createElement('style');
style.textContent = `
            @keyframes bounce {
                0%, 100% { transform: translateX(-50%) translateY(0); }
                50% { transform: translateX(-50%) translateY(-10px); }
            }
        `;
document.head.appendChild(style);


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


// Google Analytics - تحميل عند التفاعل الأول لتحسين الأداء والخصوصية

function loadAnalytics() {

  if (window.analyticsLoaded) return;
  window.analyticsLoaded = true;

  const gtag = document.createElement('script');
  gtag.src = 'https://www.googletagmanager.com/gtag/js?id=G-K23WYKK60X';
  gtag.async = true;
  document.head.appendChild(gtag);

}

window.addEventListener('scroll', loadAnalytics, { once: true });
window.addEventListener('click', loadAnalytics, { once: true });

// تحميل تحليلات إضافية بعد 3 ثواني من التحميل لتحسين الأداء
window.addEventListener('load', () => {
  setTimeout(() => {

    // analytics هنا

  }, 3000);
});

// تسجيل حدث زيارة الصفحة
function trackPageVisit() {
  if (window.gtag) {
    gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
  }
}

// ============================================================
// حل شامل لتثبيت PWA (يعمل على جميع المتصفحات والأجهزة)
// ============================================================

(function() {
    'use strict';

    // 1. العناصر
    const installBtn = document.getElementById('installAppBtn');
    if (!installBtn) return; // تأكد من وجود الزر

    let deferredPrompt = null;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // 2. إذا كان التطبيق مفتوحاً في وضع PWA، نخفي الزر
    if (isStandalone) {
        installBtn.style.display = 'none';
        return;
    }

    // 3. استقبال حدث beforeinstallprompt (Chrome, Edge, إلخ)
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        // إظهار الزر وتفعيله
        installBtn.style.display = 'flex';
        installBtn.style.pointerEvents = 'auto';
        installBtn.style.opacity = '1';
        // تحديث النص
        const title = installBtn.querySelector('.badge-title');
        if (title) title.textContent = 'تثبيت التطبيق';
        const subtitle = installBtn.querySelector('.badge-subtitle');
        if (subtitle) subtitle.textContent = 'انقر لتثبيت التطبيق رسمياً';
    });

    // 4. دالة عرض التعليمات اليدوية (للمتصفحات غير المدعومة)
    function showManualInstructions() {
        const ua = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
        const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
        const isAndroid = /android/i.test(ua);

        let message = '';
        if (isIOS) {
            message = '📱 لإضافة التطبيق إلى شاشتك الرئيسية على iPhone/iPad:\n\n' +
                      '1. اضغط على زر المشاركة (□ مع سهم لأعلى) في أسفل الشاشة.\n' +
                      '2. اختر "إضافة إلى الشاشة الرئيسية".\n' +
                      '3. اضغط على "إضافة" في الأعلى.';
        } else if (isSafari && !isIOS) {
            message = '🍏 لإضافة التطبيق إلى الشاشة الرئيسية في Safari على Mac:\n\n' +
                      '1. اضغط على زر المشاركة في شريط الأدوات.\n' +
                      '2. اختر "إضافة إلى الشاشة الرئيسية".';
        } else if (isAndroid) {
            message = '🤖 لإضافة التطبيق إلى الشاشة الرئيسية على Android:\n\n' +
                      '1. اضغط على القائمة (ثلاث نقاط) في أعلى المتصفح.\n' +
                      '2. اختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت".\n' +
                      '3. اتبع التعليمات.';
        } else {
            message = '🌐 متصفحك لا يدعم التثبيت التلقائي.\n\n' +
                      'يمكنك إضافة هذه الصفحة إلى المفضلة، أو استخدام خيار "إضافة إلى الشاشة الرئيسية" من قائمة المتصفح.';
        }

        // عرض التعليمات في نافذة منبثقة (يمكن استبدالها بمودال مخصص)
        alert(message);
    }

    // 5. حدث النقر على زر التثبيت
    installBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        if (deferredPrompt) {
            // المتصفح يدعم التثبيت التلقائي
            try {
                deferredPrompt.prompt();
                const result = await deferredPrompt.userChoice;
                if (result.outcome === 'accepted') {
                    console.log('✅ تم تثبيت التطبيق بنجاح');
                    installBtn.style.display = 'none';
                } else {
                    console.log('❌ رفض المستخدم التثبيت');
                    showManualInstructions(); // عرض تعليمات يدوية كبديل
                }
                deferredPrompt = null;
            } catch (err) {
                console.error('خطأ في التثبيت:', err);
                showManualInstructions();
            }
        } else {
            // المتصفح لا يدعم beforeinstallprompt أو لم يتم استقباله
            showManualInstructions();
        }
    });

    // 6. في حالة نجاح التثبيت عبر المتصفح (حدث appinstalled)
    window.addEventListener('appinstalled', () => {
        console.log('✅ تم تثبيت التطبيق (حدث appinstalled)');
        installBtn.style.display = 'none';
    });

    // 7. إذا لم يظهر beforeinstallprompt بعد 5 ثوان، نغير سلوك الزر إلى "تعليمات"
    setTimeout(() => {
        if (!deferredPrompt && installBtn.style.display !== 'none') {
            const title = installBtn.querySelector('.badge-title');
            if (title) title.textContent = 'تثبيت التطبيق';
            const subtitle = installBtn.querySelector('.badge-subtitle');
            if (subtitle) subtitle.textContent = 'اضغط للتعليمات';
            // نضمن أن الزر قابل للنقر
            installBtn.style.pointerEvents = 'auto';
        }
    }, 5000);

    // 8. (اختياري) تحسين إمكانية الوصول: إضافة دور زر وعلامة تبويب
    installBtn.setAttribute('role', 'button');
    installBtn.setAttribute('tabindex', '0');
    installBtn.style.cursor = 'pointer';

    // 9. دعم الضغط على Enter أو Space (لوحة المفاتيح)
    installBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            installBtn.click();
        }
    });

})();


// زر الفلترة والعداد

const filterBtns = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.sector-card');

filterBtns.forEach(btn => {

  btn.addEventListener('click', () => {

    filterBtns.forEach(b =>
      b.classList.remove('active')
    );

    btn.classList.add('active');

    const filter = btn.dataset.filter;

    cards.forEach(card => {

      const isNew =
        card.querySelector('.service-badge');

      if (filter === 'all') {
        card.style.display = '';
      }
      else {
        card.style.display =
          isNew ? '' : 'none';
      }

    });

  });

});


document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("newServicesBtn");

  const count = document.querySelectorAll(
    ".sector-card[data-new='true']"
  ).length;

  if (count > 0) {

    btn.innerHTML = `
            <i class="fas fa-sparkles"></i>
            الخدمات الجديدة (${count})
        `;

  } else {

    btn.style.display = "none";

  }

});
