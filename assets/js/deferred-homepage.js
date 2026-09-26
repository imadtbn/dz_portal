(() => {
  'use strict';

  const loaderScript = document.currentScript;
  const assetsRoot = loaderScript
    ? new URL('../', loaderScript.src)
    : new URL('assets/', document.baseURI);

  const loadLocalScript = (src, callback) => {
    const resolvedSrc = new URL(src, assetsRoot).href;
    if (document.querySelector(`script[data-deferred-src="${resolvedSrc}"]`)) {
      callback?.();
      return;
    }

    const script = document.createElement('script');
    script.src = resolvedSrc;
    script.dataset.deferredSrc = resolvedSrc;
    script.addEventListener('load', () => callback?.(), { once: true });
    script.addEventListener('error', () => {
      console.warn('تعذر تحميل السكريبت المحلي المؤجل:', src);
    }, { once: true });
    document.body.appendChild(script);
  };

  const scheduleIdle = (callback, timeout = 2000) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout });
    } else {
      window.setTimeout(callback, timeout);
    }
  };

  // التحميل المؤجل لبيانات البحث بدون أي تتبع أو Analytics.
  const searchInput = document.getElementById('globalSearch') || document.querySelector('.search-input');
  let searchRequested = false;

  const loadSearch = (onComplete) => {
    if (searchRequested) {
      onComplete?.();
      return;
    }

    searchRequested = true;
    loadLocalScript('js/searchData.js', () => {
      if (searchInput?.value) {
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      onComplete?.();
    });
  };

  if (searchInput) {
    searchInput.addEventListener('focus', () => loadSearch(), { once: true, passive: true });
    searchInput.addEventListener('input', () => loadSearch(), { once: true, passive: true });
  }

  document.querySelectorAll('.search-trigger, [data-search-trigger]').forEach((trigger) => {
    trigger.addEventListener('click', () => loadSearch(), { once: true, passive: true });
  });

  // جدولة وظائف الصفحة الرئيسية غير المتعلقة بالتتبع.
  window.addEventListener('load', () => {
    scheduleIdle(() => loadLocalScript('js/homepageStats.js'), 1400);
    scheduleIdle(() => loadLocalScript('js/siteRating.js'), 1500);
  }, { once: true, passive: true });
})();
