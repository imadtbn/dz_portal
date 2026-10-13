/* Opt-in layout-shift diagnostics for the home page.
   Enabled only via ?cls-debug=1; no tracking, network requests or UI changes. */
(() => {
  'use strict';
  if (!('PerformanceObserver' in window)
      || !PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) return;

  const shifts = [];
  const sessions = [];
  let active = null;

  const describe = (node) => {
    if (!(node instanceof Element)) return '(unavailable)';
    if (node.id) return '#' + node.id;
    const tag = node.tagName.toLowerCase();
    const classes = [...node.classList].slice(0, 3).join('.');
    return classes ? tag + '.' + classes : tag;
  };

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.hadRecentInput) continue;
      const time = Math.round(entry.startTime);
      const sources = (entry.sources || []).map((source) => ({
        element: describe(source.node),
        previous: source.previousRect
          ? [Math.round(source.previousRect.x), Math.round(source.previousRect.y)]
          : null,
        current: source.currentRect
          ? [Math.round(source.currentRect.x), Math.round(source.currentRect.y)]
          : null
      }));
      shifts.push({ timeMs: time, value: entry.value, sources });

      // Core Web Vitals CLS: largest session window (5 s max, 1 s gap).
      if (!active || entry.startTime - active.last > 1000
          || entry.startTime - active.start > 5000) {
        active = { start: entry.startTime, last: entry.startTime, value: 0 };
        sessions.push(active);
      }
      active.value += entry.value;
      active.last = entry.startTime;
    }
  });

  observer.observe({ type: 'layout-shift', buffered: true });

  // Inspect the actual geometry instead of guessing which ancestor changed.
  const geometry = [];
  const mutations = [];
  const fontEvents = [];
  const selectors = [
    '#main-content', '#main-content > .hero', '#main-content > .quick-access',
    '#sectors', '#sectors > .section-header', '#sectors > .filter-actions',
    '#sectors > .sectors-grid', '#sectors > .ad-container',
    '#sectors .sector-card', '#sectors .sector-icon'
  ];
  const measure = (reason) => {
    const dimensions = [];
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      dimensions.push({
        selector,
        top: Math.round(rect.top + scrollY),
        height: Math.round(rect.height),
        width: Math.round(rect.width)
      });
    }
    geometry.push({ reason, timeMs: Math.round(performance.now()), dimensions });
    if (geometry.length > 40) geometry.shift();
  };
  const collectMutation = (record) => {
    if (mutations.length >= 60) return;
    if (record.type === 'attributes') {
      if (record.target.matches?.('#main-content, #sectors, .hero')) {
        mutations.push({
          timeMs: Math.round(performance.now()), type: 'style',
          element: describe(record.target),
          style: record.target.getAttribute('style') || ''
        });
      }
      return;
    }
    for (const node of record.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.matches?.('.google-auto-placed, ins.adsbygoogle, [id*="google_ads"], [class*="adsbygoogle"]')
        || node.querySelector?.('.google-auto-placed, ins.adsbygoogle, [id*="google_ads"]')) {
        mutations.push({ timeMs: Math.round(performance.now()),
          type: 'ad-inserted', element: describe(node),
          parent: describe(record.target) });
      }
    }
  };
  const startGeometry = () => {
    measure('DOMContentLoaded');
    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) collectMutation(record);
    });
    mutationObserver.observe(document.body, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['style']
    });
    for (const delay of [250, 1000, 2500, 5000]) {
      setTimeout(() => measure('+' + delay + 'ms'), delay);
    }
    window.addEventListener('load', () => measure('window.load'), { once: true });
    if (document.fonts) {
      const ready = () => measure('fonts.ready');
      document.fonts.ready.then(ready);
      document.fonts.addEventListener?.('loadingdone', (event) => {
        fontEvents.push({
          timeMs: Math.round(performance.now()),
          fonts: Array.from(event.fontfaces || [], (font) =>
            font.family + ' ' + font.weight).slice(0, 10)
        });
        measure('font loadingdone');
      });
    }
    document.querySelectorAll('#sectors .sector-icon img').forEach((img) => {
      if (img.complete) return;
      img.addEventListener('load', () => {
        if (geometry.length < 40) measure('sector image loaded');
      }, { once: true });
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGeometry, { once: true });
  } else startGeometry();

  window.__dzCLSReport = () => {
    const cls = sessions.reduce((maximum, session) => Math.max(maximum, session.value), 0);
    const previous = geometry[0]?.dimensions || [];
    const latest = geometry.at(-1)?.dimensions || [];
    const changed = latest.map((item) => {
      const initial = previous.find((record) => record.selector === item.selector);
      return {
        selector: item.selector,
        heightBefore: initial?.height ?? null,
        heightNow: item.height,
        deltaHeight: initial ? item.height - initial.height : null,
        deltaTop: initial ? item.top - initial.top : null
      };
    }).filter((item) => Math.abs(item.deltaHeight || 0) > 1
      || Math.abs(item.deltaTop || 0) > 1);
    const result = { cls, entries: shifts.length, shifts: shifts.slice(),
      sessions: sessions.slice(), geometry: geometry.slice(),
      dimensionsChanged: changed, adOrLayoutMutations: mutations.slice(),
      fontEvents: fontEvents.slice(), fontsStatus: document.fonts?.status };
    console.info('[DZ Portal CLS diagnostics]', 'CLS:', cls.toFixed(4),
      '| Entries:', shifts.length, '| use window.__dzCLSReport() again after scrolling');
    console.table(shifts.map(({ timeMs, value, sources }) => ({
      timeMs,
      shift: Number(value.toFixed(5)),
      elements: sources.map((source) => source.element).join(', ')
    })));
    if (changed.length) console.table(changed);
    if (mutations.length) console.table(mutations);
    return result;
  };
  console.info('[DZ Portal] CLS debug enabled. Run window.__dzCLSReport() in DevTools.');
})();
