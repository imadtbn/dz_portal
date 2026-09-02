(() => {
  'use strict';

  if (window.__dzPortalSiteTagsLoaded) return;
  window.__dzPortalSiteTagsLoaded = true;

  const GTM_ID = 'GTM-NW3BWPF6';
  const GA4_MEASUREMENT_ID = 'G-K23WYKK60X';
  const ADSENSE_CLIENT = 'ca-pub-5656416032906373';
  const CLARITY_ID = 'tjk39ubxx1';

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
      const payload = {
        event: eventName,
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
        timestamp: Date.now(),
        ...eventParams,
      };
      window.dataLayer.push(payload);
    } catch (error) {
      console.warn('Analytics event tracking error:', error);
    }
  };
  window.dzTrackEvent = trackEvent;

  // يستخدم GTM هذا المعرّف لإرسال قياس GA4؛ لا ننشئ gtag.js أو config ثانياً هنا.
  window.__dzPortalTagConfig = Object.freeze({
    gtmId: GTM_ID,
    ga4MeasurementId: GA4_MEASUREMENT_ID,
    adsenseClient: ADSENSE_CLIENT,
    clarityId: CLARITY_ID,
    trackEvent,
  });

  const GTM_SRC = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  const CLARITY_SRC = `https://www.clarity.ms/tag/${CLARITY_ID}?ref=bwt`;
  const state = {
    gtmStarted: false,
    adsenseRequested: false,
    clarityRequested: false,
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
      window.dataLayer.push({
        'gtm.start': Date.now(),
        event: 'gtm.js',
        ga4_measurement_id: GA4_MEASUREMENT_ID,
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

  const initializeClarity = () => {
    if (state.clarityRequested) return;
    state.clarityRequested = true;
    window.clarity = window.clarity || function clarity(...args) {
      (window.clarity.q = window.clarity.q || []).push(args);
    };
    loadExternalScript(CLARITY_SRC);
  };

  // تتبع تلقائي ذكي للنقر على بطاقات الخدمات والروابط الحكومية الخارجية والتحميلات
  const initializeAutomaticTracking = () => {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;

      const rawHref = link.getAttribute('href') || '';
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) return;

      const card = link.closest('.service-item, .sector-card, .train-card, .promo-card, .video-card, .support-card, .contact-card');
      const title = card?.querySelector('h1, h2, h3, h4, h5, .service-title, strong')?.textContent?.trim()
        || link.textContent?.trim()
        || link.getAttribute('title')
        || link.getAttribute('aria-label')
        || '';

      // 1. روابط الاتصال (هاتف، بريد إلكتروني)
      if (rawHref.startsWith('tel:')) {
        trackEvent('contact_click', {
          contact_type: 'phone',
          contact_value: rawHref.replace('tel:', ''),
          item_title: title,
        });
        return;
      }
      if (rawHref.startsWith('mailto:')) {
        trackEvent('contact_click', {
          contact_type: 'email',
          contact_value: rawHref.replace('mailto:', ''),
          item_title: title,
        });
        return;
      }

      // 2. تحميل الملفات
      const fileExtensions = /\.(pdf|docx?|xlsx?|pptx?|apk|zip|rar|tar\.gz)$/i;
      const cleanPath = rawHref.split('?')[0].split('#')[0];
      if (fileExtensions.test(cleanPath)) {
        const ext = cleanPath.split('.').pop()?.toLowerCase();
        trackEvent('file_download', {
          file_name: cleanPath.split('/').pop(),
          file_extension: ext,
          link_url: rawHref,
          item_title: title,
        });
        return;
      }

      // 3. التحقق من الروابط الخارجية (خاصة البوابات الحكومية الجزائرية)
      try {
        const url = new URL(link.href, window.location.href);
        const isExternal = url.origin !== window.location.origin;

        if (isExternal) {
          const isGovDz = url.hostname.endsWith('.dz') || url.hostname.includes('.gov.dz') || url.hostname.includes('.mdn.dz');
          trackEvent('outbound_click', {
            destination_url: url.href,
            destination_host: url.hostname,
            is_government_dz: isGovDz,
            item_title: title,
            content_type: card ? 'service_card' : 'external_link',
          });
          // أيضاً إرسال حدث select_content للتوافق مع تقارير GA4
          trackEvent('select_content', {
            content_type: 'service',
            item_id: url.href,
            item_name: title,
          });
          return;
        }
      } catch (error) {
        // تجاهل أخطاء تحليل الروابط
      }

      // 4. النقر على البطاقات والخدمات الداخلية
      if (card) {
        trackEvent('select_content', {
          content_type: 'internal_service',
          item_name: title,
          item_url: rawHref,
        });
      }
    }, { capture: true, passive: true });
  };

  initializeGtm();
  initializeAutomaticTracking();

  window.addEventListener('load', () => {
    scheduleIdle(initializeAdsense, 4000);
    scheduleIdle(initializeClarity, 6000);
  }, { once: true, passive: true });
})();
