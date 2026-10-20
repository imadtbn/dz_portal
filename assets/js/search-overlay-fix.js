/* Keep floating help/tooltip panels readable when they overlap the homepage search field. */
(() => {
  const search = () => document.querySelector('#main-content > .hero .search-box-wrapper');
  const ignored = el => !el || el === document.body || el === document.documentElement ||
    el.closest('.search-container') || /^(INPUT|BUTTON|TEXTAREA|SELECT|OPTION|SVG|PATH|I)$/.test(el.tagName);

  function fixOverlays() {
    const field = search();
    if (!field) return;
    const sr = field.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    document.querySelectorAll('body *').forEach(el => {
      if (ignored(el) || !el.textContent?.trim()) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || r.width > Math.min(vw * .92, 440) || r.height > 260) return;
      const style = getComputedStyle(el);
      if (!['absolute', 'fixed', 'sticky'].includes(style.position)) return;
      const visible = style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
      const overlaps = r.left < sr.right && r.right > sr.left && r.top < sr.bottom && r.bottom > sr.top;
      if (!visible || !overlaps) {
        if (el.dataset.searchOverlapFixed === '1') {
          ['position','top','left','right','bottom','transform','width','max-width','max-height','overflow-y','z-index','box-sizing'].forEach(k => el.style.removeProperty(k));
          delete el.dataset.searchOverlapFixed;
        }
        return;
      }
      // Prefer the space immediately below the search field; use above only when necessary.
      const below = vh - sr.bottom - 16;
      const above = sr.top - 16;
      const placeBelow = below >= Math.min(r.height, 100) || below >= above;
      const maxH = Math.max(80, Math.min(260, (placeBelow ? below : above) - 8));
      const width = Math.min(Math.max(r.width, 220), vw - 24, 440);
      const left = Math.max(12, Math.min(vw - width - 12, (vw - width) / 2));
      Object.assign(el.style, {
        position: 'fixed',
        top: placeBelow ? (sr.bottom + 10) + 'px' : 'auto',
        bottom: placeBelow ? 'auto' : (vh - sr.top + 10) + 'px',
        left: left + 'px',
        right: 'auto',
        transform: 'none',
        width: width + 'px',
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: maxH + 'px',
        overflowY: 'auto',
        zIndex: '20000',
        boxSizing: 'border-box'
      });
      el.dataset.searchOverlapFixed = '1';
    });
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fixOverlays(); });
  };
  document.addEventListener('click', schedule, true);
  document.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule, { passive: true });
  new MutationObserver(schedule).observe(document.body, {
    subtree: true, childList: true, attributes: true,
    attributeFilter: ['class', 'style', 'aria-hidden', 'hidden']
  });
  document.addEventListener('DOMContentLoaded', schedule);
  schedule();
})();