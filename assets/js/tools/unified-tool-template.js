/* Unified template for every DZ Portal tool page. Keeps tool-specific forms and scripts intact. */
(function () {
  'use strict';
  if (window.__dzUnifiedToolTemplate) return;
  window.__dzUnifiedToolTemplate = true;
  const ROOT = 'https://imadtbn.github.io/dz_portal/';
  const ASSETS = ROOT + 'assets/';
  const addCss = href => {
    if ([...document.querySelectorAll('link[rel="stylesheet"]')].some(l => l.href === href)) return;
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href; document.head.appendChild(link);
  };
  addCss(ASSETS + 'css/tools/unified-tool-template.css');
  addCss(ASSETS + 'css/dz-share.css');

  function buildHeader() {
    if (document.querySelector('.dz-unified-header')) return;
    document.querySelectorAll('body > header:not(.dz-unified-header)').forEach(el => el.remove());
    const header = document.createElement('header');
    header.className = 'dz-unified-header';
    header.innerHTML = '<div class="dz-unified-header-inner"><a class="dz-unified-brand" href="' + ROOT + '" aria-label="الرئيسية - البوابة الجزائرية للخدمات الرقمية"><img src="' + ASSETS + 'images/icon.png" width="40" height="40" alt=""><span><strong>البوابة الجزائرية</strong><small>للخدمات الرقمية</small></span></a><nav class="dz-unified-nav" aria-label="التنقل الرئيسي"><a href="' + ROOT + '">الرئيسية</a><a href="' + ROOT + 'pages/tools/index.html" aria-current="page">الأدوات الرقمية</a></nav><button class="dz-unified-menu" type="button" aria-expanded="false" aria-label="فتح قائمة التنقل">القائمة</button></div>';
    document.body.insertBefore(header, document.body.firstChild);
    const menu = header.querySelector('.dz-unified-menu');
    const nav = header.querySelector('.dz-unified-nav');
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      menu.setAttribute('aria-expanded', String(open));
    });
  }
  function buildHero() {
    const selectors = ['.dz-unified-hero','.age-hero','.bm-hero','.tool-hero','.page-intro','.page-hero','.section-hero','.hero','.tool-intro','.health-tool-hero'];
    let hero = null;
    for (const selector of selectors) {
      hero = [...document.querySelectorAll(selector)].find(el => el.querySelector('h1') && !el.closest('footer'));
      if (hero) break;
    }
    const main = document.querySelector('main') || document.body;
    const title = document.querySelector('main h1, h1');
    if (!hero && title) hero = title.closest('section') || title.parentElement;
    if (!hero) return;
    hero.classList.add('dz-unified-hero');
    const h1 = hero.querySelector('h1');
    if (h1) h1.classList.add('dz-unified-title');
    let crumbs = hero.querySelector('nav[aria-label*="تنقل"],nav[aria-label*="breadcrumb"],.tool-breadcrumb,.page-breadcrumb,.age-breadcrumb');
    if (!crumbs) {
      crumbs = document.createElement('nav');
      crumbs.className = 'dz-unified-breadcrumb';
      crumbs.setAttribute('aria-label', 'مسار التنقل');
      crumbs.innerHTML = '<a href="' + ROOT + '">الرئيسية</a><span aria-hidden="true">‹</span><a href="' + ROOT + 'pages/tools/index.html">الأدوات الرقمية</a><span aria-hidden="true">‹</span><span aria-current="page"></span>';
      crumbs.lastElementChild.textContent = h1 ? h1.textContent.trim() : document.title;
      hero.appendChild(crumbs);
    } else {
      crumbs.classList.add('dz-unified-breadcrumb');
      crumbs.querySelectorAll('a').forEach(a => {
        const label = a.textContent.trim();
        if (/الرئيسية|home/i.test(label)) a.href = ROOT;
        else if (/أدوات|التصنيفات|جميع الأدوات|tools|الصحة/i.test(label)) a.href = ROOT + 'pages/tools/index.html';
      });
      if (!crumbs.querySelector('[aria-current="page"]')) {
        const current = document.createElement('span');
        current.setAttribute('aria-current','page');
        current.textContent = h1 ? h1.textContent.trim() : document.title;
        crumbs.appendChild(current);
      }
    }
    if (main && !main.contains(hero)) main.insertBefore(hero, main.firstChild);
    const shareSlot = document.querySelector('.dz-share-slot');
    if (shareSlot && !hero.contains(shareSlot)) {
      shareSlot.classList.add('dz-share-in-hero');
      hero.appendChild(shareSlot);
    }
    const topAd = document.querySelector('body > .dz-import-ad, body > .ad-container.dz-import-ad');
    if (topAd && topAd !== hero && !hero.contains(topAd)) {
      const share = hero.querySelector('.dz-share-slot');
      hero.after(topAd);
    }
  }
  function buildToolAds() {
    const main = document.querySelector('main') || document.body;
    const hero = document.querySelector('.dz-unified-hero');
    const footer = document.querySelector('.dz-unified-footer');
    if (!main || !hero || !footer) return;

    const makeAd = (placement, slot, format, layoutKey) => {
      const existing = document.querySelector('.dz-tool-ad[data-dz-placement="' + placement + '"]');
      if (existing) return existing;
      const wrap = document.createElement('section');
      wrap.className = 'ad-container dz-tool-ad dz-tool-ad-' + placement;
      wrap.dataset.dzPlacement = placement;
      wrap.setAttribute('aria-label', 'إعلان');
      wrap.innerHTML = '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-5656416032906373" data-ad-slot="' + slot + '" data-ad-format="' + format + '"' +
        (layoutKey ? ' data-ad-layout-key="' + layoutKey + '"' : '') +
        (format === 'auto' ? ' data-full-width-responsive="true"' : '') + '></ins>';
      return wrap;
    };

    const topAd = makeAd('top', '7867079394', 'fluid', '-fr+57+4a-dc+8g');
    if (!topAd.isConnected) hero.insertAdjacentElement('afterend', topAd);

    const bottomAd = makeAd('bottom', '3143411927', 'auto', '');
    if (!bottomAd.isConnected) footer.parentNode.insertBefore(bottomAd, footer);

    // Reuse the portal's width-aware ad controller; it prevents requests from
    // narrow/hidden containers and observes dynamically inserted units.
    const stabilitySrc = ROOT + 'assets/js/ads-stability.js';
    if (!document.querySelector('script[data-dz-tool-ads-stability]') &&
        !document.querySelector('script[src="' + stabilitySrc + '"]')) {
      const controller = document.createElement('script');
      controller.src = stabilitySrc;
      controller.async = false;
      controller.dataset.dzToolAdsStability = 'true';
      document.head.appendChild(controller);
    }
    const adsSrc = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5656416032906373';
    if (!document.querySelector('script[src="' + adsSrc + '"]') &&
        !document.querySelector('script[data-dz-external-src="' + adsSrc + '"]')) {
      const script = document.createElement('script');
      script.src = adsSrc;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.dzExternalSrc = adsSrc;
      document.head.appendChild(script);
    }
  }
  function buildFooter() {
    document.querySelectorAll('body > footer, main footer').forEach(el => el.remove());
    const footer = document.createElement('footer');
    footer.className = 'dz-unified-footer';
    footer.innerHTML = '<div class="dz-unified-footer-inner"><div class="dz-unified-footer-brand"><img src="' + ASSETS + 'images/icon.png" width="34" height="34" alt=""><span><strong>البوابة الجزائرية</strong><small>للخدمات الرقمية</small></span></div><nav aria-label="روابط التذييل"><a href="' + ROOT + '">الرئيسية</a><a href="' + ROOT + 'pages/tools/index.html">الأدوات الرقمية</a><a href="' + ROOT + 'pages/privacy.html">سياسة الخصوصية</a><a href="' + ROOT + 'pages/contact.html">اتصل بنا</a></nav><p>© ' + new Date().getFullYear() + ' البوابة الجزائرية للخدمات الرقمية. جميع الحقوق محفوظة.</p></div>';
    document.body.appendChild(footer);
  }
  function normalizeLegacyControls() {
    document.getElementById('share-help-tools')?.remove();
    document.getElementById('share-help-tools-styles')?.remove();
    document.querySelectorAll('.share-help-tools__share,.share-help-tools__help,.share-fab,.floating-share,.social-share,.share-widget,.share-container').forEach(el => {
      if (!el.closest('.dz-share-slot,.qibla-share-row')) el.remove();
    });
    document.querySelectorAll('button,a,[role="button"]').forEach(el => {
      if (el.closest('.dz-share-slot,.qibla-share-row,.dz-unified-header,.dz-unified-footer')) return;
      const text = [el.getAttribute('aria-label'),el.getAttribute('title'),el.getAttribute('data-tooltip'),el.innerText,el.textContent].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
      const cls = typeof el.className === 'string' ? el.className : '';
      const shareClass = /(?:^|\s)(?:share|share-btn|share-button|share-fab|floating-share|social-share-button|share-help-tools__share)(?:\s|$)/i.test(cls);
      const helpClass = /(?:^|\s)(?:help-btn|help-button|question-btn|question-button|share-help-tools__help)(?:\s|$)/i.test(cls);
      const shareText = /مشاركة الصفحة|مشاركة هذه الصفحة|share this page|share page/i.test(text);
      const helpText = /مساعدة حول الصفحة|مساعدة حول الأداة|share help|help button/i.test(text) || /^[?؟]$/.test(text);
      if (shareClass || helpClass || shareText || helpText) {
        const wrapper = el.closest('button,a,[role="button"]') || el;
        if (!wrapper.closest('.dz-share-slot,.qibla-share-row')) wrapper.remove();
      }
    });
  }
  function init() {
    document.body.classList.add('dz-unified-tool-page');
    buildHeader();
    buildHero();
    buildFooter();
    buildToolAds();
    normalizeLegacyControls();
    const observer = new MutationObserver(() => {
      if (document.getElementById('share-help-tools') || document.querySelector('.share-help-tools__share,.share-help-tools__help')) {
        document.getElementById('share-help-tools')?.remove();
        document.getElementById('share-help-tools-styles')?.remove();
      }
      normalizeLegacyControls();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();