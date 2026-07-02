
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

// ====== تثبيت التطبيق (PWA) ======
let deferredPrompt;
const installBtn = document.getElementById('installAppBtn');

// استقبال حدث beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // إظهار الزر إذا كان مخفياً (اختياري)
  if (installBtn) {
    installBtn.style.display = 'flex';
  }
});

// حدث النقر على زر التثبيت
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      // عرض نافذة التثبيت
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      console.log(`نتيجة التثبيت: ${result.outcome}`);
      if (result.outcome === 'accepted') {
        console.log('تم تثبيت التطبيق بنجاح');
        // إخفاء الزر بعد التثبيت
        installBtn.style.display = 'none';
      } else {
        console.log('تم رفض التثبيت');
      }
      deferredPrompt = null;
    } else {
      // إذا لم يكن الحدث متاحاً (متصفح غير مدعوم أو تم التثبيت مسبقاً)
      alert('متصفحك لا يدعم تثبيت التطبيقات أو تم التثبيت مسبقاً.');
    }
  });
}

// في حالة نجاح التثبيت (حدث appinstalled)
window.addEventListener('appinstalled', () => {
  console.log('تم تثبيت التطبيق عبر المتصفح');
  if (installBtn) installBtn.style.display = 'none';
});

// إذا كان المتصفح لا يدعم PWA، نخفي الزر
window.addEventListener('load', () => {
  if (!('serviceWorker' in navigator) || !window.matchMedia('(display-mode: standalone)').matches) {
    // لا تفعل شيئاً، الزر يظهر لكن النقر سيظهر رسالة
  }
  // التحقق إذا كان التطبيق مفتوحاً بالفعل كـ PWA
  if (window.matchMedia('(display-mode: standalone)').matches) {
    if (installBtn) installBtn.style.display = 'none';
  }
});


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
