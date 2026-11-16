import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const centralLoader = 'assets/js/site-tags.js';

function isVerificationFile(path) {
  const name = path.split('/').pop();
  return name.startsWith('yandex_') || /^google[0-9a-f]+\.html$/i.test(name);
}

function collectHtmlFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      files.push(...collectHtmlFiles(path));
    } else if (entry.endsWith('.html')) {
      files.push(path);
    }
  }
  return files;
}

function count(pattern, html) {
  return (html.match(pattern) || []).length;
}

test('page-scoped analytics tags do not duplicate GA4 or site loaders', () => {
  const violations = [];

  for (const path of collectHtmlFiles(root)) {
    const html = readFileSync(path, 'utf8');
    if (!/<head\b/i.test(html)) continue;
    const page = relative(root, path);
    if (isVerificationFile(page)) continue;

    const depth = page.split('/').length - 1;
    const expectedLoader = `${'../'.repeat(depth)}${centralLoader}`;
    const loaders = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["'][^"']*site-tags\.js[^"']*["'][^>]*>/gi)].map(([tag]) => tag);
    const ga4Sources = [...html.matchAll(/googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]+)/gi)].map((match) => match[1]);
    const ga4Configs = [...html.matchAll(/gtag\s*\(\s*["']config["']\s*,\s*["'](G-[A-Z0-9]+)["']/gi)].map((match) => match[1]);
    const gtmSources = count(/googletagmanager\.com\/gtm\.js/gi, html);
    const claritySources = count(/clarity\.ms\/tag/gi, html);

    if (
      loaders.length > 1
      || (loaders.length === 1 && !loaders[0].includes(expectedLoader))
      || ga4Sources.length > 1
      || ga4Configs.length > 1
      || (ga4Sources.length && ga4Configs.length && ga4Sources[0] !== ga4Configs[0])
      || gtmSources > 1
      || claritySources > 1
    ) {
      violations.push({ page, loaders: loaders.length, expectedLoader, ga4Sources, ga4Configs, gtmSources, claritySources });
    }
  }

  assert.deepEqual(violations, []);
});

test('site-tags.js centrally loads GTM, AdSense, and Clarity with guards', () => {
  const source = readFileSync(join(root, 'assets/js/site-tags.js'), 'utf8');
  assert.match(source, /GTM-NW3BWPF6/);
  assert.match(source, /ca-pub-5656416032906373/);
  assert.match(source, /__dzPortalSiteTagsLoaded/);
  assert.match(source, /dzExternalSrc/);
  assert.match(source, /data-dz-ads-queued/);
  assert.doesNotMatch(source, /gtag\s*\(\s*["']config["']/i);
  assert.doesNotMatch(source, /event\s*:\s*["']page_view["']/i);
  assert.doesNotMatch(source, /ga4_measurement_id/i);
  assert.doesNotMatch(source, /clarity\.ms\/tag/i);
});
