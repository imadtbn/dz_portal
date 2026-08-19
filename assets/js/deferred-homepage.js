(() => {
  'use strict';

  const loadScript = (src, callback) => {
    if (document.querySelector(`script[data-deferred-src="${src}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.dataset.deferredSrc = src;
    script.onload = () => callback?.();
    script.onerror = () => console.warn('تعذر تحميل السكريبت المؤجل:', src);
    document.body.appendChild(script);
  };

  const scheduleIdle = (callback, timeout = 2000) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout });
    } else {
      window.setTimeout(callback, timeout);
    }
  };

  const loadStats = () => loadScript('assets/js/homepageStats.js');
  const loadRating = () => loadScript('assets/js/siteRating.js');
  const loadAdsHelper = () => loadScript('assets/js/adsData.js', () => {
    document.querySelectorAll('ins.adsbygoogle').forEach((adBlock) => {
      if (adBlock.hasAttribute('data-adsbygoogle-status') || adBlock.children.length > 0) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.warn('تعذر تهيئة إعلان مؤجل:', error);
      }
    });
  });

  const searchInput = document.getElementById('globalSearch');
  let searchRequested = false;
  const loadSearch = () => {
    if (searchRequested) return;
    searchRequested = true;
    loadScript('assets/js/searchData.js', () => {
      if (searchInput?.value) {
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  };

  if (searchInput) {
    searchInput.addEventListener('focus', loadSearch, { once: true, passive: true });
  }

  window.addEventListener('load', () => {
    scheduleIdle(loadStats, 2500);
    scheduleIdle(loadRating, 3500);
    scheduleIdle(loadAdsHelper, 4500);
  }, { once: true, passive: true });
})();
