import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

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

test('each HTML page has at most one Analytics and GTM bootstrap', () => {
  const duplicatePages = [];

  for (const path of collectHtmlFiles(root)) {
    const html = readFileSync(path, 'utf8');
    const gtagConfigCount = (html.match(/gtag\(\s*["']config["']\s*,/gi) || []).length;
    const gtmBootstrapCount = (html.match(/['"]gtm\.start['"]/gi) || []).length;

    if (gtagConfigCount > 1 || gtmBootstrapCount > 1) {
      duplicatePages.push({
        page: relative(root, path),
        gtagConfigCount,
        gtmBootstrapCount,
      });
    }
  }

  assert.deepEqual(duplicatePages, []);
});
