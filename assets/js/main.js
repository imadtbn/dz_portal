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
let deferredPrompt = null;
const installBtn = document.getElementById('installAppBtn');
const installModal = document.getElementById('pwaInstallModal');
const installNowBtn = document.getElementById('pwaInstallNow');
const installLaterBtn = document.getElementById('pwaInstallLater');
const installDismissBtn = document.getElementById('pwaInstallDismiss');
const installHelp = document.getElementById('pwaInstallHelp');
const installDismissKey = 'dzPortalInstallDismissedUntil';
const installCooldownMs = 7 * 24 * 60 * 60 * 1000;

function isPortalInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true;
}

function openInstallModal() {
  if (!installModal || isPortalInstalled()) return;
  installModal.hidden = false;
  document.body.classList.add('pwa-modal-open');
  if (installNowBtn) {
    installNowBtn.textContent = deferredPrompt ? 'تثبيت البوابة الآن' : 'كيفية التثبيت';
  }
  if (installHelp) {
    installHelp.hidden = Boolean(deferredPrompt);
  }
}

function closeInstallModal(saveDismissal = true) {
  if (!installModal) return;
  installModal.hidden = true;
  document.body.classList.remove('pwa-modal-open');
  if (saveDismissal) {
    try { localStorage.setItem(installDismissKey, String(Date.now() + installCooldownMs)); } catch (_) {}
  }
}

if (installBtn) {
  installBtn.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      installBtn.click();
    }
  });
  installBtn.addEventListener('click', openInstallModal);
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  if (installNowBtn) installNowBtn.textContent = 'تثبيت البوابة الآن';
  if (installHelp) installHelp.hidden = true;
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  closeInstallModal(false);
  if (installBtn) installBtn.style.display = 'none';
  try { localStorage.removeItem(installDismissKey); } catch (_) {}
  if (typeof window.dzTrackEvent === 'function') {
    window.dzTrackEvent('app_installed', { method: 'pwa' });
  }
});

if (installNowBtn) {
  installNowBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      const promptEvent = deferredPrompt;
      deferredPrompt = null;
      if (typeof window.dzTrackEvent === 'function') window.dzTrackEvent('pwa_prompt_opened');
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (typeof window.dzTrackEvent === 'function') {
        window.dzTrackEvent('pwa_install_outcome', { outcome: choice.outcome });
      }
      if (choice.outcome === 'accepted') closeInstallModal(false);
      else closeInstallModal(true);
      return;
    }
    if (installHelp) installHelp.hidden = false;
    installNowBtn.textContent = 'فهمت';
    installNowBtn.onclick = () => closeInstallModal(true);
  });
}

if (installLaterBtn) installLaterBtn.addEventListener('click', () => closeInstallModal(true));
if (installDismissBtn) installDismissBtn.addEventListener('click', () => closeInstallModal(true));
if (installModal) {
  installModal.addEventListener('click', (event) => {
    if (event.target === installModal) closeInstallModal(true);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !installModal.hidden) closeInstallModal(true);
  });
}

window.addEventListener('load', () => {
  if (isPortalInstalled()) {
    if (installBtn) installBtn.style.display = 'none';
    if (installModal) installModal.hidden = true;
    return;
  }
  if (installBtn) installBtn.style.display = '';
  let dismissedUntil = 0;
  try { dismissedUntil = Number(localStorage.getItem(installDismissKey) || 0); } catch (_) {}
  // First visit shows the suggestion; after dismissal, remind again after seven days.
  if (Date.now() >= dismissedUntil) {
    window.setTimeout(openInstallModal, 1800);
  }
});

// إشعارات الخدمات الجديدة: مدة الظهور 20 يومًا، من سجل مركزي واحد.
const NEW_SERVICE_WINDOW_DAYS = 20;
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
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
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
    card.style.display = activeFilter === 'all' || card.dataset.new === 'true' ? '' : 'none';
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
      if (boundary > now) nextRefreshAt = Math.min(nextRefreshAt, boundary);
    }
  });
  if (newServicesCount) {
    newServicesCount.textContent = newCount > 0 ? String(newCount) : '';
    newServicesCount.hidden = newCount === 0;
  }
  if (newServicesBtn) newServicesBtn.style.display = newCount > 0 ? '' : 'none';
  if (activeFilter === 'new' && newCount === 0) activeFilter = 'all';
  applyServiceFilter(activeFilter);
  if (newServicesRefreshTimer) window.clearTimeout(newServicesRefreshTimer);
  if (Number.isFinite(nextRefreshAt)) {
    newServicesRefreshTimer = window.setTimeout(refreshNewServices, Math.max(1000, nextRefreshAt - Date.now() + 100));
  }
}

