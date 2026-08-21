const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SEARCH_DATA_PATH = path.join(ROOT, 'assets', 'js', 'searchData.js');
const KNOWN_BROKEN_LINKS_PATH = path.join(__dirname, 'known-broken-links.json');
const HTML_EXTENSIONS = new Set(['.html', '.htm']);
const IGNORED_SCHEMES = /^(?:javascript|data|blob):/i;
const EXTERNAL_SCHEMES = /^(?:https?|ftp):/i;
const SPECIAL_SCHEMES = /^(?:mailto|tel|sms|whatsapp):/i;

function walkFiles(directory) {
    const files = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.name === '.git' || entry.name === 'node_modules') continue;
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...walkFiles(fullPath));
        else files.push(fullPath);
    }
    return files;
}

function htmlFiles() {
    return walkFiles(ROOT).filter((file) => HTML_EXTENSIONS.has(path.extname(file).toLowerCase()));
}

function readHtml(file) {
    return fs.readFileSync(file, 'utf8');
}

function extractAttributeReferences(html) {
    const references = [];
    const attributePattern = /\bhref\s*=\s*(["'])(.*?)\1/giu;
    let match;
    while ((match = attributePattern.exec(html)) !== null) {
        references.push({ attribute: 'href', value: match[2].trim() });
    }
    return references;
}

function splitReference(reference) {
    const hashIndex = reference.indexOf('#');
    if (hashIndex === -1) return { target: reference, fragment: '' };
    return { target: reference.slice(0, hashIndex), fragment: reference.slice(hashIndex + 1) };
}

function resolveLocalReference(reference, sourceFile) {
    const { target, fragment } = splitReference(reference);
    if (!target) return { file: sourceFile, fragment };
    let relativeTarget = target;
    if (relativeTarget.startsWith('/')) {
        relativeTarget = relativeTarget.replace(/^\/(?:dz_portal\/)?/, '');
    }
    let file = path.resolve(path.dirname(sourceFile), relativeTarget);
    if (relativeTarget.endsWith('/')) file = path.join(file, 'index.html');
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    return { file: path.normalize(file), fragment };
}

function idsInHtml(html) {
    const ids = new Set();
    const idPattern = /\bid\s*=\s*(["'])(.*?)\1/giu;
    let match;
    while ((match = idPattern.exec(html)) !== null) ids.add(match[2]);
    return ids;
}

function loadSearchData() {
    const source = fs.readFileSync(SEARCH_DATA_PATH, 'utf8');
    const sandbox = {
        document: { getElementById: () => null },
        window: {},
        console,
    };
    vm.runInNewContext(`${source}\n;globalThis.__searchData = searchData;\n;globalThis.__getSearchMatches = getSearchMatches;`, sandbox, {
        filename: SEARCH_DATA_PATH,
    });
    return { searchData: sandbox.__searchData, getSearchMatches: sandbox.__getSearchMatches };
}

function activeHtml(html) {
    return html.replace(/<!--[\s\S]*?-->/g, '');
}

function loadKnownBrokenLinks() {
    return new Map(Object.entries(JSON.parse(fs.readFileSync(KNOWN_BROKEN_LINKS_PATH, 'utf8'))));
}

function isLocalReference(reference) {
    return reference && !reference.startsWith('#') && !reference.startsWith('//')
        && !EXTERNAL_SCHEMES.test(reference) && !SPECIAL_SCHEMES.test(reference)
        && !IGNORED_SCHEMES.test(reference);
}

function isPageReference(reference) {
    const { target } = splitReference(reference);
    if (!target) return false;
    if (target.endsWith('/')) return true;
    const cleanTarget = target.split('?', 1)[0].toLowerCase();
    return HTML_EXTENSIONS.has(path.extname(cleanTarget));
}

test('all active local HTML links resolve to existing files and fragments', () => {
    const errors = [];
    const knownBrokenLinks = loadKnownBrokenLinks();
    const observedKnownBrokenLinks = new Set();
    for (const sourceFile of htmlFiles()) {
        const sourceHtml = activeHtml(readHtml(sourceFile));
        const sourceKey = path.relative(ROOT, sourceFile).split(path.sep).join('/');
        const sourceIds = idsInHtml(sourceHtml);
        for (const { attribute, value } of extractAttributeReferences(sourceHtml)) {
            if (!value || !isLocalReference(value) || !isPageReference(value)) continue;
            const { file, fragment } = resolveLocalReference(value, sourceFile);
            if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
                const key = `${sourceKey}|${value}`;
                if (knownBrokenLinks.has(key)) observedKnownBrokenLinks.add(key);
                else errors.push(`${sourceKey}: ${attribute}=${value} -> missing ${path.relative(ROOT, file)}`);
                continue;
            }
            if (!fragment) continue;
            const targetHtml = file.toLowerCase().endsWith('.html') || file.toLowerCase().endsWith('.htm')
                ? activeHtml(readHtml(file))
                : '';
            if (targetHtml && !idsInHtml(targetHtml).has(decodeURIComponent(fragment))) {
                errors.push(`${sourceKey}: ${attribute}=${value} -> missing #${fragment}`);
            }
        }
        // A page-local hash must always point to an element in the same page.
        for (const { attribute, value } of extractAttributeReferences(sourceHtml)) {
            if (!value.startsWith('#') || value.length === 1) continue;
            const fragment = decodeURIComponent(value.slice(1));
            if (!sourceIds.has(fragment)) {
                errors.push(`${sourceKey}: ${attribute}=${value} -> missing local id`);
            }
        }
    }
    const staleAllowlistEntries = [...knownBrokenLinks.keys()].filter((key) => !observedKnownBrokenLinks.has(key));
    for (const key of staleAllowlistEntries) errors.push(`known broken-link entry is no longer observed: ${key}`);
    if (observedKnownBrokenLinks.size > 0) {
        console.warn(`# tracked legacy broken page links: ${observedKnownBrokenLinks.size}`);
    }
    assert.deepEqual(errors, [], errors.slice(0, 30).join('\n'));
});

test('searchData.js loads and contains valid, resolvable records', () => {
    const { searchData, getSearchMatches } = loadSearchData();
    assert.ok(Array.isArray(searchData), 'searchData must be an array');
    assert.ok(searchData.length > 0, 'searchData must not be empty');
    for (const [index, item] of searchData.entries()) {
        assert.equal(typeof item.title, 'string', `record ${index} title must be a string`);
        assert.ok(item.title.trim(), `record ${index} title must not be empty`);
        assert.equal(typeof item.desc, 'string', `record ${index} desc must be a string`);
        assert.equal(typeof item.url, 'string', `record ${index} url must be a string`);
        assert.ok(item.url.trim(), `record ${index} url must not be empty`);
        assert.ok(Array.isArray(item.keywords), `record ${index} keywords must be an array`);
        assert.ok(item.keywords.length > 0, `record ${index} keywords must not be empty`);
        assert.ok(item.keywords.every((keyword) => typeof keyword === 'string' && keyword.trim()), `record ${index} keywords must be non-empty strings`);
        if (isLocalReference(item.url)) {
            const { file, fragment } = resolveLocalReference(item.url, path.join(ROOT, 'index.html'));
            assert.ok(fs.existsSync(file), `search record ${item.title} points to missing ${item.url}`);
            if (fragment && file.toLowerCase().endsWith('.html')) {
                assert.ok(idsInHtml(readHtml(file)).has(decodeURIComponent(fragment)), `search record ${item.title} points to missing #${fragment}`);
            }
        } else if (EXTERNAL_SCHEMES.test(item.url)) {
            assert.doesNotThrow(() => new URL(item.url), `search record ${item.title} has invalid external URL`);
        }
    }

    const expectedMatches = [
        ['سونلغاز', 'سونلغاز'],
        ['3303', 'سونلغاز'],
        ['منصة الاتصال سونلغاز', 'سونلغاز'],
        ['لجنة ضبط الكهرباء والغاز', 'لجنة ضبط الكهرباء والغاز (CREG)'],
    ];
    for (const [query, expectedTitle] of expectedMatches) {
        const { matches } = getSearchMatches(query);
        assert.ok(matches.length > 0, `search query ${query} returned no results`);
        assert.ok(matches.some(({ item }) => item.title === expectedTitle), `search query ${query} missed ${expectedTitle}`);
    }
});

test('searchData.js has no duplicate URLs for exact duplicate records', () => {
    const { searchData } = loadSearchData();
    const seen = new Map();
    const duplicates = [];
    for (const item of searchData) {
        const key = `${item.title}\u0000${item.url}`;
        if (seen.has(key)) duplicates.push(`${item.title} -> ${item.url}`);
        else seen.set(key, true);
    }
    assert.deepEqual(duplicates, [], `duplicate title/url records:\n${duplicates.join('\n')}`);
});
