import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const load = (name) => readFileSync(new URL('../' + name, import.meta.url), 'utf8');

const affected = [
  ['assets/css/style-main.css', '.sector-card'],
  ['assets/css/style-sector.css', '.services-grid'],
  ['assets/css/performance-home.css', '.sectors-section'],
  ['assets/css/style-train-gallery.css', '.train-card']
];

test('variable-height cards and sections never use an estimated skipped-content height', () => {
  for (const [path, selector] of affected) {
    const css = load(path);
    assert.doesNotMatch(css, /(?:^|[;{}\s])content-visibility\s*:\s*auto\s*;/m,
      `${path} should not skip content with unknown natural heights`);
    assert.doesNotMatch(css, /contain-intrinsic-size\s*:/,
      `${path} should not reserve a guessed intrinsic size`);
    assert.ok(css.includes(selector), `${path} must retain ${selector} styling`);
  }
});

test('existing grid, card and responsive layout rules remain in the stylesheets', () => {
  const main = load('assets/css/style-main.css');
  assert.match(main, /\.sector-card\s*\{[^}]*display:\s*flex\s*;/s);
  assert.match(main, /\.sectors-grid\s*\{[^}]*display:\s*grid\s*;/s);
  assert.match(main, /@media\s*\(max-width:\s*768px\)/);
  const sector = load('assets/css/style-sector.css');
  assert.match(sector, /\.services-grid\s*\{[^}]*display:\s*grid\s*;/s);
  assert.match(sector, /\.service-item\s*\{[^}]*display:\s*flex\s*;/s);
  assert.match(sector, /\.section-card/);
  const home = load('assets/css/performance-home.css');
  assert.match(home, /\.stat-number/);
  assert.match(home, /\.sector-icon picture/);
  const gallery = load('assets/css/style-train-gallery.css');
  assert.match(gallery, /\.train-card/);
});

test('the previous AdSense reservation and loader code remains available', () => {
  for (const path of ['assets/css/style-main.css', 'assets/css/style-sector.css']) {
    const css = load(path);
    assert.match(css, /\.ad-container:has\(ins\.adsbygoogle/);
  }
  assert.match(load('assets/js/ads-stability.js'), /MIN_AVAILABLE_WIDTH/);
  assert.match(load('assets/js/deferred-homepage.js'), /ads-stability\.js/);
});

test('all priority pages retain the expected number of service and sector cards', () => {
  const pages = [
    ['index.html', 'sector-card', 88],
    ['sectors/education.html', 'service-item', 29],
    ['sectors/sntf.html', 'train-card', 36]
  ];
  for (const [path, className, count] of pages) {
    const html = load(path);
    const actual = (html.match(new RegExp('class=["\\\'][^"\\\']*\\b' + className + '\\b', 'g')) || []).length;
    assert.equal(actual, count, path);
  }
});
