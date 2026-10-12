import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const load = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const ids = ['07','06','05','04','03','02','01'];
const images = {
  '07':'avis7.jpg','06':'avis6.jpg','05':'avis5.jpg','04':'avis4.jpg',
  '03':'avis3.jpg','02':'avis1.jpg','01':'avis2.jpg'
};
const expectedSizes = {
  '07':[1131,1600],'06':[1449,2048],'05':[1086,1536],
  '04':[740,360],'03':[1449,2048],'02':[1449,2048],'01':[1449,2048]
};
const education = load('sectors/education.html');

test('seven compact bulletin cards have accessible, distinct reader links', () => {
  assert.equal((education.match(/class="education-notice-card"/g) || []).length, 7);
  assert.match(education, /id="official-notice"/);
  assert.match(education, /education-notices\.css/);
  assert.match(education, /education-notices\.js/);
  for (const id of ids) {
    const href = '../pages/education-notices/notice-' + id + '.html';
    assert.ok(education.includes('href="' + href + '"'), id);
    assert.ok(education.includes('data-notice-share="' + href + '"'), id);
    assert.ok(existsSync(new URL('../pages/education-notices/notice-' + id + '.html', import.meta.url)), id);
  }
  const section = education.split('id="official-notice"')[1].split('<section id="related-services"')[0];
  assert.doesNotMatch(section, /href="\.\.\/assets\/avis-educ\/avis\d+\.jpg"/);
  assert.doesNotMatch(section, /onclick="(?:shareNotice|printNotice)\(\)"/);
});

test('cards reserve preview height and change to one column on small phones', () => {
  const css = load('assets/css/education-notices.css');
  assert.match(css, /\.education-notices \.education-notices-grid/);
  assert.match(css, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /@media\s*\(max-width:\s*660px\)/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /\.education-notice-card__preview\s*\{[^}]*height:\s*205px;/s);
  assert.match(css, /object-fit:\s*contain/);
  assert.doesNotMatch(css, /object-fit:\s*cover/);
});

test('dedicated reader pages have static SEO metadata and the correct original image', () => {
  for (const id of ids) {
    const page = load('pages/education-notices/notice-' + id + '.html');
    const image = images[id];
    const canonical = 'https://imadtbn.github.io/dz_portal/pages/education-notices/notice-' + id + '.html';
    assert.ok(page.includes('<h1>بلاغ ' + id + ': '), id);
    assert.ok(page.includes('<link rel="canonical" href="' + canonical + '">'), id);
    assert.ok(page.includes('<meta property="og:image"'), id);
    assert.ok(page.includes('src="../../assets/avis-educ/' + image + '"'), id);
    assert.ok(page.includes('href="../../assets/avis-educ/' + image + '" download='), id);
    assert.ok(page.includes('href="../../sectors/education.html#official-notice"'), id);
    assert.match(page, /education-notice-viewer\.css/);
    assert.match(page, /education-notice-viewer\.js/);
    const src = page.match(/<img id="bulletinImage"[^>]+>/)?.[0];
    assert.ok(src, id);
    assert.ok(src.includes('width="' + expectedSizes[id][0] + '"'));
    assert.ok(src.includes('height="' + expectedSizes[id][1] + '"'));
    const structured = page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(structured, id);
    const ld = JSON.parse(structured[1]);
    assert.equal(ld.mainEntityOfPage, canonical);
    assert.equal(ld['@type'], 'Article');
    assert.ok(existsSync(new URL('../assets/avis-educ/' + image, import.meta.url)));
  }
});

test('reader supports zoom, printing, sharing, keyboard focus, and reduced layout jumps', () => {
  const js = load('assets/js/education-notice-viewer.js');
  const css = load('assets/css/education-notice-viewer.css');
  assert.match(js, /bulletinZoomIn/);
  assert.match(js, /bulletinZoomOut/);
  assert.match(js, /bulletinZoomReset/);
  assert.match(js, /window\.print\(\)/);
  assert.match(js, /navigator\.share/);
  assert.match(css, /overflow:auto/);
  assert.match(css, /@media print/);
  assert.match(css, /focus-visible/);
});

test('SEO sitemap and original ads and services survive the notice redesign', () => {
  const sitemap = load('sitemap.xml');
  for (const id of ids) {
    assert.ok(sitemap.includes('pages/education-notices/notice-' + id + '.html'));
  }
  assert.equal((education.match(/class="adsbygoogle"/g) || []).length, 8);
  assert.equal([...education.matchAll(/class=["']([^"']+)["']/g)]
    .filter(m => m[1].split(/\s+/).includes('service-item')).length, 29);
});
