import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const naftalHtml = readFileSync(new URL('sectors/naftal.html', root), 'utf8');
const searchData = readFileSync(new URL('assets/js/searchData.js', root), 'utf8');

function communicationSection(html) {
  const match = html.match(/<section\b[^>]*id="comminication"[^>]*>[\s\S]*?<\/section>/);
  assert.ok(match, 'Naftal communication section must exist');
  return match[0];
}

test('Naftal communication section exposes customer support email', () => {
  const section = communicationSection(naftalHtml);
  assert.match(section, /<span class="service-count">02 خدمات<\/span>/);
  assert.match(section, /href="mailto:call\.center@naftal\.dz"/);
  assert.match(section, /فريق دعم نفطال/);
  assert.match(section, /مصلحة الزبائن/);
  assert.match(section, /call\.center@naftal\.dz/);
});

test('Naftal support email is represented in structured data and search index', () => {
  const jsonLdBlocks = [...naftalHtml.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(match => JSON.parse(match[1]));
  const itemList = jsonLdBlocks
    .flatMap(block => block['@graph'] || [])
    .find(block => block['@type'] === 'ItemList');

  assert.ok(itemList, 'Naftal ItemList JSON-LD must exist');
  assert.ok(itemList.itemListElement.some(({ item }) =>
    item?.url === 'mailto:call.center@naftal.dz' &&
    item?.name === 'التواصل مع فريق دعم نفطال',
  ));
  assert.match(searchData, /"call\.center@naftal\.dz"/);
  assert.match(searchData, /"فريق دعم نفطال"/);
});
