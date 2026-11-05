#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const toolsRoot = path.join(root, 'pages', 'tools');
const sourcePatterns = [
  /https?:\/\/(?:www\.)?imadtbn\.github\.io\/(?:tools-dz|student-dz)\b/i,
  /raw\.githubusercontent\.com\/imadtbn\/(?:tools-dz|student-dz)\b/i
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

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  for (const pattern of sourcePatterns) {
    if (pattern.test(html)) failures.push(rel + ': contains a live source-repository URL');
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
  if (/<header\\b(?=[^>]*(?:id=[\"']main-header[\"']|class=[\"'][^\"']*(?:dz-import-header|site-header|main-header)))/i.test(html)) failures.push(rel + ': contains duplicate legacy header markup');\n  if (/<footer\\b(?=[^>]*(?:id=[\"']main-footer[\"']|class=[\"'][^\"']*(?:dz-import-footer|site-footer|main-footer)))/i.test(html)) failures.push(rel + ': contains duplicate legacy footer markup');\n  if (!rel.endsWith(path.join('pages', 'tools', 'index.html'))) {
    if (!html.includes('assets/js/dz-share.js')) failures.push(rel + ': missing portal share script');
    if (!html.includes('assets/js/tools/imported-tool-shell.js')) failures.push(rel + ': missing unified portal tool shell');
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
        for (const pattern of sourcePatterns) if (pattern.test(content)) failures.push(path.relative(root, full) + ': contains a source-repository URL');
      }
    }
  }
}

console.log('Checked ' + htmlFiles.length + ' tool pages and local tool assets.');
if (failures.length) {
  console.error(failures.map(item => '- ' + item).join('\n'));
  process.exit(1);
}
console.log('PASS: no source-repository URLs or missing local resources detected.');
