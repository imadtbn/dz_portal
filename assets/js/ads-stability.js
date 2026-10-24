/* CWV stage 02: unobtrusive AdSense unit initialization.
   Only controls when the site's EXISTING in-page ad units are queued.
   It never changes slots, ad clients, ad formats or placement. */
(() => {
  'use strict';

  if (window.__dzAdsStability?.started) return;

  const MIN_AVAILABLE_WIDTH = 220; // Base safeguard for automatic display units.
  const MIN_IN_FEED_WIDTH = 250; // Google's published minimum for in-feed ads.
  const state = {
    started: true,
    queued: 0,
    skippedForWidth: 0,
    lastError: '',
  };
  window.__dzAdsStability = state;

  let scheduled = false;
  let running = false;
  const watchers = new WeakSet();

  function isExcludedPlacement(slot) {
    // Manual ads belong in the document content, never in structural navigation.
    const structural = slot.closest('header, nav, .header, .site-header, .main-nav, #main-nav, #mainnav, .mainnav, .hero, .sector-hero, .home-hero, [role="banner"], [role="navigation"]');
    if (!structural) return false;
    slot.setAttribute('data-dz-ad-excluded', 'structural-placement');
    return true;
  }

  function isAlreadyHandled(slot) {
    return slot.hasAttribute('data-adsbygoogle-status')
      || slot.hasAttribute('data-dz-ads-queued')
      || slot.hasAttribute('data-dz-ad-requested')
      || isExcludedPlacement(slot);
  }

  function widthOf(slot) {
    const parent = slot.closest('.ad-container') || slot.parentElement;
    if (!parent || !slot.getClientRects().length) return 0;
    if (getComputedStyle(slot).display === 'none') return 0;
    const parentWidth = parent.getBoundingClientRect().width;
    const slotWidth = slot.getBoundingClientRect().width;
    return Math.floor(Math.min(parentWidth, slotWidth));
  }

  function requestNext() {
    if (running) return;
    running = true;
    try {
      // AdSense assigns push({}) to the next available <ins>. Queue in DOM
      // order to avoid initializing the wrong slot when an earlier one is hidden.
      const unhandled = Array.from(document.querySelectorAll('ins.adsbygoogle'))
        .filter((slot) => !isAlreadyHandled(slot));
      const slot = unhandled[0];
      if (!slot) return;

      const availableWidth = widthOf(slot);
      const minWidth = slot.dataset.adFormat === 'fluid' || slot.dataset.adFormat === 'autorelaxed'
        ? MIN_IN_FEED_WIDTH : MIN_AVAILABLE_WIDTH;
      if (availableWidth < minWidth) {
        state.skippedForWidth += 1;
        return; // Retry on resize or a DOM/layout change; no permanent lock.
      }

      window.adsbygoogle = window.adsbygoogle || [];
      slot.setAttribute('data-dz-ad-requested', 'true');
      slot.setAttribute('data-dz-ads-queued', 'true');
      try {
        window.adsbygoogle.push({});
        state.queued += 1;
      } catch (error) {
        slot.removeAttribute('data-dz-ad-requested');
        slot.removeAttribute('data-dz-ads-queued');
        state.lastError = String(error);
        console.warn('DZ Portal: AdSense unit was not queued:', error);
        return;
      }
      // Briefly pace many units, but do not require scrolling or interactions.
      window.setTimeout(schedule, 120);
    } finally {
      running = false;
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      requestNext();
    });
  }

  function watchSizes() {
    if (typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver(schedule);
    document.querySelectorAll('ins.adsbygoogle').forEach((slot) => {
      const parent = slot.closest('.ad-container') || slot.parentElement;
      if (parent && !watchers.has(parent)) {
        watchers.add(parent);
        observer.observe(parent);
      }
    });
    // Newly added ads are covered by DOM mutation events / window resize.
    state.observeNewContainer = (parent) => {
      if (parent && !watchers.has(parent)) {
        watchers.add(parent);
        observer.observe(parent);
      }
    };
  }

  function start() {
    const slots = Array.from(document.querySelectorAll('ins.adsbygoogle'));
    if (!slots.length) return;

    // Existing pages have one classic inline push near </body>.
    // Preserve that initialization instead of queueing its first slot twice.
    // Pages migrated to this controller have no legacy push to account for.
    const queue = window.adsbygoogle;
    if (Array.isArray(queue) && queue.length) {
      // A loaded AdSense library may retain already-consumed commands in its
      // queue. Do not reserve additional slots for those completed requests.
      const completed = slots.filter((slot) => slot.hasAttribute('data-adsbygoogle-status')).length;
      let toAccountFor = Math.min(Math.max(0, queue.length - completed), slots.length);
      for (const slot of slots) {
        if (!toAccountFor) break;
        if (!isAlreadyHandled(slot)) {
          slot.setAttribute('data-dz-ad-requested', 'legacy');
          slot.setAttribute('data-dz-ads-queued', 'true');
          toAccountFor -= 1;
        }
      }
    }

    watchSizes();
    const mo = new MutationObserver((changes) => {
      let foundNewAd = false;
      for (const change of changes) {
        for (const node of change.addedNodes) {
          if (node.nodeType !== 1) continue;
          const ad = node.matches?.('ins.adsbygoogle')
            ? node : node.querySelector?.('ins.adsbygoogle');
          if (ad) {
            const parent = ad.closest('.ad-container') || ad.parentElement;
            state.observeNewContainer?.(parent);
            foundNewAd = true;
          }
        }
      }
      if (foundNewAd) schedule();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', schedule, { passive: true });
    // Also retry slots inside content-visibility:auto sections as users scroll.
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('pageshow', schedule, { passive: true });
    schedule();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
