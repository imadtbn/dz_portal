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

test('flashcards tool preserves creation, spaced review, quiz, and backup features', () => {
  const page = read('pages/tools/study/flashcards.html');
  const script = read('assets/js/tools/flashcards.js');
  const styles = read('assets/css/tools/flashcards.css');
  assert.match(page, /canonical.*pages\/tools\/study\/flashcards\.html/);
  assert.match(page, /assets\/js\/site-tags\.js/);
  assert.match(page, /data-ad-client="ca-pub-5656416032906373"/);
  assert.match(page, /id="create"/);
  assert.match(page, /id="review"/);
  assert.match(page, /id="quiz"/);
  assert.match(script, /dzPortalFlashcardsV1/);
  assert.match(script, /dz-portal-flashcards\.json/);
  assert.match(script, /exportJson/);
  assert.match(script, /saveExtracted/);
  assert.match(script, /startQuiz/);
  assert.match(styles, /flash-app/);
});

test('exam planner preserves calendar, reminders, revision planning, and export/import features', () => {
  const page = read('pages/tools/study/exam-planner.html');
  const script = read('assets/js/tools/exam-planner.js');
  const directory = read('pages/tools/index.html');
  assert.match(page, /canonical.*pages\/tools\/study\/exam-planner\.html/);
  assert.match(page, /assets\/js\/site-tags\.js/);
  assert.match(page, /data-ad-client="ca-pub-5656416032906373"/);
  assert.match(page, /id="eventForm"/);
  assert.match(page, /id="calendar"/);
  assert.match(page, /id="buildPlan"/);
  assert.match(page, /id="exportIcs"/);
  assert.match(script, /dzPortalExamPlannerV1/);
  assert.match(script, /dz-portal-exam-planner\.json/);
  assert.match(script, /dz-portal-calendar\.ics/);
  assert.match(script, /importJson/);
  assert.match(script, /renderNotifications/);
  assert.match(directory, /href="study\/exam-planner\.html" data-category="study"/);
  assert.doesNotMatch(page, /KEY='studentDzExamPlannerV1'/);
});

test('all migrated standalone tool scripts have valid JavaScript syntax', () => {
  const scripts = [
    'assets/js/tools/number-to-words.js',
    'assets/js/tools/age-calculator.js',
    'assets/js/tools/percentage-calculator.js',
    'assets/js/tools/date-difference.js',
    'assets/js/tools/pomodoro.js',
    'assets/js/tools/flashcards.js',
    'assets/js/tools/exam-planner.js',
  ];
  for (const file of scripts) {
    assert.doesNotThrow(() => new vm.Script(read(file), { filename: file }), file);
  }
});

