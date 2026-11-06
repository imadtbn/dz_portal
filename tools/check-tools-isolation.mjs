#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const toolsRoot = path.join(root, 'pages', 'tools');
const baseUrl = 'https://imadtbn.github.io/dz_portal/';
const legacyPatterns = [
  /https?:\/\/(?:www\.)?imadtbn\.github\.io\/(?:tools-dz|student-dz)\b/i,
  /raw\.githubusercontent\.com\/imadtbn\/(?:tools-dz|student-dz)\b/i,
  /\b(?:Tools DZ|Student DZ|StudentDZFlashcards|studentDzToolSchema)\b/i,
  /\b(?:tools_dz|toolsdz|studentDz|studentSchedule)(?:[_A-Z][\w-]*)?/i
];
const failures = [];
const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(toolsRoot);

function meta(html, key, attr='property') {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const tag = tags.find(item => item.includes(attr + '="' + key + '"') || item.includes(attr + "='" + key + "'"));
  return tag?.match(/\bcontent=["']([^"']+)["']/i)?.[1] || '';
}
function walkJson(value, callback) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) return value.forEach(item => walkJson(item, callback));
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'string' && /^(?:url|@id|contentUrl)$/i.test(key)) callback(child, key);
    else walkJson(child, callback);
  }
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  for (const pattern of legacyPatterns) if (pattern.test(html)) failures.push(rel + ': contains a legacy project identity or storage namespace');
  if (/imported-tool-shell|tools\/legacy\/|data-shared-header-app/i.test(html)) failures.push(rel + ': references a removed legacy shell or asset path');

  const canonical = html.match(/<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i)?.[1] || '';
  const ogUrl = meta(html, 'og:url');
  const ogImage = meta(html, 'og:image');
  const twitterImage = meta(html, 'twitter:image', 'name');

  if (!canonical.startsWith(baseUrl)) failures.push(rel + ': canonical URL is missing or outside the portal');
  if (ogUrl !== canonical) failures.push(rel + ': og:url does not match canonical URL');
  if (!ogImage.startsWith(baseUrl)) failures.push(rel + ': og:image must be an absolute portal image URL');
  if (!twitterImage.startsWith(baseUrl)) failures.push(rel + ': twitter:image must be an absolute portal image URL');

  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1].trim());
      walkJson(data, value => {
        if (/^https?:\/\/(?:www\.)?imadtbn\.github\.io\/(?:tools-dz|student-dz)\b/i.test(value)) failures.push(rel + ': Schema.org still points to a source project');
      });
    } catch (error) {
      failures.push(rel + ': invalid JSON-LD block (' + error.message + ')');
    }
  }

  for (const match of html.matchAll(/(?:src|href)\s*=\s*["']([^"'#]+)["']/gi)) {
    const value = match[1].trim();
    if (!value || /^(?:https?:|data:|mailto:|tel:|javascript:|#|\/\/)/i.test(value)) continue;
    const clean = value.split(/[?#]/)[0];
    if (!/\.(?:js|css|png|jpe?g|webp|svg|ico|woff2?|ttf|json|pdf)$/i.test(clean)) continue;
    let target;
    if (clean.startsWith('/dz_portal/')) target = path.join(root, clean.slice('/dz_portal/'.length));
    else if (clean.startsWith('/')) continue;
    else target = path.resolve(path.dirname(file), clean);
    if (!fs.existsSync(target)) failures.push(rel + ': missing local resource ' + value);
  }
  if (/<header\b(?=[^>]*class=["'][^"']*dz-import-header)/i.test(html)) failures.push(rel + ': contains duplicate imported header markup');
  if (/<footer\b(?=[^>]*class=["'][^"']*dz-import-footer)/i.test(html)) failures.push(rel + ': contains duplicate imported footer markup');
  if (!rel.endsWith(path.join('pages', 'tools', 'index.html'))) {
    if (!html.includes('assets/js/dz-share.js')) failures.push(rel + ': missing portal share script');
    if (/src=["'][^"']*\/(?:sw|service-worker)\.js/i.test(html)) failures.push(rel + ': page registers an imported service worker');
  }
}

for (const dir of ['assets/js/tools', 'assets/css/tools']) {
  const base = path.join(root, dir);
  if (!fs.existsSync(base)) continue;
  const stack = [base];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && /\.(?:js|css)$/.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf8');
        for (const pattern of legacyPatterns) if (pattern.test(content)) failures.push(path.relative(root, full) + ': contains a legacy project identity or storage namespace');
        if (/\b(?:student-dz|tools-dz)-[^'"\s]+\.(?:json|csv|txt|pdf)/i.test(content)) failures.push(path.relative(root, full) + ': legacy export filename detected');
      }
    }
  }
}

console.log('Checked ' + htmlFiles.length + ' tool pages and local tool assets.');
if (failures.length) {
  console.error(failures.map(item => '- ' + item).join('\n'));
  process.exit(1);
}
console.log('PASS: portal-only social metadata, structured data, storage identity, and local assets.');