function renderNewServiceNotice(services) {
  const section = document.getElementById('newServicesNotice');
  const feed = document.getElementById('newServicesFeed');
  const total = document.getElementById('newServicesTotal');
  const moreButton = document.getElementById('newServicesMore');
  if (!section || !feed || !Array.isArray(services)) return;

  const now = Date.now();
  const active = services
    .filter(service => service && parseNewServiceDate(service.addedAt) !== null)
    .filter(service => {
      const addedAt = parseNewServiceDate(service.addedAt);
      return addedAt <= now && now < addedAt + NEW_SERVICE_WINDOW_MS &&
        typeof service.title === 'string' && typeof service.sector === 'string' &&
        typeof service.sectorUrl === 'string';
    })
    .sort((a, b) => parseNewServiceDate(b.addedAt) - parseNewServiceDate(a.addedAt));

  if (!active.length) {
    section.hidden = true;
    return;
  }

  const visibleLimit = 2;
  let expanded = false;
  section.classList.toggle('has-new-services', active.length > 0);
  feed.replaceChildren();

  active.forEach((service, index) => {
    const item = document.createElement('article');
    item.className = 'new-service-item';
    if (index >= visibleLimit) item.hidden = true;
    item.dataset.extraService = String(index >= visibleLimit);

    const sectorHeading = document.createElement('h3');
    sectorHeading.className = 'new-services-sector';
    const sectorIcon = document.createElement('i');
    sectorIcon.className = 'fas ' + (
      /داخلية|جماعات محلية/.test(service.sector) ? 'fa-building' :
      /تربية|تعليم|جامعة/.test(service.sector) ? 'fa-graduation-cap' :
      /نقل|قطار/.test(service.sector) ? 'fa-train' : 'fa-landmark'
    );
    sectorIcon.setAttribute('aria-hidden', 'true');
    const sectorName = document.createElement('span');
    sectorName.className = 'new-services-sector-name';
    sectorName.textContent = service.sector;
    sectorHeading.append(sectorIcon, sectorName);

    const title = document.createElement('h4');
    title.textContent = service.title;

    const footer = document.createElement('div');
    footer.className = 'new-service-footer';
    const sectorLink = document.createElement('a');
    sectorLink.className = 'new-services-sector-link';
    sectorLink.href = service.sectorUrl;
    sectorLink.textContent = 'صفحة القطاع';
    sectorLink.setAttribute('aria-label', 'زيارة صفحة قطاع ' + service.sector);
    footer.append(sectorLink);

    item.append(sectorHeading, title, footer);
    feed.append(item);
  });

  total.textContent = String(active.length);
  total.hidden = false;
  if (moreButton) {
    moreButton.hidden = active.length <= visibleLimit;
    moreButton.setAttribute('aria-expanded', 'false');
    moreButton.innerHTML = 'عرض المزيد من الخدمات الجديدة <i class="fas fa-chevron-down" aria-hidden="true"></i>';
    moreButton.onclick = () => {
      expanded = !expanded;
      feed.querySelectorAll('[data-extra-service="true"]').forEach(item => {
        item.hidden = !expanded;
      });
      moreButton.setAttribute('aria-expanded', String(expanded));
      moreButton.innerHTML = expanded
        ? 'عرض عدد أقل <i class="fas fa-chevron-up" aria-hidden="true"></i>'
        : 'عرض المزيد من الخدمات الجديدة <i class="fas fa-chevron-down" aria-hidden="true"></i>';
      if (typeof window.dzTrackEvent === 'function') {
        window.dzTrackEvent('new_services_expand', { expanded, total: active.length });
      }
    };
  }
  section.hidden = false;

  const nextExpiry = Math.min(...active.map(service => parseNewServiceDate(service.addedAt) + NEW_SERVICE_WINDOW_MS));
  window.setTimeout(loadNewServiceNotice, Math.max(1000, nextExpiry - Date.now() + 100));
}

async function loadNewServiceNotice() {
  const section = document.getElementById('newServicesNotice');
  if (!section) return;
  try {
    const response = await fetch('assets/data/new-services.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Could not load the new-services registry');
    const registry = await response.json();
    renderNewServiceNotice(registry.services);
  } catch (error) {
    section.hidden = true;
    console.warn('تعذر تحميل سجل الخدمات الجديدة:', error);
  }
}

filterBtns.forEach(btn => btn.addEventListener('click', () => applyServiceFilter(btn.dataset.filter)));
document.addEventListener('DOMContentLoaded', () => {
  refreshNewServices();
  loadNewServiceNotice();
});

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