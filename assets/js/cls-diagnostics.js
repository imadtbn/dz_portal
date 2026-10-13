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
  window.__dzCLSReport = () => {
    const cls = sessions.reduce((maximum, session) => Math.max(maximum, session.value), 0);
    const result = { cls, entries: shifts.length, shifts: shifts.slice(), sessions: sessions.slice() };
    console.info('[DZ Portal CLS diagnostics]', 'CLS:', cls.toFixed(4),
      '| Entries:', shifts.length, '| use window.__dzCLSReport() again after scrolling');
    console.table(shifts.map(({ timeMs, value, sources }) => ({
      timeMs,
      shift: Number(value.toFixed(5)),
      elements: sources.map((source) => source.element).join(', ')
    })));
    return result;
  };
  console.info('[DZ Portal] CLS debug enabled. Run window.__dzCLSReport() in DevTools.');
})();
