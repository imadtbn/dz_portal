import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sectorsRoot = join(root, 'sectors');

function collectSectorPages(directory) {
  const pages = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      pages.push(...collectSectorPages(path));
    } else if (entry.endsWith('.html')) {
      const html = readFileSync(path, 'utf8');
      if (/<head\b/i.test(html) && /<\/main\s*>/i.test(html)) pages.push(path);
    }
  }
  return pages;
}

function relatedSection(html) {
  return html.match(/<section\b[^>]*related-services-wrapper[^>]*>[\s\S]*?<\/section>/i)?.[0] ?? '';
}

function links(section) {
  return [...section.matchAll(/<a\b[^>]*>/gi)]
    .map(([anchor]) => {
      if (!/class=["'][^"']*\bservice-item\b[^"']*["']/i.test(anchor)) return null;
      return anchor.match(/href=["']([^"']+)["']/i)?.[1] ?? null;
    })
    .filter(Boolean);
}

const sectorPages = collectSectorPages(sectorsRoot);

test('all eligible sector pages contain one Related Sectors section with exactly three cards', () => {
  assert.ok(sectorPages.length > 0, 'No eligible sector pages found');
  for (const path of sectorPages) {
    const html = readFileSync(path, 'utf8');
    const page = relative(root, path);
    assert.equal((html.match(/related-services-wrapper/gi) || []).length, 1, page);
    assert.equal(links(relatedSection(html)).length, 3, `${page}: expected 3 related cards`);
  }
});

test('all Related Sectors links resolve to existing local HTML pages', () => {
  for (const path of sectorPages) {
    const page = relative(root, path);
    for (const href of links(relatedSection(readFileSync(path, 'utf8')))) {
      const target = href.split('#', 1)[0].split('?', 1)[0];
      assert.ok(!/^(?:https?:|mailto:|tel:|javascript:|#)/i.test(target), `${page}: unexpected external target ${href}`);
      const targetPath = join(dirname(path), target);
      assert.ok(existsSync(targetPath), `${page}: missing ${relative(root, targetPath)}`);
      assert.ok(targetPath.endsWith('.html'), `${page}: non-HTML target ${href}`);
      assert.notEqual(targetPath, path, `${page}: self-referencing related link ${href}`);
    }
  }
});
