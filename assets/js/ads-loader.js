/**
 * ==========================================================================
 * Google AdSense Smart Lazy Loader
 * Version : 1.0
 * Author  : DZ Portal
 * ==========================================================================
 */

(() => {
    'use strict';

    // ==========================
    // الإعدادات
    // ==========================
    const CONFIG = {

        // يبدأ تحميل الإعلان قبل ظهوره
        rootMargin: '600px',

        threshold: 0,

        // تفعيل رسائل Console أثناء التطوير فقط
        debug: false
    };


    /**
     * Console Logger
     */
    const log = (...args) => {
        if (CONFIG.debug) {
            console.log('[AdsLoader]', ...args);
        }
    };


    /**
     * تشغيل الإعلان
     */
    function loadAd(ad) {

        // تم تحميله سابقاً
        if (ad.dataset.adsLoaded === 'true') {
            return;
        }

        try {

            (adsbygoogle = window.adsbygoogle || []).push({});

            ad.dataset.adsLoaded = 'true';

            log('Loaded:', ad.dataset.adSlot || 'Unknown');

        } catch (err) {

            console.warn('AdSense Error:', err);

        }

    }


    /**
     * مراقبة الإعلانات
     */
    function observeAds() {

        const ads = document.querySelectorAll('.adsbygoogle');

        if (!ads.length) {

            log('No ads found.');

            return;

        }

        // المتصفحات القديمة
        if (!('IntersectionObserver' in window)) {

            ads.forEach(loadAd);

            return;

        }

        const observer = new IntersectionObserver((entries) => {

            entries.forEach(entry => {

                if (!entry.isIntersecting) return;

                loadAd(entry.target);

                observer.unobserve(entry.target);

            });

        }, {

            root: null,

            rootMargin: CONFIG.rootMargin,

            threshold: CONFIG.threshold

        });

        ads.forEach(ad => observer.observe(ad));

    }


    /**
     * بدء التشغيل عندما تصبح الصفحة هادئة
     */
    function start() {

        if ('requestIdleCallback' in window) {

            requestIdleCallback(observeAds, {
                timeout: 3000
            });

        } else {

            setTimeout(observeAds, 300);

        }

    }


    /**
     * انتظار تحميل الصفحة
     */
    if (document.readyState === 'loading') {

        window.addEventListener('load', start, {
            once: true
        });

    } else {

        start();

    }

})();