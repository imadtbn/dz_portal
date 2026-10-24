const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const CSS_PATH = path.join(ROOT, 'assets', 'css', 'style-sector.css');
const CSS = fs.readFileSync(CSS_PATH, 'utf8');

test('sector stylesheet keeps vertical spacing compact and responsive', () => {
    assert.match(CSS, /\.content-area\s*\{[\s\S]*?gap:\s*1\.25rem;/);
    assert.match(CSS, /\.content-area\s*>\s*\.ad-container\s*\{[\s\S]*?margin-block:\s*\.5rem;/);
    assert.match(CSS, /\.main-content\s*\{[\s\S]*?padding-block:\s*1\.75rem\s+2rem;/);
    assert.match(CSS, /\.footer\s*\{[\s\S]*?margin-top:\s*1\.5rem;[\s\S]*?padding:\s*2\.5rem\s+2rem\s+1\.25rem;/);
    assert.match(CSS, /@media\s*\(max-width:\s*768px\)[\s\S]*?\.content-area\s*\{[\s\S]*?gap:\s*\.85rem;/);
    assert.match(CSS, /@media\s*\(max-width:\s*768px\)[\s\S]*?\.content-area\s*>\s*\.ad-container\s*\{[\s\S]*?margin-block:\s*\.35rem;/);
    assert.match(CSS, /@media\s*\(max-width:\s*768px\)[\s\S]*?\.footer\s*\{[\s\S]*?margin-top:\s*1rem;/);
});
