(() => {
  'use strict';

  const loaderScript = document.currentScript;
  const assetsRoot = loaderScript
    ? new URL('../', loaderScript.src)
    : new URL('assets/', document.baseURI);

  const loadLocalScript = (src, callback) => {
    const resolvedSrc = new URL(src, assetsRoot).href;
    // Recognize ordinary <script defer src="..."> as well as inserted scripts.
    // siteRating.js is already declared directly on the statistics page.
    const existing = Array.from(document.scripts).find((tag) => (
      tag.src === resolvedSrc || tag.dataset.deferredSrc === resolvedSrc
    ));
    if (existing) {
      if (callback) {
        if (existing.dataset.dzDeferredLoaded === 'true'
          || (!existing.dataset.deferredSrc && document.readyState === 'complete')) {
          callback();
        } else {
          existing.addEventListener('load', callback, { once: true });
        }
      }
      return;
    }

    const script = document.createElement('script');
    script.src = resolvedSrc;
    script.dataset.deferredSrc = resolvedSrc;
    script.addEventListener('load', () => {
      script.dataset.dzDeferredLoaded = 'true';
      callback?.();
    }, { once: true });
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

  // Stable AdSense initialization runs on all standard portal pages, without
  // changing the tracking or ad script already declared in each HTML file.
  if (document.querySelector('ins.adsbygoogle')
    && !document.querySelector('script[src$="/ads-stability.js"]')) {
    loadLocalScript('js/ads-stability.js');
  }

  // Load each optional feature only where its HTML host exists.
  // This avoids downloading homepage stats and rating code on sector pages,
  // without altering search, AdSense, analytics or the widgets themselves.
  window.addEventListener('load', () => {
    if (document.querySelector('[data-homepage-stat="sectors"]')
        && document.querySelector('[data-homepage-stat="services"]')
        && document.querySelector('.sectors-section .sector-card')) {
      scheduleIdle(() => loadLocalScript('js/homepageStats.js'), 1400);
    }
    if (document.querySelector('[data-rating-widget]')) {
      scheduleIdle(() => loadLocalScript('js/siteRating.js'), 1500);
    }
  }, { once: true, passive: true });
})();
