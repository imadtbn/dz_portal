/**
 * DZ Portal mobile CLS audit (developer-only, not loaded by the website).
 * Run: npm install && npx playwright install chromium && npm run audit
 * Optional: npm run audit -- --all-widths --compare-ads
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const paths = [
  '',
  'sectors/education.html',
  'sectors/awlyaa-education.html',
  'sectors/progres.mesrs.html',
  'pages/process/awlyaa-process.html'
];
const args = process.argv.slice(2);
const widths = args.includes('--all-widths') ? [360, 390, 412] : [390];
const modes = args.includes('--compare-ads') ? ['normal', 'ads-blocked'] : ['normal'];
const filterArg = args.find((value) => value.startsWith('--page='));
const selected = filterArg ? paths.filter((p) => p.includes(filterArg.slice(7))) : paths;
if (!selected.length) {
  console.error('No page matches --page filter.');
  process.exit(1);
}
const root = new URL(process.env.CLS_BASE_URL || 'https://imadtbn.github.io/dz_portal/');
if (!root.pathname.endsWith('/')) root.pathname += '/';
const output = path.resolve(process.cwd(), 'cls-audit-output');
await fs.mkdir(output, { recursive: true });

function clsSessionScore(shifts) {
  const valid = shifts.filter((s) => !s.hadRecentInput).sort((a, b) => a.time - b.time);
  let start = 0, previous = -Infinity, total = 0, maximum = 0;
  for (const entry of valid) {
    if (entry.time - previous > 1000 || entry.time - start > 5000) {
      start = entry.time;
      total = 0;
    }
    total += entry.value;
    maximum = Math.max(maximum, total);
    previous = entry.time;
  }
  return Number(maximum.toFixed(4));
}

function compactPageName(p) {
  return (p || 'home').replaceAll('/', '-').replace(/\.html$/, '');
}

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const relativePath of selected) {
    for (const width of widths) {
      for (const mode of modes) {
        const label = compactPageName(relativePath) + '-' + width + '-' + mode;
        const folder = path.join(output, label);
        await fs.mkdir(folder, { recursive: true });
        const context = await browser.newContext({
          viewport: { width, height: 780 },
          deviceScaleFactor: 2,
          isMobile: true,
          hasTouch: true,
          locale: 'ar-DZ'
        });
        if (mode === 'ads-blocked') {
          await context.route(/(?:pagead2\.googlesyndication\.com|googleads\.g\.doubleclick\.net|yandex\.ru\/ads)/, (route) => route.abort());
        }
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (err) => errors.push(String(err).slice(0, 250)));
        await page.addInitScript(() => {
          window.__clsAuditShifts = [];
          function describe(node) {
            if (!node || node.nodeType !== 1) return '(unknown)';
            if (node.id) return '#' + CSS.escape(node.id);
            const classes = Array.from(node.classList || []).slice(0, 3).map((c) => '.' + CSS.escape(c)).join('');
            return node.tagName.toLowerCase() + classes;
          }
          try {
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                window.__clsAuditShifts.push({
                  time: Number(entry.startTime.toFixed(1)),
                  value: Number(entry.value.toFixed(5)),
                  hadRecentInput: entry.hadRecentInput,
                  sources: Array.from(entry.sources || []).slice(0, 5).map((s) => ({
                    element: describe(s.node),
                    before: s.previousRect ? { x: s.previousRect.x, y: s.previousRect.y, w: s.previousRect.width, h: s.previousRect.height } : null,
                    after: s.currentRect ? { x: s.currentRect.x, y: s.currentRect.y, w: s.currentRect.width, h: s.currentRect.height } : null
                  }))
                });
              }
            }).observe({ type: 'layout-shift', buffered: true });
          } catch (err) {
            window.__clsAuditError = String(err);
          }
        });

        const url = new URL(relativePath, root).href;
        console.log('Auditing', label, url);
        const item = { url, viewport: width, mode, label };
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
          const snap = () => page.evaluate(() => {
            const selectors = ['.ad-container', '.header', '.header-content', '.logo-section', '.sector-hero', '.hero', '.hero-content', '.hero-visual', '.hero-icon', '.hero-stats', '.stats-bar', '.sectors-section', '.sectors-grid', '.sector-card', '.services-grid', '.service-item', '.train-card', '.notice-image', '.notice-image img', '.video-watch-player', '.video-watch-player iframe', '.seo-tags', '.stats-panel', '.footer', '.pwa-badge'];
            const output = {};
            for (const selector of selectors) {
              output[selector] = Array.from(document.querySelectorAll(selector)).slice(0, 30).map((el, i) => {
                const rect = el.getBoundingClientRect();
                const computed = getComputedStyle(el);
                return { index: i, y: Math.round(rect.y + scrollY), height: Math.round(rect.height), width: Math.round(rect.width), minHeight: computed.minHeight, contentVisibility: computed.contentVisibility, containIntrinsicSize: computed.containIntrinsicSize };
              });
            }
            return output;
          });
          item.atDOMContentLoaded = await snap();
          await page.screenshot({ path: path.join(folder, '01-initial.png') });
          await page.waitForTimeout(5000);
          item.afterLoad = await snap();
          await page.screenshot({ path: path.join(folder, '02-settled.png') });
          for (const fraction of [0.25, 0.5, 0.75, 1]) {
            await page.evaluate((value) => {
              const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
              scrollTo(0, Math.round(maxScroll * value));
            }, fraction);
            await page.waitForTimeout(1100);
          }
          await page.evaluate(() => scrollTo(0, 0));
          await page.waitForTimeout(1300);
          const collected = await page.evaluate(() => ({
            shifts: window.__clsAuditShifts || [],
            observerError: window.__clsAuditError || null
          }));
          item.shifts = collected.shifts;
          item.observerError = collected.observerError;
          item.cls = clsSessionScore(collected.shifts);
          item.topShifts = collected.shifts.filter((s) => !s.hadRecentInput).sort((a, b) => b.value - a.value).slice(0, 8);
          item.pageErrors = errors.slice(0, 20);
          // CWV stage 05: capture stylesheets, scripts and font readiness so
          // cache/style-loading regressions can be investigated per viewport.
          item.loadAudit = await page.evaluate(() => ({
            fontStatus: document.fonts?.status || 'unsupported',
            fontFamily: getComputedStyle(document.body).fontFamily,
            cssLinks: Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
              .map((link) => link.href),
            jsScripts: Array.from(document.querySelectorAll('script[src]'))
              .map((script) => script.src),
            resources: performance.getEntriesByType('resource')
              .filter((entry) => /\.css(?:\?|$)|\.js(?:\?|$)|fonts\.(?:googleapis|gstatic)\.com/.test(entry.name))
              .map((entry) => ({
                name: entry.name, durationMs: Math.round(entry.duration),
                transferSize: entry.transferSize || 0
              }))
              .slice(0, 80)
          }));
          item.afterScroll = await snap();
          await page.screenshot({ path: path.join(folder, '03-end.png') });
        } catch (error) {
          item.error = String(error);
        } finally {
          await fs.writeFile(path.join(folder, 'details.json'), JSON.stringify(item, null, 2), 'utf8');
          results.push(item);
          await context.close();
        }
      }
    }
  }
} finally {
  await browser.close();
}

const lines = [
  '# DZ Portal – mobile CLS lab report',
  '',
  'Generated: ' + new Date().toISOString(),
  'Source: ' + root.href,
  '',
  '| Page | Width | Ads | CLS (lab) | Status |',
  '|---|---:|---|---:|---|'
];
for (const r of results) {
  lines.push('| ' + new URL(r.url).pathname + ' | ' + r.viewport + ' | ' + r.mode + ' | ' + (r.cls ?? '—') + ' | ' + (r.error ? 'Error' : 'Measured') + ' |');
}
lines.push('', 'Laboratory figures are NOT Search Console 28-day field measurements. Ads may behave differently between runs or browsers.', 'Check details.json and the three screenshots per case for changes and shifting elements.', '');
await fs.writeFile(path.join(output, 'summary.md'), lines.join('\n'), 'utf8');
await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2), 'utf8');
console.log('Saved:', path.join(output, 'summary.md'));
if (results.every((r) => r.error)) process.exitCode = 1;
