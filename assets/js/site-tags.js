(() => {
  'use strict';

  if (window.__dzPortalSiteTagsLoaded) return;
  window.__dzPortalSiteTagsLoaded = true;

  const GTM_ID = 'GTM-NW3BWPF6';
  const ADSENSE_CLIENT = 'ca-pub-5656416032906373';

  // تهيئة dataLayer وgtag القياسي لضمان وصول الأحداث بدقة إلى GA4 وGTM
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  /**
   * دالة موحدة لإرسال الأحداث التفاعلية إلى GA4 وGTM
   * @param {string} eventName - اسم الحدث القياسي في GA4
   * @param {Object} [eventParams={}] - معاملات الحدث التفصيلية
   */
  const trackEvent = (eventName, eventParams = {}) => {
    if (!eventName) return;
    try {
      const pageHeading = document.querySelector('.sector-hero h1, .sector-hero h2, main h1, h1')?.textContent?.trim() || '';
      const payload = {
        event: eventName,
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
        page_sector: pageHeading,
        site_language: 'ar',
        timestamp: Date.now(),
        ...eventParams,
      };
      window.dataLayer.push(payload);

      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, {
          ...eventParams,
          page_title: document.title,
          page_location: window.location.href,
        });
      }
    } catch (error) {
      console.warn('Analytics event tracking error:', error);
    }
  };
  window.dzTrackEvent = trackEvent;

  // تتم تهيئة GA4 مباشرة داخل head؛ يجب تعطيل أي وسم GA4 أو page_view داخل حاوية GTM.
  window.__dzPortalTagConfig = Object.freeze({
    gtmId: GTM_ID,
    adsenseClient: ADSENSE_CLIENT,
    trackEvent,
  });

  const GTM_SRC = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  const state = {
    gtmStarted: false,
    adsenseRequested: false,
    adsObserverStarted: false,
  };

  const findExternalScript = (src) => Array.from(document.scripts).find((script) => (
    script.dataset.dzExternalSrc === src || script.src === src
  ));

  const loadExternalScript = (src, { async = true, onload } = {}) => {
    const existing = findExternalScript(src);
    if (existing) {
      if (onload && existing.dataset.dzLoaded === 'true') onload();
      else if (onload) existing.addEventListener('load', onload, { once: true });
      return existing;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.dataset.dzExternalSrc = src;
    script.addEventListener('load', () => {
      script.dataset.dzLoaded = 'true';
      onload?.();
    }, { once: true });
    script.addEventListener('error', () => {
      console.warn('تعذر تحميل الخدمة الخارجية:', src);
    }, { once: true });
    document.head.appendChild(script);
    return script;
  };

  const scheduleIdle = (callback, timeout) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout });
    } else {
      window.setTimeout(callback, timeout);
    }
  };

  const initializeGtm = () => {
    if (!state.gtmStarted) {
      const pageHeading = document.querySelector('.sector-hero h1, .sector-hero h2, main h1, h1')?.textContent?.trim() || '';
      
      // تهيئة بدء GTM مع إرسال بيانات الصفحة بدقة عالية
      window.dataLayer.push({
        'gtm.start': Date.now(),
        event: 'gtm.js',
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
        page_sector: pageHeading,
        site_language: 'ar',
      });

      state.gtmStarted = true;
    }
    loadExternalScript(GTM_SRC);
  };

  const pushAds = () => {
    if (!window.adsbygoogle) window.adsbygoogle = [];

    document.querySelectorAll('ins.adsbygoogle').forEach((adBlock) => {
      if (
        adBlock.hasAttribute('data-adsbygoogle-status')
        || adBlock.hasAttribute('data-dz-ads-queued')
        || adBlock.children.length > 0
      ) return;

      adBlock.setAttribute('data-dz-ads-queued', 'true');
      try {
        window.adsbygoogle.push({});
      } catch (error) {
        adBlock.removeAttribute('data-dz-ads-queued');
        console.warn('تعذر تهيئة وحدة AdSense:', error);
      }
    });
  };

  const initializeAdsense = () => {
    if (state.adsenseRequested || !document.querySelector('ins.adsbygoogle')) return;
    state.adsenseRequested = true;
    loadExternalScript(ADSENSE_SRC, { onload: pushAds });

    if (!state.adsObserverStarted && 'MutationObserver' in window && document.body) {
      state.adsObserverStarted = true;
      const observer = new MutationObserver(pushAds);
      observer.observe(document.body, { childList: true, subtree: true });
    }
  };

  initializeGtm();

  window.addEventListener('load', () => {
    scheduleIdle(initializeAdsense, 4000);
  }, { once: true, passive: true });
})();
