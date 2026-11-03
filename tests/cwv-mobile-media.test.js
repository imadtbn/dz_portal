import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const heroPages = [
  'sectors/poste.html',
  'sectors/interieur.html',
  'sectors/tabioucom.html',
  'sectors/emergency.html',
  'sectors/facteur.html',
  'sectors/ade.html',
  'sectors/naftal.html',
  'sectors/hcn.html',
  'sectors/sonalgaz.html',
  'sectors/education.html',
  'sectors/awlyaa-education.html',
  'sectors/progres.mesrs.html',
  'pages/process/awlyaa-process.html',
];
const videoPages = [
  'pages/video/arpce-777.html',
  'pages/video/dronet.mdn.html',
  'pages/process/arpce.html',
  'pages/process/arpce2.html',
  'pages/video/naftal-tyres.html',
  'pages/process/apostille.html',
  'pages/video/mtpib-presentation.html',
  'pages/video/awlyaa-registration.html',
  'pages/video/takwin-registration.html',
  'pages/process/awlyaa-process.html',
  'pages/process/e-mahata.naftal.html',
  'pages/video/apostille-registration.html',
  'pages/video/markabatidz-registration.html',
  'pages/video/e-declaration-registration.html',
];
function images(html) { return [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]); }
function attr(tag, name) {
  return tag.match(new RegExp('\\b' + name + '=["\']([^"\']+)["\']', 'i'))?.[1] ?? null;
}

test('original hero images have dimensions and load eagerly on affected pages', () => {
  for (const page of heroPages) {
    const tags = images(read(page)).filter((tag) => /\bclass=["'][^"']*\bhero-icon\b/.test(tag));
    assert.equal(tags.length, 1, page);
    const tag = tags[0];
    assert.ok(Number(attr(tag, 'width')) > 0, page + ' missing width');
    assert.ok(Number(attr(tag, 'height')) > 0, page + ' missing height');
    assert.equal(attr(tag, 'loading'), 'eager', page);
    assert.equal(attr(tag, 'decoding'), 'async', page);
    assert.equal(attr(tag, 'fetchpriority'), 'high', page);
  }
});

test('seven education notice images have their real intrinsic aspect ratios', () => {
  const expected = { 'avis1.jpg': [1449, 2048], 'avis2.jpg': [1449, 2048],
    'avis3.jpg': [1449, 2048], 'avis4.jpg': [740, 360],
    'avis5.jpg': [1086, 1536], 'avis6.jpg': [1449, 2048],
    'avis7.jpg': [1131, 1600] };
  const tags = images(read('sectors/education.html'))
    .filter((tag) => /\/avis-educ\/avis[1-7]\.jpg/.test(tag));
  assert.equal(tags.length, 7);
  for (const tag of tags) {
    const name = attr(tag, 'src').split('/').at(-1);
    assert.deepEqual([Number(attr(tag, 'width')), Number(attr(tag, 'height'))], expected[name]);
    assert.equal(attr(tag, 'loading'), 'lazy');
  }
});

test('home and sector hero statistics retain exactly three columns on mobile', () => {
  const main = read('assets/css/style-main.css');
  const sector = read('assets/css/style-sector.css');
  assert.match(main, /\.hero \.stats-bar\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(sector, /\.sector-hero \.hero-stats\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
  assert.doesNotMatch(main, /display:\s*block00/);
  assert.match(main, /\.stat-number\s*\{[^}]*min-width:\s*4ch/s);
  for (const page of ['sectors/education.html', 'sectors/awlyaa-education.html',
    'sectors/progres.mesrs.html', 'pages/process/awlyaa-process.html']) {
    assert.equal((read(page).match(/class="hero-stat"/g) || []).length, 3, page);
  }
});

test('video frames preserve a reserved wrapper and do not affect its intrinsic height', () => {
  const css = read('assets/css/video-watch.css');
  assert.match(css, /\.video-watch-player\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9/s);
  assert.match(css, /\.video-watch-player\s*\{[^}]*position:\s*relative/s);
  assert.match(css, /\.video-watch-player\s*>\s*iframe[\s\S]*?position:\s*absolute/s);
  for (const page of videoPages) {
    const tags = [...read(page).matchAll(/<iframe\b[^>]*>/gi)].map((m) => m[0]);
    assert.equal(tags.length, 1, page);
    assert.equal(attr(tags[0], 'width'), '560', page);
    assert.equal(attr(tags[0], 'height'), '315', page);
  }
});

test('styles and AdSense remain present on priority pages', () => {
  const sector = read('assets/css/style-sector.css');
  const home = read('assets/css/style-main.css');
  assert.match(sector, /\.header-content/);
  assert.match(sector, /\.sector-hero \.hero-stats/);
  assert.match(sector, /\.ad-container:has\(ins\.adsbygoogle/);
  assert.match(home, /\.ad-container:has\(ins\.adsbygoogle/);
  assert.equal((read('index.html').match(/class="sector-card"/g) || []).length, 88);
  const services = [...read('sectors/education.html').matchAll(/class=["']([^"']+)["']/g)]
    .filter((match) => match[1].split(/\s+/).includes('service-item'));
  assert.equal(services.length, 29);
});
