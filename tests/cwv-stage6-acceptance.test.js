import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { Script } from 'node:vm';
import { fileURLToPath } from 'node:url';

const url = (p) => new URL('../' + p, import.meta.url);
const read = (p) => readFileSync(url(p), 'utf8');
const htmlClassCount = (html, name) =>
  [...html.matchAll(/class=["']([^"']+)["']/g)]
    .filter((m) => m[1].split(/\s+/).includes(name)).length;

test('critical scripts have valid syntax', () => {
  for (const p of [
    'assets/js/main.js', 'assets/js/deferred-homepage.js',
    'assets/js/ads-stability.js', 'assets/js/localSearch.js'
  ]) assert.doesNotThrow(() => new Script(read(p), { filename: p }));
});

test('sector search keeps its own small index, never queues global searchData on search-trigger alone', () => {
  const sector = read('assets/js/sector.js');
  const local = read('assets/js/localSearch.js');
  const deferred = read('assets/js/deferred-homepage.js');
  assert.match(sector, /loadLocalPageSearch\(\)/);
  assert.match(sector, /localSearch\.js/);
  assert.match(local, /triggers\.forEach\(trigger\s*=>\s*trigger\.addEventListener\("click"/);
  assert.match(local, /local-search-dialog/);
  assert.match(deferred, /document\.getElementById\('globalSearch'\)/);
  assert.match(deferred, /document\.getElementById\('searchResults'\)/);
  assert.match(deferred, /if \(searchInput\) \{\s*document\.querySelectorAll\('\.search-trigger, \[data-search-trigger\]'\)/s);
  assert.match(deferred, /loadLocalScript\('js\/searchData\.js'/);
  assert.match(read('index.html'), /id="globalSearch"/);
});

test('home filters and PWA install remain keyboard-operable without changing badge markup', () => {
  const home = read('index.html');
  const app = read('assets/js/main.js');
  assert.match(home, /id="installAppBtn" role="button" tabindex="0"/);
  assert.match(app, /event\.key === 'Enter' \|\| event\.key === ' '/);
  assert.match(app, /installBtn\.click\(\)/);
  assert.match(app, /beforeinstallprompt/);
  assert.match(app, /appinstalled/);
  assert.match(app, /filterBtns\.forEach/);
  assert.match(home, /data-filter="new"/);
});

test('PWA manifest and all advertised icons exist, and SW keeps the installation scope', () => {
  const manifest = JSON.parse(read('manifest.json'));
  assert.equal(manifest.scope, '/dz_portal/');
  assert.ok(manifest.start_url.startsWith(manifest.scope));
  assert.equal(manifest.display, 'standalone');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);
  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith('/dz_portal/'), icon.src);
    assert.ok(existsSync(url(icon.src.slice('/dz_portal/'.length))), icon.src);
  }
  const sw = read('sw.js');
  assert.match(sw, /addEventListener\("install"/);
  assert.match(sw, /addEventListener\("activate"/);
  assert.match(sw, /addEventListener\('fetch'/);
  assert.match(read('index.html'), /serviceWorker\.register\("sw\.js"\)/);
});

test('PWA PNG icon dimensions agree with manifest declarations', () => {
  const manifest = JSON.parse(read('manifest.json'));
  const seen = new Set();
  for (const icon of manifest.icons) {
    const declared = icon.sizes.match(/^(\\d+)x(\\d+)$/);
    if (!declared || seen.has(icon.src)) continue;
    seen.add(icon.src);
    const png = readFileSync(url(icon.src.slice('/dz_portal/'.length)));
    assert.equal(png.subarray(1, 4).toString(), 'PNG', icon.src);
    const actual = [png.readUInt32BE(16), png.readUInt32BE(20)];
    assert.deepEqual(actual, [Number(declared[1]), Number(declared[2])],
      `PWA icon dimensions differ: ${icon.src} is ${actual.join('x')}; generate assets via tools/build-pwa-icons.py`);
  }
});

test('AdSense units and original card counts stay intact on priority pages', () => {
  const pages = [
    ['index.html', 13],
    ['sectors/education.html', 8],
    ['sectors/awlyaa-education.html', 7],
    ['sectors/progres.mesrs.html', 5],
    ['pages/process/awlyaa-process.html', 2],
  ];
  for (const [p, expected] of pages) {
    const html = read(p);
    assert.equal(htmlClassCount(html, 'adsbygoogle'), expected, p);
    assert.match(html, /adsbygoogle\.js\?client=ca-pub-5656416032906373/, p);
    assert.match(html, /assets\/js\/ads-stability\.js/, p);
  }
  assert.equal(htmlClassCount(read('index.html'), 'sector-card'), 88);
  assert.equal(htmlClassCount(read('sectors/education.html'), 'service-item'), 29);
  assert.ok(read('assets/js/ads-stability.js').includes('MIN_AVAILABLE_WIDTH'));
});

test('mobile smoke harness includes viewport checks, PWA, ads, search and optional comparison', () => {
  const script = read('tools/mobile-regression.mjs');
  assert.match(script, /\[320,\s*360,\s*390,\s*412\]/);
  assert.match(script, /--baseline-url/);
  assert.match(script, /No repeated CSS URLs/);
  assert.match(script, /Global search renders suggestions/);
  assert.match(script, /Sector search avoids global index download/);
  assert.match(script, /PWA manifest responds/);
  assert.match(script, /AdSense controller exception/);
  assert.match(script, /No horizontal document overflow/);
  assert.match(script, /Hero stat cards remain in one row/);
});
