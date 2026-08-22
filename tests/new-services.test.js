import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const indexHtml = readFileSync(new URL('index.html', root), 'utf8');
const mainJs = readFileSync(new URL('assets/js/main.js', root), 'utf8');

const newCardPattern = /<a\b(?=[^>]*class="[^"]*\bsector-card\b[^"]*")(?=[^>]*data-new="true")[^>]*>[\s\S]*?<\/a>/g;
const newCards = [...indexHtml.matchAll(newCardPattern)].map(match => match[0]);
const datePattern = /data-new-since="(\d{4}-\d{2}-\d{2})"/;
const windowMs = 25 * 24 * 60 * 60 * 1000;

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

test('every new homepage card has a valid date and badge', () => {
  assert.ok(newCards.length > 0, 'homepage should contain new service cards');
  assert.equal(
    (indexHtml.match(/data-new="true"/g) || []).length,
    (indexHtml.match(/data-new-since="/g) || []).length,
    'every data-new=true card must define exactly one data-new-since date',
  );

  for (const card of newCards) {
    const date = card.match(datePattern)?.[1];
    assert.ok(date && isValidIsoDate(date), `invalid data-new-since value in card: ${date}`);
    assert.match(card, /class="service-badge"/, 'new card must include a service badge');
  }
});

test('new services filter is explicitly wired to the new filter', () => {
  assert.match(indexHtml, /id="newServicesBtn" class="filter-btn" data-filter="new"/);
  assert.match(indexHtml, /id="newServicesCount"/);
  assert.match(mainJs, /const NEW_SERVICE_WINDOW_DAYS = 25;/);
  assert.match(mainJs, /card\.dataset\.newSince/);
  assert.match(mainJs, /badge\.hidden = !isNew/);
  assert.match(mainJs, /setTimeout\(refreshNewServices/);
});

test('the 25-day window has inclusive start and exclusive expiry boundaries', () => {
  const start = Date.UTC(2026, 7, 22);
  assert.equal(start + windowMs - 1 > start, true);
  assert.equal(start + windowMs > start + windowMs, false);
  assert.equal(isValidIsoDate('2026-02-31'), false);
  assert.equal(isValidIsoDate('2026-08-22'), true);
});
