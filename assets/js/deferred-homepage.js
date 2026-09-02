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

  // ==========================================
  // محرك التتبع الذكي للأحداث والتحويلات والنقرات
  // ==========================================
  const trackEvent = (eventName, params = {}) => {
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
        ...params,
      };

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(payload);

      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, {
          ...params,
          page_title: document.title,
          page_location: window.location.href,
        });
      }
    } catch (error) {
      console.warn('Deferred analytics tracking error:', error);
    }
  };

  // إتاحة دالة التتبع عالمياً
  if (!window.dzTrackEvent) {
    window.dzTrackEvent = trackEvent;
  }

  // 1. تتبع البحث التفاعلي والتحميل المؤجل لبيانات البحث
  const searchInput = document.getElementById('globalSearch') || document.querySelector('.search-input');
  let searchRequested = false;
  let searchDebounceTimer = null;

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
    
    // تتبع استعلامات البحث عند الكتابة (مع تأخير لتجنب إرسال كل حرف)
    searchInput.addEventListener('input', (event) => {
      loadSearch();
      const query = event.target.value?.trim() || '';
      clearTimeout(searchDebounceTimer);
      if (query.length >= 2) {
        searchDebounceTimer = setTimeout(() => {
          trackEvent('search', {
            search_term: query,
            search_type: 'live_input',
            query_length: query.length,
          });
        }, 600);
      }
    }, { passive: true });

    // تتبع تأكيد البحث عبر زر الإدخال Enter
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const query = searchInput.value?.trim() || '';
        if (query) {
          trackEvent('search', {
            search_term: query,
            search_type: 'enter_submit',
            query_length: query.length,
          });
        }
      }
    }, { passive: true });
  }

  // تفعيل البحث عند النقر على أيقونات أو أزرار فتح البحث
  document.querySelectorAll('.search-trigger, [data-search-trigger]').forEach((trigger) => {
    trigger.addEventListener('click', () => loadSearch(), { once: true, passive: true });
  });

  // 2. التتبع التلقائي للنقرات والتحويلات والتفاعل مع العناصر
  const initializeAutoTracking = () => {
    if (window.__dzAutoTrackingBound) return;
    window.__dzAutoTrackingBound = true;

    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      const button = event.target.closest('button');

      // أ) معالجة نقرات الروابط
      if (link) {
        const rawHref = link.getAttribute('href') || '';
        if (!rawHref || rawHref.startsWith('javascript:')) return;

        // استخراج بطاقة المحتوى والعنوان المرافق
        const card = link.closest('.service-item, .sector-card, .train-card, .promo-card, .video-card, .support-card, .contact-card, .section-card, .quick-link-card, .stat-card');
        const title = card?.querySelector('h1, h2, h3, h4, h5, .service-title, .sector-title, strong')?.textContent?.trim()
          || link.textContent?.trim()
          || link.getAttribute('title')
          || link.getAttribute('aria-label')
          || '';

        // أ-1: نقرات الاتصال المباشر (هاتف، بريد إلكتروني) -> تحويل أساسي
        if (rawHref.startsWith('tel:')) {
          const phoneNumber = rawHref.replace('tel:', '').trim();
          trackEvent('contact_click', {
            contact_type: 'phone',
            contact_value: phoneNumber,
            item_title: title,
          });
          trackEvent('conversion', {
            conversion_type: 'phone_call',
            contact_value: phoneNumber,
            item_title: title,
          });
          return;
        }

        if (rawHref.startsWith('mailto:')) {
          const email = rawHref.replace('mailto:', '').trim();
          trackEvent('contact_click', {
            contact_type: 'email',
            contact_value: email,
            item_title: title,
          });
          trackEvent('conversion', {
            conversion_type: 'email_contact',
            contact_value: email,
            item_title: title,
          });
          return;
        }

        // أ-2: تحميل الملفات والوثائق الرسمية (PDF, APK, DOCX...) -> تحويل
        const fileExtensions = /\.(pdf|docx?|xlsx?|pptx?|apk|zip|rar|tar\.gz)$/i;
        const cleanPath = rawHref.split('?')[0].split('#')[0];
        if (fileExtensions.test(cleanPath)) {
          const ext = cleanPath.split('.').pop()?.toLowerCase();
          const fileName = cleanPath.split('/').pop() || '';
          trackEvent('file_download', {
            file_name: fileName,
            file_extension: ext,
            link_url: rawHref,
            item_title: title,
          });
          if (ext === 'apk') {
            trackEvent('conversion', {
              conversion_type: 'app_apk_download',
              file_name: fileName,
              item_title: title,
            });
          }
          return;
        }

        // أ-3: نقرات نتائج البحث
        const searchResultItem = link.closest('.search-item, .search-result-item, [data-search-result]');
        if (searchResultItem) {
          trackEvent('select_search_result', {
            item_title: title,
            destination_url: rawHref,
            search_term: searchInput?.value?.trim() || '',
          });
        }

        // أ-4: الروابط الخارجية (خاصة البوابات والمنصات الحكومية الجزائرية) -> تحويل رئيسي
        try {
          const url = new URL(link.href, window.location.href);
          const isExternal = url.origin !== window.location.origin;

          if (isExternal) {
            const isGovDz = url.hostname.endsWith('.dz')
              || url.hostname.includes('.gov.dz')
              || url.hostname.includes('.mdn.dz')
              || url.hostname.includes('aadl')
              || url.hostname.includes('sonelgaz')
              || url.hostname.includes('poste')
              || url.hostname.includes('algerietelecom');

            const isGooglePlay = url.hostname.includes('play.google.com');

            trackEvent('outbound_click', {
              destination_url: url.href,
              destination_host: url.hostname,
              is_government_dz: isGovDz,
              item_title: title,
              content_type: card ? 'service_card' : 'external_link',
            });

            trackEvent('select_content', {
              content_type: 'external_service',
              item_id: url.href,
              item_name: title,
            });

            // تسجيل تحويل الوصول للخدمات الحكومية
            if (isGovDz) {
              trackEvent('conversion', {
                conversion_type: 'gov_portal_access',
                destination_host: url.hostname,
                destination_url: url.href,
                service_name: title,
              });
            }

            // تسجيل تحويل تحميل التطبيق من متجر Google Play
            if (isGooglePlay) {
              trackEvent('conversion', {
                conversion_type: 'play_store_download',
                destination_url: url.href,
                item_title: title,
              });
            }
            return;
          }
        } catch (e) {
          // تجاهل أخطاء تحليل الروابط
        }

        // أ-5: تتبع الأدلة المصورة وإجراءات الخدمات (Process & Video Guides)
        if (rawHref.includes('pages/process/') || rawHref.includes('pages/video/') || rawHref.includes('guide.html')) {
          trackEvent('view_guide', {
            guide_title: title,
            guide_url: rawHref,
            content_type: rawHref.includes('video') ? 'video_guide' : 'step_guide',
          });
        }

        // أ-6: النقر على بطاقات وقطاعات الخدمات الداخلية
        if (card) {
          trackEvent('select_content', {
            content_type: 'internal_service',
            item_name: title,
            item_url: rawHref,
          });
        }
      }

      // ب) معالجة نقرات الأزرار التفاعلية (تبويبات، فلاتر، نسخ، تنقل)
      if (button) {
        const btnText = button.textContent?.trim() || button.getAttribute('aria-label') || button.title || '';
        
        // أزرار الفلترة وتصنيف القطاعات
        if (button.matches('.tab-btn, .filter-btn, .category-chip, [data-filter]')) {
          trackEvent('filter_applied', {
            filter_label: btnText,
            filter_value: button.dataset.filter || btnText,
          });
        }

        // أزرار المشاركة والنسخ
        if (button.matches('.share-btn, .copy-btn, [data-action="copy"], [data-action="share"]')) {
          trackEvent('share_or_copy', {
            action_type: button.matches('.copy-btn, [data-action="copy"]') ? 'copy' : 'share',
            button_label: btnText,
          });
        }

        // زر الصعود للأعلى
        if (button.matches('.fab, [onclick*="scrollToTop"]')) {
          trackEvent('scroll_to_top_click');
        }
      }
    }, { capture: true, passive: true });
  };

  // 3. تتبع عمق التمرير (Scroll Depth Milestones)
  const initializeScrollTracking = () => {
    const scrollMilestones = [25, 50, 75, 90];
    const reachedMilestones = new Set();

    let scrollTick = false;
    window.addEventListener('scroll', () => {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(() => {
        scrollTick = false;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight <= 0) return;
        const currentScrollPercent = Math.round((window.scrollY / totalHeight) * 100);

        scrollMilestones.forEach((milestone) => {
          if (currentScrollPercent >= milestone && !reachedMilestones.has(milestone)) {
            reachedMilestones.add(milestone);
            trackEvent('scroll_milestone', {
              percent_scrolled: milestone,
            });
          }
        });
      });
    }, { passive: true });
  };

  // 4. تتبع مدة التفاعل الفعال في الصفحة (User Engagement Milestones)
  const initializeEngagementTracking = () => {
    const engagementTimes = [15, 45, 90, 180];
    let secondsActive = 0;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        secondsActive += 5;
        if (engagementTimes.includes(secondsActive)) {
          trackEvent('user_engagement', {
            engagement_time_sec: secondsActive,
          });
        }
        if (secondsActive >= 300) {
          clearInterval(interval);
        }
      }
    }, 5000);
  };

  // تهيئة التتبع فور جاهزية DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeAutoTracking();
      initializeScrollTracking();
      initializeEngagementTracking();
    }, { once: true });
  } else {
    initializeAutoTracking();
    initializeScrollTracking();
    initializeEngagementTracking();
  }

  // 5. جدولة السكربتات المؤجلة للصفحة الرئيسية
  window.addEventListener('load', () => {
    scheduleIdle(() => loadLocalScript('js/homepageStats.js'), 2500);
    scheduleIdle(() => loadLocalScript('js/siteRating.js'), 3500);
  }, { once: true, passive: true });
})();

