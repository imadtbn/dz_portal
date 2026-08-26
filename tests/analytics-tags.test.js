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

test('all HTML documents use one central site-tags loader', () => {
  const violations = [];

  for (const path of collectHtmlFiles(root)) {
    const html = readFileSync(path, 'utf8');
    if (!/<head\b/i.test(html)) continue;

    const page = relative(root, path);
    if (isVerificationFile(page)) continue;
    const depth = page.split('/').length - 1;
    const expectedLoader = `${'../'.repeat(depth)}${centralLoader}`;
    const loaderCount = count(/<script\b[^>]*\bsrc\s*=\s*["'][^"']*site-tags\.js[^"']*["'][^>]*>/gi, html);
    const legacy = {
      gtagConfig: count(/gtag\s*\(\s*["']config["']\s*,/gi, html),
      gtagSource: count(/gtag\/js/gi, html),
      gtmBootstrap: count(/["']gtm\.start["']/gi, html),
      gtmSource: count(/googletagmanager\.com\/gtm\.js/gi, html),
      adsenseSource: count(/adsbygoogle\.js/gi, html),
      claritySource: count(/clarity\.ms\/tag/gi, html),
      adsDataSource: count(/assets\/js\/adsData\.js/gi, html),
    };

    if (loaderCount !== 1 || !html.includes(expectedLoader) || Object.values(legacy).some((value) => value > 0)) {
      violations.push({ page, loaderCount, expectedLoader, legacy });
    }
  }

  assert.deepEqual(violations, []);
});

test('site-tags.js centrally loads GTM, AdSense, and Clarity with guards', () => {
  const source = readFileSync(join(root, 'assets/js/site-tags.js'), 'utf8');
  assert.match(source, /GTM-NW3BWPF6/);
  assert.match(source, /ca-pub-5656416032906373/);
  assert.match(source, /tjk39ubxx1/);
  assert.match(source, /__dzPortalSiteTagsLoaded/);
  assert.match(source, /dzExternalSrc/);
  assert.match(source, /data-dz-ads-queued/);
  assert.doesNotMatch(source, /gtag\s*\(\s*["']config["']/i);
});
