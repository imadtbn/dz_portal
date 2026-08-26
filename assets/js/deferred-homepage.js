(() => {
  'use strict';

  const loadLocalScript = (src, callback) => {
    if (document.querySelector(`script[data-deferred-src="${src}"]`)) return;

    const script = document.createElement('script');
    script.src = src;
    script.dataset.deferredSrc = src;
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

  const searchInput = document.getElementById('globalSearch');
  let searchRequested = false;
  const loadSearch = () => {
    if (searchRequested) return;
    searchRequested = true;
    loadLocalScript('assets/js/searchData.js', () => {
      if (searchInput?.value) {
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  };

  if (searchInput) {
    searchInput.addEventListener('focus', loadSearch, { once: true, passive: true });
  }

  window.addEventListener('load', () => {
    scheduleIdle(() => loadLocalScript('assets/js/homepageStats.js'), 2500);
    scheduleIdle(() => loadLocalScript('assets/js/siteRating.js'), 3500);
  }, { once: true, passive: true });
})();
