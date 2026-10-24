import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const criticalPages = [
  'index.html',
  'sectors/education.html',
  'sectors/awlyaa-education.html',
  'sectors/progres.mesrs.html',
  'pages/process/awlyaa-process.html',
  'sectors/poste.html',
  'sectors/dzexams.html',
  'sectors/sntf.html',
  'sectors/interieur.html',
  'sectors/tabioucom.html',
  'sectors/emergency.html',
  'sectors/facteur.html',
  'sectors/ade.html',
  'sectors/naftal.html',
  'sectors/hcn.html',
  'sectors/sonalgaz.html',
];

function headOf(path) {
  const text = read(path);
  assert.ok(text.includes('</head>'), path);
  return text.slice(0, text.indexOf('</head>'));
}

function cssLinks(head) {
  return [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0])
    .filter((tag) => /\bhref=["'][^"']+["']/.test(tag)
      && /\brel=["'](?:stylesheet|preload)["']/.test(tag));
}

test('home critical local CSS loads exactly once as a normal stylesheet', () => {
  const head = headOf('index.html');
  for (const file of [
    'style-main.css', 'style-section-header.css',
    'Alert-Modal.css', 'rating-panel.css', 'performance-home.css'
  ]) {
    const links = cssLinks(head).filter((tag) => tag.includes('href="assets/css/' + file + '"'));
    assert.equal(links.length, 1, file);
    assert.match(links[0], /\brel="stylesheet"/);
    assert.doesNotMatch(links[0], /onload=|as="style"/);
  }
  assert.doesNotMatch(head, /<noscript>[\s\S]*assets\/css\/(?:style-section-header|Alert-Modal|rating-panel|performance-home)\.css/);
  assert.equal((head.match(/fontawesome\.min\.css/g) || []).length, 0);
});

test('priority pages load Tajawal and one complete Font Awesome stylesheet before first paint', () => {
  for (const path of criticalPages) {
    const head = headOf(path);
    const links = cssLinks(head);
    const text = links.filter((tag) => tag.includes('fonts.googleapis.com/css2?family=Tajawal:'));
    const icons = links.filter((tag) => tag.includes('font-awesome/6.4.0/css/all.min.css'));
    assert.equal(text.length, 1, path + ' Tajawal');
    assert.equal(icons.length, 1, path + ' Font Awesome');
    for (const tag of [...text, ...icons]) {
      assert.match(tag, /\brel="stylesheet"/);
      assert.doesNotMatch(tag, /\bonload=|\bas="style"|\brel="preload"/);
    }
    assert.match(head, /href="https:\/\/fonts\.gstatic\.com" crossorigin/, path);
    assert.match(head, /href="https:\/\/cdnjs\.cloudflare\.com" crossorigin/, path);
    assert.doesNotMatch(head, /fontawesome\.min\.css/, path);
  }
});

test('noncritical scripts remain deferred and AdSense references are preserved', () => {
  const page = read('index.html');
  assert.match(page, /<script defer src="assets\/js\/main\.js"><\/script>/);
  assert.match(page, /<script defer src="assets\/js\/deferred-homepage\.js"><\/script>/);
  assert.match(page, /<script defer src="assets\/js\/ads-stability\.js"><\/script>/);
  for (const path of criticalPages) {
    const html = read(path);
    assert.match(html, /adsbygoogle\.js\?client=ca-pub-5656416032906373/, path);
    assert.match(html, /<ins\b[^>]*class=["'][^"']*adsbygoogle/, path);
  }
});

test('deferred loader only fetches scripts for present widgets', () => {
  const js = read('assets/js/deferred-homepage.js');
  assert.match(js, /document\.querySelector\('\[data-homepage-stat="sectors"\]'\)/);
  assert.match(js, /document\.querySelector\('\[data-homepage-stat="services"\]'\)/);
  assert.match(js, /document\.querySelector\('\[data-rating-widget\]'\)/);
  assert.match(js, /Array\.from\(document\.scripts\)\.find/);
  assert.match(js, /tag\.src === resolvedSrc/);
  assert.match(js, /loadLocalScript\('js\/searchData\.js'/);
  assert.match(js, /loadLocalScript\('js\/ads-stability\.js'/);
  assert.match(js, /scheduleIdle\(\(\) => loadLocalScript\('js\/homepageStats\.js'\)/);
  assert.match(js, /scheduleIdle\(\(\) => loadLocalScript\('js\/siteRating\.js'\)/);
});

test('statistics page still directly loads its ratings exactly once', () => {
  const statistics = read('pages/statistics.html');
  assert.match(statistics, /data-rating-widget/);
  assert.equal((statistics.match(/<script\s+defer\s+src="\.\.\/assets\/js\/siteRating\.js"/g) || []).length, 1);
  assert.match(statistics, /<script defer src="\.\.\/assets\/js\/deferred-homepage\.js"/);
});
