import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const loader = 'assets/js/deferred-homepage.js';

function isVerificationFile(path) {
  const name = path.split('/').pop();
  return name.startsWith('yandex_') || /^google[0-9a-f]+\.html$/i.test(name);
}

function collectHtmlFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) files.push(...collectHtmlFiles(path));
    else if (entry.endsWith('.html')) files.push(path);
  }
  return files;
}

test('all content pages include the deferred homepage loader once with a valid relative path', () => {
  const violations = [];
  for (const path of collectHtmlFiles(root)) {
    const html = readFileSync(path, 'utf8');
    const page = relative(root, path);
    if (isVerificationFile(page) || !/<head\b/i.test(html) || !/<body\b/i.test(html)) continue;

    const depth = page.split('/').length - 1;
    const expectedLoader = `${'../'.repeat(depth)}${loader}`;
    const references = html.match(/<script\b[^>]*\bsrc\s*=\s*["'][^"']*deferred-homepage\.js[^"']*["'][^>]*>/gi) || [];
    if (references.length !== 1 || !references[0].includes(expectedLoader)) {
      violations.push({ page, references, expectedLoader });
    }
  }

  assert.deepEqual(violations, []);
});

test('deferred homepage loader resolves assets from nested pages', () => {
  const source = readFileSync(join(root, loader), 'utf8');
  assert.match(source, /new URL\('\.\.\/', loaderScript\.src\)/);
  assert.match(source, /loadLocalScript\('js\/searchData\.js'/);
  assert.match(source, /loadLocalScript\('js\/homepageStats\.js'/);
  assert.match(source, /loadLocalScript\('js\/siteRating\.js'/);
});

test('deferred homepage loader includes automated click, search, and conversion tracking', () => {
  const source = readFileSync(join(root, loader), 'utf8');
  assert.match(source, /trackEvent/);
  assert.match(source, /conversion/);
  assert.match(source, /contact_click/);
  assert.match(source, /file_download/);
  assert.match(source, /outbound_click/);
  assert.match(source, /search/);
  assert.match(source, /scroll_milestone/);
});

