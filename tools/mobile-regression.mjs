/**
 * Stage 06: real-browser mobile smoke and layout regressions.
 * cd tools && npm install && npx playwright install chromium
 * npm run qa:mobile
 * npm run qa:mobile -- --baseline-url=http://127.0.0.1:8081/dz_portal/
 *
 * BASE_URL can point at a local preview instead of public GitHub Pages.
 * The baseline URL must be a separately hosted/checked-out OLD version.
 * No GitHub Actions workflow is installed by this tool.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const option = (name) => args.find((x) => x.startsWith(name + '='))?.slice(name.length + 1);
const currentUrl = new URL(option('--url') || process.env.BASE_URL || 'https://imadtbn.github.io/dz_portal/');
const baselineArg = option('--baseline-url') || process.env.BASELINE_URL || '';
const baselineUrl = baselineArg ? new URL(baselineArg) : null;
const output = path.resolve(process.cwd(), 'mobile-qa-output');
const pages = [
  ['home', ''],
  ['education', 'sectors/education.html'],
  ['awlyaa', 'sectors/awlyaa-education.html'],
  ['progres', 'sectors/progres.mesrs.html'],
  ['awlyaa-process', 'pages/process/awlyaa-process.html'],
  ['poste', 'sectors/poste.html'],
  ['sntf', 'sectors/sntf.html'],
];
const viewports = args.includes('--quick') ? [390] : [320, 360, 390, 412];
const toUrl = (base, relative) => new URL(relative, base.pathname.endsWith('/') ? base : new URL(base.href + '/')).href;
const fmt = (n) => Number.isFinite(n) ? Number(n.toFixed(4)) : null;

function layoutShiftScore(shifts) {
  let start = 0, previous = -Infinity, sum = 0, max = 0;
  for (const s of shifts.filter((e) => !e.hadRecentInput).sort((a, b) => a.time - b.time)) {
    if (s.time - previous > 1000 || s.time - start > 5000) {
      start = s.time;
      sum = 0;
    }
    sum += s.value;
    max = Math.max(max, sum);
    previous = s.time;
  }
  return fmt(max);
}

const results = [];
const browser = await chromium.launch({ headless: true });
await mkdir(output, { recursive: true });

async function measure(version, base, name, relative, width) {
  const context = await browser.newContext({
    viewport: { width, height: 800 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'ar-DZ',
    serviceWorkers: 'allow',
  });
  const page = await context.newPage();
  const dir = path.join(output, version, name, String(width));
  await mkdir(dir, { recursive: true });
  const res = { version, name, width, url: toUrl(base, relative), checks: [], warnings: [], errors: [] };
  const check = (label, success, detail = '') => {
    res.checks.push({ label, passed: Boolean(success), detail });
  };
  page.on('pageerror', (error) => res.errors.push(String(error).slice(0, 300)));
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(new URL(res.url).origin)) {
      res.warnings.push('Local request failed: ' + request.url().slice(0, 200));
    }
  });
  await page.addInitScript(() => {
    window.__qaShiftEntries = [];
    window.__qaLcpMs = null;
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__qaShiftEntries.push({
            time: e.startTime, value: e.value, hadRecentInput: e.hadRecentInput,
          });
        }
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__qaLcpMs = e.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      window.__qaObserverError = String(error);
    }
  });
  try {
    const response = await page.goto(res.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    check('HTML responds successfully', response?.ok(), String(response?.status() || 'no response'));
    await page.screenshot({ path: path.join(dir, 'initial.png'), fullPage: false });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(dir, 'settled.png'), fullPage: false });

    const layout = await page.evaluate(() => {
      const stats = document.querySelector('.sector-hero .hero-stats')
        || document.querySelector('.hero .stats-bar');
      const cards = stats
        ? Array.from(stats.children).filter((el) => getComputedStyle(el).display !== 'none') : [];
      const boxes = cards.map((el) => el.getBoundingClientRect());
      const header = document.querySelector('.header, .site-header, header');
      const hero = document.querySelector('.sector-hero, .hero');
      const br = (node) => {
        if (!node) return null;
        const b = node.getBoundingClientRect();
        return { top: Math.round(b.top), height: Math.round(b.height), width: Math.round(b.width) };
      };
      const ads = Array.from(document.querySelectorAll('ins.adsbygoogle')).map((el) => ({
        slot: el.dataset.adSlot || '(none)',
        format: el.dataset.adFormat || 'auto',
        width: Math.round(el.getBoundingClientRect().width),
        height: Math.round(el.getBoundingClientRect().height),
        status: el.getAttribute('data-adsbygoogle-status') || el.dataset.dzAdRequested || '',
      }));
      return {
        viewport: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        title: document.title,
        header: br(header),
        hero: br(hero),
        statsCount: boxes.length,
        statTops: boxes.map((b) => Math.round(b.top)),
        statRights: boxes.map((b) => Math.round(b.right)),
        statLefts: boxes.map((b) => Math.round(b.left)),
        css: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((e) => e.href),
        scripts: Array.from(document.querySelectorAll('script[src]')).map((e) => e.src),
        ads,
        adController: window.__dzAdsStability ? {
          queued: window.__dzAdsStability.queued,
          lastError: window.__dzAdsStability.lastError,
        } : null,
        cards: document.querySelectorAll('.sector-card').length,
        serviceItems: document.querySelectorAll('.service-item').length,
        video: br(document.querySelector('.video-watch-player')),
      };
    });
    res.layout = layout;
    check('No horizontal document overflow', layout.scrollWidth <= width + 3,
      'scrollWidth=' + layout.scrollWidth + ', width=' + width);
    check('Header and hero exist', Boolean(layout.header && layout.hero));
    if (layout.statsCount) {
      check('Hero stat cards remain in one row', layout.statsCount === 3 &&
        Math.max(...layout.statTops) - Math.min(...layout.statTops) <= 2,
        JSON.stringify(layout.statTops));
    }
    if (version === 'current') {
      const html = await page.locator('html').getAttribute('lang');
      check('Arabic document language', html === 'ar', String(html));
      const validStyles = layout.css.every((url, i, arr) => arr.indexOf(url) === i);
      check('No repeated CSS URLs', validStyles);
      if (name === 'home' && width === 390) {
        await page.locator('#globalSearch').fill('التربية');
        const gotResults = await page.locator('#searchResults .search-result-item').first()
          .waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
        check('Global search renders suggestions', gotResults);
        const newButton = page.locator('.filter-btn[data-filter="new"]');
        await newButton.click();
        check('New-services filter responds', (await newButton.getAttribute('aria-pressed')) === 'true');
        await page.locator('.filter-btn[data-filter="all"]').click();
        const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
        const manifestUrl = new URL(manifestHref || '', res.url);
        const manifestResponse = await page.request.get(manifestUrl.href);
        check('PWA manifest responds', manifestResponse.ok());
        if (manifestResponse.ok()) {
          const manifest = await manifestResponse.json();
          check('PWA start URL remains in scope', manifest.scope === '/dz_portal/' &&
            manifest.start_url?.startsWith(manifest.scope));
          for (const icon of manifest.icons || []) {
            const iconResponse = await page.request.get(new URL(icon.src, manifestUrl).href);
            check('PWA icon ' + icon.sizes + ' reachable', iconResponse.ok());
          }
        }
        const sw = await page.request.get(new URL('sw.js', base).href);
        check('PWA service worker script reachable', sw.ok());
      }
      if (name === 'education' && width === 390) {
        const open = page.locator('.search-trigger').first();
        await open.click();
        const dialog = page.locator('.local-search-dialog');
        check('Sector local search opens', await dialog.isVisible());
        const loadedGlobal = await page.evaluate(() => Boolean(
          document.querySelector('script[src*="/searchData.js"]')
        ));
        check('Sector search avoids global index download', !loadedGlobal);
        await page.locator('.local-search-input').press('Escape');
        check('Sector search closes with Escape',
          !(await page.locator('.local-search-dialog').isVisible()));
      }
    }
    for (const ratio of [0.35, 0.7, 1]) {
      await page.evaluate((fraction) => {
        scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * fraction));
      }, ratio);
      await page.waitForTimeout(550);
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(dir, 'after-scroll.png'), fullPage: false });
    const perf = await page.evaluate(() => ({
      shifts: window.__qaShiftEntries || [],
      lcp: window.__qaLcpMs,
      fcp: performance.getEntriesByType('paint')
        .find((e) => e.name === 'first-contentful-paint')?.startTime || null,
      observerError: window.__qaObserverError || null,
      fontStatus: document.fonts?.status || 'unsupported',
    }));
    res.cls = layoutShiftScore(perf.shifts);
    res.lcpMs = fmt(perf.lcp);
    res.fcpMs = fmt(perf.fcp);
    res.fontStatus = perf.fontStatus;
    if (perf.observerError) res.warnings.push(perf.observerError);
    if (res.errors.length) res.warnings.push(res.errors.length + ' uncaught JS errors; triage external scripts separately');
    if (layout.ads.some((slot) => slot.width < 220)) {
      res.warnings.push('One or more AdSense slots are narrower than 220px');
    }
    if (layout.adController?.lastError) {
      res.warnings.push('AdSense controller exception: ' + layout.adController.lastError);
    }
  } catch (error) {
    res.checks.push({ label: 'Page evaluation completed', passed: false, detail: String(error) });
  } finally {
    await writeFile(path.join(dir, 'result.json'), JSON.stringify(res, null, 2), 'utf8');
    results.push(res);
    await context.close();
  }
}
try {
  for (const [name, relative] of pages) {
    for (const width of viewports) {
      if (baselineUrl) await measure('baseline', baselineUrl, name, relative, width);
      await measure('current', currentUrl, name, relative, width);
      console.log('Tested', name, width);
    }
  }
} finally {
  await browser.close();
}

const failures = results.filter((x) => x.checks.some((c) => !c.passed));
const summary = [
  '# DZ Portal — browser-based mobile acceptance test',
  '',
  'Generated: ' + new Date().toISOString(),
  'Target: ' + currentUrl.href,
  'Baseline: ' + (baselineUrl?.href || 'not supplied; no before/after metric claim'),
  '',
  '| Version | Page | Width | CLS lab | LCP ms | FCP ms | Checks |',
  '|---|---|---:|---:|---:|---:|---|',
];
for (const r of results) {
  const failed = r.checks.filter((c) => !c.passed).map((x) => x.label);
  summary.push('| ' + r.version + ' | ' + r.name + ' | ' + r.width + ' | ' +
    (r.cls ?? '—') + ' | ' + (r.lcpMs ?? '—') + ' | ' + (r.fcpMs ?? '—') +
    ' | ' + (failed.length ? 'FAIL: ' + failed.join('; ') : 'PASS') + ' |');
}
summary.push('', 'Failed cases: ' + failures.length + ' of ' + results.length,
  '', 'AdSense no-fill, third-party blocking and font timing may vary; inspect JSON and screenshots.',
  'Laboratory results are not 28-day CrUX / Search Console field measurements.',
  'To compare a prior revision, supply --baseline-url to an actually served snapshot of that revision.',
  '');
await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2), 'utf8');
await writeFile(path.join(output, 'summary.md'), summary.join('\n'), 'utf8');
console.log('Report:', path.join(output, 'summary.md'));
if (failures.length) process.exitCode = 1;
