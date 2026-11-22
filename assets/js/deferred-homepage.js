(() => {

  // Keep the sitemap reachable from the different legacy and modern footer templates.
  function ensureSitemapFooterLink() {
    const footer = document.querySelector('footer');
    if (!footer || footer.querySelector('[data-dz-sitemap-link]')) return;
    const link = document.createElement('a');
    link.href = new URL('/dz_portal/sitemap.html', location.origin).href;
    link.textContent = 'خريطة الموقع';
    link.setAttribute('data-dz-sitemap-link', 'true');
    link.setAttribute('aria-label', 'خريطة الموقع');
    const list = footer.querySelector('.footer-links');
    const nav = footer.querySelector('.reader-footer__links, .footer-inner nav, nav');
    if (list) {
      const item = document.createElement('li');
      item.appendChild(link);
      list.appendChild(item);
    } else if (nav) {
      nav.appendChild(link);
    } else {
      (footer.querySelector('.footer-bottom') || footer).appendChild(link);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureSitemapFooterLink, { once: true });
  } else {
    ensureSitemapFooterLink();
  }

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
  // Sector dialogs are served by localSearch.js, not by the global index.
  const searchInput = document.getElementById('globalSearch')
    || (document.getElementById('searchResults') ? document.querySelector('.search-input') : null);
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

  if (searchInput) {
    document.querySelectorAll('.search-trigger, [data-search-trigger]').forEach((trigger) => {
      trigger.addEventListener('click', () => loadSearch(), { once: true, passive: true });
    });
  }

  // Local favorites are enabled on sector landing pages without changing their existing layouts.
  if (location.pathname.includes('/sectors/') && document.querySelector('.sector-hero')) {
    const loadSectorFavorites = () => loadLocalScript('js/favorites-sector-ui.js');
    if (window.DZFavorites) loadSectorFavorites();
    else loadLocalScript('js/favorites.js', loadSectorFavorites);
  }

  // Ensure footer ads also exist on standard pages that do not already
  // contain an in-content ad. The shared controller preserves all existing units.
  window.addEventListener('load', () => {
    if (document.querySelector('footer')
      && !document.querySelector('script[src$="/ads-stability.js"]')) {
      loadLocalScript('js/ads-stability.js');
    }
  }, { once: true, passive: true });

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