test('all migrated tool pages have resolvable local asset and navigation paths', () => {
  const pages = [
    'pages/tools/index.html',
    'pages/tools/calculators/number-to-words.html',
    'pages/tools/calculators/age-calculator.html',
    'pages/tools/calculators/percentage-calculator.html',
    'pages/tools/calculators/date-difference.html',
    'pages/tools/study/pomodoro.html',
    'pages/tools/study/flashcards.html',
    'pages/tools/study/exam-planner.html',
  ];
  for (const file of pages) {
    const html = read(file);
    const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((ref) => ref && !/^(?:[a-z]+:|#|data:|\/)/i.test(ref));
    for (const ref of refs) {
      const clean = ref.split(/[?#]/, 1)[0];
      let target = path.resolve(root, path.dirname(file), clean);
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
      assert.ok(fs.existsSync(target), file + ' -> ' + ref);
    }
  }
});

test('tools directory and calculator and study tools are present in the existing sitemap', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\//);
  assert.match(sitemap, /https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\/calculators\/number-to-words\.html/);
  assert.match(sitemap, /https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\/calculators\/age-calculator\.html/);
  assert.match(sitemap, /https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\/calculators\/percentage-calculator\.html/);
  assert.match(sitemap, /https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\/calculators\/date-difference\.html/);
  assert.match(sitemap, /https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\/study\/pomodoro\.html/);
  assert.match(sitemap, /https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\/study\/flashcards\.html/);
  assert.match(sitemap, /https:\/\/imadtbn\.github\.io\/dz_portal\/pages\/tools\/study\/exam-planner\.html/);
  assert.match(sitemap, /<video:video>/);
});


function walkHtml(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkHtml(relative);
    return entry.isFile() && entry.name.endsWith('.html') ? [relative.replace(/\\/g, '/')] : [];
  });
}

test('all migrated tool pages have canonical URLs, portal navigation, and sitemap entries', () => {
  const sitemap = read('sitemap.xml');
  const pages = walkHtml('pages/tools').filter((file) => !file.endsWith('/index.html'));
  assert.equal(pages.length, 61);
  for (const file of pages) {
    const html = read(file);
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    assert.ok(canonical, 'missing canonical: ' + file);
    assert.equal(canonical[1], 'https://imadtbn.github.io/dz_portal/' + file, 'wrong canonical: ' + file);
    assert.ok(sitemap.includes('<loc>https://imadtbn.github.io/dz_portal/' + file + '</loc>'), 'missing sitemap URL: ' + file);
    assert.match(html, /site-tags\.js/);
    assert.match(html, /ads-stability\.js/);
    assert.match(html, /dz-share\.js/);
  }
});

test('imported pages use the portal shell and do not retain source analytics or duplicate AdSense loaders', () => {
  const pages = walkHtml('pages/tools').filter((file) => !file.endsWith('/index.html'));
  const existing = [
    'pages/tools/calculators/age-calculator.html',
    'pages/tools/calculators/average-calculator.html',
    'pages/tools/calculators/number-to-words.html',
    'pages/tools/calculators/percentage-calculator.html',
    'pages/tools/calculators/date-difference.html',
    'pages/tools/study/pomodoro.html',
    'pages/tools/study/flashcards.html',
    'pages/tools/study/exam-planner.html',
  ];
  const imported = pages.filter((file) => !existing.includes(file));
  for (const file of imported) {
    const html = read(file);
    assert.match(html, /(?:(?:dz-unified-header|unified-tool-template\.js|id="main-header"))/, 'missing portal shell: ' + file);
    assert.match(html, /data-ad-slot="(?:3143411927|1760836049|7867079394|8546947691)"/, 'missing reserved portal ad slot: ' + file);
    assert.doesNotMatch(html, /G-1FG97932S6|GTM-WG6CX4F5|adsbygoogle\.js\?client=/, 'source tracking/ads loader retained: ' + file);
  }
});

test('sitemap retains video structured entries and has no duplicate URL locations', () => {
  const sitemap = read('sitemap.xml');
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.match(sitemap, /xmlns:video=/);
  assert.match(sitemap, /<video:video>/);
  assert.equal(new Set(locations).size, locations.length);
});


test('unified footer renders the current year without stale footer DOM references', () => {
  const template = read('assets/js/tools/unified-tool-template.js');
  assert.match(template, /<span id="currentYear">/);
  const pages = walkHtml('pages/tools').filter((file) => !file.endsWith('/index.html'));
  assert.equal(pages.length, 61);
  assert.equal(pages.filter((file) => /unified-tool-template\.js/.test(read(file))).length, 53);
  for (const file of pages) {
    const html = read(file);
    assert.doesNotMatch(html, /getElementById\(['"]currentYear['"]\)/, 'stale footer year reference: ' + file);
  }
});


test('all 60 tool pages have unique Arabic SEO metadata and indexable canonical URLs', () => {
  const pages = walkHtml('pages/tools').filter((file) => !file.endsWith('/index.html'));
  assert.equal(pages.length, 61);
  const titles = new Set();
  const descriptions = new Set();
  const sitemap = read('sitemap.xml');

  const meta = (html, attr, key) => [...html.matchAll(/<meta\b[^>]*>/gi)]
    .filter(([tag]) => new RegExp('\\b' + attr + '=["\\x27]' + key + '["\\x27]', 'i').test(tag));

  for (const file of pages) {
    const html = read(file);
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
    const descriptionTags = meta(html, 'name', 'description');
    const keywordTags = meta(html, 'name', 'keywords');
    const robotsTags = meta(html, 'name', 'robots');
    const ogTitleTags = meta(html, 'property', 'og:title');
    const ogDescriptionTags = meta(html, 'property', 'og:description');
    const twitterTitleTags = meta(html, 'name', 'twitter:title');
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] || '';
    const description = descriptionTags[0]?.[0].match(/content=["']([^"']+)["']/i)?.[1] || '';

    assert.match(title, /[\u0600-\u06FF]/, 'title must be Arabic: ' + file);
    assert.equal(descriptionTags.length, 1, 'description must be unique: ' + file);
    assert.equal(keywordTags.length, 1, 'keywords must be unique: ' + file);
    assert.equal(robotsTags.length, 1, 'robots must be unique: ' + file);
    assert.equal(ogTitleTags.length, 1, 'OG title must be unique: ' + file);
    assert.equal(ogDescriptionTags.length, 1, 'OG description must be unique: ' + file);
    assert.equal(twitterTitleTags.length, 1, 'Twitter title must be unique: ' + file);
    assert.match(robotsTags[0][0], /index\s*,\s*follow/i, 'page must remain indexable: ' + file);
    assert.equal(canonical, 'https://imadtbn.github.io/dz_portal/' + file, 'canonical mismatch: ' + file);
    assert.ok(description.length >= 90, 'description is too short: ' + file);
    assert.ok(!titles.has(title), 'duplicate title: ' + title);
    assert.ok(!descriptions.has(description), 'duplicate description: ' + file);
    assert.ok(sitemap.includes(canonical), 'missing sitemap URL: ' + file);
    titles.add(title);
    descriptions.add(description);
  }
});


test('medication tracker is localized and preserves family, dose history, and backup rules', () => {
  const page = read('pages/tools/health/medication-tracker.html');
  const script = read('assets/js/tools/medication-tracker.js');
  const styles = read('assets/css/tools/pages/medication-tracker.css');
  const directory = read('pages/tools/index.html');
  const sitemap = read('sitemap.xml');
  assert.match(page, /canonical.*pages\\/tools\\/health\\/medication-tracker\\.html/);
  assert.match(page, /assets\\/js\\/site-tags\\.js/);
  assert.match(page, /assets\\/js\\/ads-stability\\.js/);
  assert.match(page, /assets\\/js\\/dz-share\\.js/);
  assert.match(page, /assets\\/js\\/tools\\/unified-tool-template\\.js/);
  assert.match(page, /data-ad-client="ca-pub-5656416032906373"/);
  assert.match(page, /data-ad-slot="7867079394"/);
  assert.match(page, /og:url/);
  assert.match(page, /application\\/ld\\+json/);
  assert.match(script, /const MAX_PROFILES=3/);
  assert.match(script, /p\\.medicines\\.push\\(m\\)/);
  assert.match(script, /const KEY='dzPortalMedicationTracker_v1'/);
  assert.match(script, /rec\\.events\\.push/);
  assert.match(script, /pauseIntervals/);
  assert.match(script, /function mergeImport/);
  assert.match(script, /dz-portal-medication-backup-/);
  assert.doesNotMatch(script, /gtag|dataLayer|dzTrackEvent|toolsDzMedicationTracker_v1/);
  assert.match(directory, /href="health\\/medication-tracker\\.html" data-category="health"/);
  assert.ok(sitemap.includes('https://imadtbn.github.io/dz_portal/pages/tools/health/medication-tracker.html'));
  assert.match(styles, /dz-medication-page/);
});
