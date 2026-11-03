const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('unified tools directory exposes the pilot calculator with searchable categories', () => {
  const directory = read('pages/tools/index.html');
  assert.match(directory, /id="tool-search"/);
  assert.match(directory, /data-filter="calculators"/);
  assert.match(directory, /href="calculators\/number-to-words\.html"/);
  assert.match(directory, /canonical" href="https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\//);
  assert.doesNotMatch(directory, /imadtbn\.github\.io\/tools-dz/);
});

test('number-to-words pilot preserves tool logic and uses the portal template', () => {
  const page = read('pages/tools/calculators/number-to-words.html');
  const script = read('assets/js/tools/number-to-words.js');
  const styles = read('assets/css/tools/number-to-words.css');
  assert.match(page, /<html lang="ar" dir="rtl">/);
  assert.match(page, /canonical" href="https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\/calculators\/number-to-words\.html"/);
  assert.match(page, /assets\/js\/site-tags\.js/);
  assert.match(page, /assets\/js\/ads-stability\.js/);
  assert.match(page, /assets\/js\/dz-share\.js/);
  assert.match(page, /assets\/js\/tools\/number-to-words\.js/);
  assert.match(page, /data-ad-client="ca-pub-5656416032906373"/);
  assert.match(page, /data-ad-slot="7867079394"/);
  assert.equal((page.match(/googletagmanager\.com\/gtag\/js\?id=G-K23WYKK60X/g) || []).length, 1);
  assert.match(page, /gtag\('config', 'G-K23WYKK60X'/);
  assert.doesNotMatch(page, /G-4BCWP0498L|G-BT30MKHK77/);
  assert.doesNotMatch(page, /adsbygoogle\s*\)\.push|adsbygoogle\s*=\s*window\.adsbygoogle/);
  assert.match(script, /function parseAmount/);
  assert.match(script, /ntw-copy/);
  assert.match(script, /ntw-print/);
  assert.match(styles, /@media\(max-width:700px\)/);
  assert.match(styles, /overflow-wrap:anywhere/);
});

test('age calculator keeps the portal template, date validation, and responsive result fields', () => {
  const page = read('pages/tools/calculators/age-calculator.html');
  const script = read('assets/js/tools/age-calculator.js');
  assert.match(page, /canonical.*calculators\/age-calculator\.html/);
  assert.match(page, /assets\/js\/site-tags\.js/);
  assert.match(page, /data-ad-client="ca-pub-5656416032906373"/);
  assert.match(script, /function calculateAge/);
  assert.match(script, /function dateFromInput/);
  assert.match(script, /daysToBirthday/);
  assert.match(page, /id="years-res"/);
  assert.match(page, /id="total-days"/);
});

test('percentage and date-difference calculators have local logic and portal tracking', () => {
  const pctPage = read('pages/tools/calculators/percentage-calculator.html');
  const pctJS = read('assets/js/tools/percentage-calculator.js');
  const datePage = read('pages/tools/calculators/date-difference.html');
  const dateJS = read('assets/js/tools/date-difference.js');
  for (const page of [pctPage, datePage]) {
    assert.match(page, /assets\/js\/site-tags\.js/);
    assert.match(page, /assets\/js\/deferred-homepage\.js/);
    assert.match(page, /data-ad-client="ca-pub-5656416032906373"/);
  }
  assert.match(pctPage, /canonical.*percentage-calculator\.html/);
  assert.match(pctJS, /const pct=\(a\/b\)\*100/);
  assert.match(datePage, /canonical.*date-difference\.html/);
  assert.match(dateJS, /function parseDay/);
  assert.match(dateJS, /Math\.abs/);
});


function mockDocument(ids) {
  const elements = {};
  for (const id of ids) {
    elements[id] = {
      value: '', textContent: '', hidden: false, max: '',
      listeners: {},
      classList: { remove() {} },
      addEventListener(type, callback) { this.listeners[type] = callback; },
      trigger(type, event = {}) { this.listeners[type]?.(event); },
    };
  }
  return { elements, document: { getElementById: (id) => elements[id] } };
}

test('percentage, date-difference, and age calculator logic runs with valid inputs', () => {
  const pct = mockDocument(['pct-form','pct-part','pct-total','pct-error','pct-result','pct-value','pct-details']);
  vm.runInNewContext(read('assets/js/tools/percentage-calculator.js'), { document: pct.document, Number, Intl, console });
  pct.elements['pct-part'].value = '25';
  pct.elements['pct-total'].value = '200';
  pct.elements['pct-form'].trigger('submit', { preventDefault() {} });
  assert.equal(pct.elements['pct-result'].hidden, false);
  assert.equal(pct.elements['pct-error'].hidden, true);
  assert.ok(pct.elements['pct-value'].textContent.length > 0);

  const dates = mockDocument(['date-form','date-start','date-end','date-error','date-result','date-days','date-details']);
  vm.runInNewContext(read('assets/js/tools/date-difference.js'), { document: dates.document, Date, Math, Number, Intl, console });
  dates.elements['date-start'].value = '2026-01-01';
  dates.elements['date-end'].value = '2026-01-15';
  dates.elements['date-form'].trigger('submit', { preventDefault() {} });
  assert.equal(dates.elements['date-result'].hidden, false);
  assert.match(dates.elements['date-days'].textContent, /14|١٤/);

  const age = mockDocument(['age-form','birthdate','age-error','result','years-res','months-res','days-res','total-days','next-bday']);
  vm.runInNewContext(read('assets/js/tools/age-calculator.js'), { document: age.document, Date, Math, Number, Intl, console });
  age.elements.birthdate.value = '2000-01-01';
  age.elements['age-form'].trigger('submit', { preventDefault() {} });
  assert.equal(age.elements.result.hidden, false);
  assert.equal(age.elements['age-error'].hidden, true);
  assert.ok(age.elements['total-days'].textContent.length > 0);
});

test('Pomodoro study timer is linked to the study category and uses the portal template', () => {
  const page = read('pages/tools/study/pomodoro.html');
  const script = read('assets/js/tools/pomodoro.js');
  const directory = read('pages/tools/index.html');
  assert.match(page, /canonical.*pages\/tools\/study\/pomodoro\.html/);
  assert.match(page, /assets\/js\/site-tags\.js/);
  assert.match(page, /data-ad-client="ca-pub-5656416032906373"/);
  assert.match(directory, /href="study\/pomodoro\.html" data-category="study"/);
  assert.match(script, /setInterval/);
  assert.match(page, /data-minutes="25"/);
  assert.match(script, /pomodoro_completed/);
});

test('tools directory and calculator and study tools are present in the existing sitemap', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\//);
  assert.match(sitemap, /https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\/calculators\/number-to-words\.html/);
  assert.match(sitemap, /https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\/calculators\/age-calculator\.html/);
  assert.match(sitemap, /https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\/calculators\/percentage-calculator\.html/);
  assert.match(sitemap, /https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\/calculators\/date-difference\.html/);
  assert.match(sitemap, /https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\/study\/pomodoro\.html/);
  assert.match(sitemap, /<video:video>/);
});
