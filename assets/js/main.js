// Hide loader
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.classList.add('hidden');
    }
  }, 1000);
});

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const icon = document.querySelector('.theme-toggle i');
  if (icon) {
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
  }
  const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  if (typeof window.dzTrackEvent === 'function') {
    window.dzTrackEvent('theme_change', { theme: currentTheme });
  }
}

// Scroll to top
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

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


// تتم إدارة Analytics وGTM وAdSense وMicrosoft Clarity مركزياً عبر site-tags.js.

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
      if (typeof window.dzTrackEvent === 'function') {
        window.dzTrackEvent('pwa_prompt_opened');
      }
      // عرض نافذة التثبيت
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      console.log(`نتيجة التثبيت: ${result.outcome}`);
      if (typeof window.dzTrackEvent === 'function') {
        window.dzTrackEvent('pwa_install_outcome', { outcome: result.outcome });
      }
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
  if (typeof window.dzTrackEvent === 'function') {
    window.dzTrackEvent('app_installed', { method: 'pwa' });
  }
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


// فلترة الخدمات الجديدة حسب تاريخ الإضافة
const NEW_SERVICE_WINDOW_DAYS = 25;
const NEW_SERVICE_WINDOW_MS = NEW_SERVICE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const filterBtns = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.sector-card');
const newServicesBtn = document.getElementById('newServicesBtn');
const newServicesCount = document.getElementById('newServicesCount');
let activeFilter = 'all';
let newServicesRefreshTimer = null;

function parseNewServiceDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;

  const [year, month, day] = value.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);

  // رفض التواريخ غير الصحيحة مثل 2026-02-31 بدلاً من تطبيعها تلقائياً.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return timestamp;
}

function isNewService(card, now = Date.now()) {
  const addedAt = parseNewServiceDate(card.dataset.newSince);
  return addedAt !== null && addedAt <= now && now < addedAt + NEW_SERVICE_WINDOW_MS;
}

function applyServiceFilter(filter = activeFilter) {
  activeFilter = filter === 'new' ? 'new' : 'all';

  filterBtns.forEach(btn => {
    const isActive = btn.dataset.filter === activeFilter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });

  cards.forEach(card => {
    const shouldShow = activeFilter === 'all' || card.dataset.new === 'true';
    card.style.display = shouldShow ? '' : 'none';
  });

  if (typeof window.dzTrackEvent === 'function') {
    window.dzTrackEvent('filter_services', { filter_type: activeFilter });
  }
}

function refreshNewServices() {
  const now = Date.now();
  let newCount = 0;
  let nextRefreshAt = Infinity;

  cards.forEach(card => {
    const addedAt = parseNewServiceDate(card.dataset.newSince);
    const isNew = isNewService(card, now);
    const badge = card.querySelector('.service-badge');

    card.dataset.new = String(isNew);
    card.classList.toggle('is-new', isNew);

    if (badge) {
      badge.hidden = !isNew;
      badge.setAttribute('aria-hidden', String(!isNew));
    }

    if (isNew) newCount += 1;

    if (addedAt !== null) {
      const boundary = addedAt > now ? addedAt : addedAt + NEW_SERVICE_WINDOW_MS;
      nextRefreshAt = Math.min(nextRefreshAt, boundary);
    }
  });

  if (newServicesCount) {
    newServicesCount.textContent = newCount > 0 ? String(newCount) : '';
    newServicesCount.hidden = newCount === 0;
  }

  if (newServicesBtn) {
    newServicesBtn.style.display = newCount > 0 ? '' : 'none';
  }

  // إذا انتهت آخر خدمة أثناء تفعيل الفلتر، نعيد العرض تلقائياً إلى جميع الخدمات.
  if (activeFilter === 'new' && newCount === 0) activeFilter = 'all';
  applyServiceFilter(activeFilter);

  if (newServicesRefreshTimer) window.clearTimeout(newServicesRefreshTimer);
  if (Number.isFinite(nextRefreshAt)) {
    const delay = Math.max(1000, nextRefreshAt - Date.now() + 100);
    newServicesRefreshTimer = window.setTimeout(refreshNewServices, delay);
  }
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    applyServiceFilter(btn.dataset.filter);
  });
});

document.addEventListener('DOMContentLoaded', refreshNewServices);

//النافذة التحذيرية

document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("securityAlert");

    if (!modal) return;

    const closeBtn = modal.querySelector(".alert-close");
    const actionBtn = modal.querySelector(".alert-btn");

    function closeModal() {
        modal.style.display = "none";
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", closeModal);
    }

    if (actionBtn && actionBtn.tagName === "BUTTON") {
        actionBtn.addEventListener("click", closeModal);
    }

});