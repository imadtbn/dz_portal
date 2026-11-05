/* Shared runtime for migrated health tools. */
(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const formatNumber = value => Number(value).toLocaleString('ar-DZ-u-nu-latn', { maximumFractionDigits: 2 });
  const getNumber = id => {
    const el = byId(id);
    if (!el || el.value.trim() === '') return NaN;
    return Number(el.value);
  };
  const showError = (id, message) => {
    const el = byId(id);
    if (el) { el.textContent = message; el.hidden = false; el.classList.add('show'); }
  };
  const clearError = id => {
    const el = byId(id);
    if (el) { el.textContent = ''; el.hidden = true; el.classList.remove('show'); }
  };
  const validRange = (value, min, max) =>
    Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max;

  const shareResult = async (title, text) => {
    const singleArgument = text === undefined;
    const message = singleArgument ? String(title || '') : String(text || '');
    const payload = {
      title: singleArgument ? 'Tools DZ' : String(title || 'Tools DZ'),
      text: message
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return true;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message);
        return true;
      }
    } catch (_) {
      return false;
    }
    return false;
  };

  window.CalorieApp = {
    formatNumber, getNumber, showError, clearError, validRange, shareResult,
    icon: value => '<span aria-hidden="true">' + String(value || '•') + '</span>'
  };

  // The migrated pages use .reveal, but unlike the source project they do not
  // load its scroll-reveal controller. Never leave essential forms invisible.
  document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));

  // Provide a consistent report-sharing action on every calculator/screening.
  const setupReportSharing = panel => {
    if (panel.querySelector('[data-health-share]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn health-report-share';
    button.dataset.healthShare = 'true';
    button.textContent = 'مشاركة التقرير';
    button.setAttribute('aria-label', 'مشاركة التقرير الصحي');
    button.hidden = true;
    panel.appendChild(button);

    const resultNodes = () => [...panel.querySelectorAll('.result-content, [id$="-result"]')];
    const hasResult = () => resultNodes().some(node => !node.hidden && node.textContent.trim().length > 0);
    const updateButton = () => {
      const shouldHide = !hasResult();
      // Avoid mutating the observed subtree when the state has not changed.
      // Re-writing the same hidden attribute can retrigger MutationObserver indefinitely.
      if (button.hidden !== shouldHide) button.hidden = shouldHide;
    };
    const observer = new MutationObserver(updateButton);
    observer.observe(panel, { subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
    updateButton();

    button.addEventListener('click', async () => {
      const report = resultNodes()
        .filter(node => !node.hidden)
        .map(node => node.innerText || node.textContent || '')
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      if (!report) return;
      const original = button.textContent;
      const shared = await shareResult('تقرير صحي من Tools DZ', report);
      if (shared) {
        button.textContent = navigator.share ? 'تم فتح المشاركة' : 'تم نسخ التقرير';
        window.setTimeout(() => { button.textContent = original; }, 2200);
      }
    });
  };
  document.querySelectorAll('.result-panel').forEach(setupReportSharing);

  const year = byId('current-year');
  if (year) year.textContent = new Date().getFullYear();

  const toggle = document.querySelector('.mobile-menu-toggle');
  const nav = byId('main-nav');
  if (toggle && nav && !document.body.hasAttribute('data-shared-header-app')) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('active', open);
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    });
  }

  if (toggle && nav) {
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) {
        nav.classList.remove('active', 'is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'فتح القائمة');
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('active')) {
        nav.classList.remove('active', 'is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'فتح القائمة');
        toggle.focus();
      }
    });
  }

  const theme = byId('theme-toggle');
  if (theme) {
    let saved = null;
    try { saved = localStorage.getItem('tools-dz-theme'); } catch (_) { /* Storage may be unavailable in restricted browsers. */ }
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    theme.textContent = saved === 'dark' ? '☀️' : '🌙';
    theme.addEventListener('click', () => {
      const dark = document.documentElement.getAttribute('data-theme') !== 'dark';
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      try { localStorage.setItem('tools-dz-theme', dark ? 'dark' : 'light'); } catch (_) { /* Keep theme usable without persistence. */ }
      theme.textContent = dark ? '☀️' : '🌙';
    });
  }
})();