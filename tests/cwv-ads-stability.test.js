import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => readFileSync(join(root, file), 'utf8');

function allHtml(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (name === 'node_modules' || name === '.git') return [];
    return statSync(full).isDirectory() ? allHtml(full) : name.endsWith('.html') ? [full] : [];
  });
}

test('mobile ad CSS reserves by format and never caps ad height', () => {
  for (const file of ['assets/css/style-main.css', 'assets/css/style-sector.css',
    'assets/css/style.css', 'assets/css/ads-stability.css']) {
    const css = read(file);
    assert.match(css, /:has\(ins\.adsbygoogle\[data-ad-format="fluid"\]\)/);
    assert.match(css, /:has\(ins\.adsbygoogle\[data-ad-format="autorelaxed"\]\)/);
    assert.match(css, /min-height:/);
    assert.doesNotMatch(css.slice(css.indexOf('CWV stage 02') >= 0
      ? css.indexOf('CWV stage 02') : 0), /max-height\s*:\s*\d+px/);
  }
});

test('high-CLS pages retain unit counts and use the width-aware controller', () => {
  const expected = new Map([
    ['index.html', 13],
    ['sectors/education.html', 8],
    ['sectors/awlyaa-education.html', 7],
    ['sectors/progres.mesrs.html', 5],
    ['pages/process/awlyaa-process.html', 2],
    ['sectors/sntf-trip.html', 1],
    ['sectors/sntf-trains.html', 1],
  ]);
  for (const [file, count] of expected) {
    const html = read(file);
    assert.equal((html.match(/<ins\b[^>]*\bclass=["'][^"']*adsbygoogle/gi) || []).length, count, file);
    assert.match(html, /<script\b[^>]*src=["'][^"']*\/ads-stability\.js["']/i, file);
    assert.doesNotMatch(html, /\(adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\)\.push\(\{\}\)/, file);
  }
});

test('every page with AdSense markup has reservation styles and an initializer', () => {
  const withoutStyles = [];
  const withoutInit = [];
  for (const fullPath of allHtml(root)) {
    const html = readFileSync(fullPath, 'utf8');
    if (!/<ins\b[^>]*class=["'][^"']*adsbygoogle/i.test(html)) continue;
    const file = relative(root, fullPath);
    if (!/assets\/css\/(?:style-main|style-sector|ads-stability)\.css/i.test(html)) {
      withoutStyles.push(file);
    }
    if (!/assets\/js\/(?:deferred-homepage|ads-stability)\.js/i.test(html)) {
      withoutInit.push(file);
    }
  }
  assert.deepEqual(withoutStyles, []);
  assert.deepEqual(withoutInit, []);
});

test('legacy site tags defer to the guarded controller', () => {
  assert.match(read('assets/js/site-tags.js'), /__dzAdsStability\?\.started/);
  const helper = read('assets/js/ads-stability.js');
  assert.match(helper, /MIN_AVAILABLE_WIDTH/);
  assert.match(helper, /data-dz-ads-queued/);
  assert.match(helper, /addEventListener\('resize'/);
  assert.match(helper, /addEventListener\('scroll'/);
});
