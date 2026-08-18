from __future__ import annotations

import json
import xml.etree.ElementTree as ET
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path('/home/ubuntu/dz_portal')
TARGETS = [
    'pages/process/arpce2.html',
    'pages/process/arpce.html',
    'pages/process/apostille.html',
    'pages/process/e-mahata.naftal.html',
    'sectors/mfp.gov.html',
    'pages/process/awlyaa-process.html',
]
WATCH = [
    'pages/video/arpce-777.html',
    'pages/video/apostille-registration.html',
    'pages/video/naftal-tyres.html',
    'pages/video/awlyaa-registration.html',
    'pages/video/takwin-registration.html',
]


def graphs(path: Path):
    soup = BeautifulSoup(path.read_text(encoding='utf-8'), 'html.parser')
    found = []
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            found.append(json.loads(script.string or script.get_text()))
        except json.JSONDecodeError as exc:
            raise AssertionError(f'invalid JSON-LD: {path}: {exc}') from exc
    return soup, found


def nodes(data):
    out = []
    for graph in data:
        if isinstance(graph, dict) and isinstance(graph.get('@graph'), list):
            out.extend(graph['@graph'])
        elif isinstance(graph, dict):
            out.append(graph)
    return out


for rel in TARGETS:
    path = ROOT / rel
    soup, data = graphs(path)
    if rel == 'sectors/mfp.gov.html':
        assert not soup.select_one('iframe.video-primary-embed'), 'sector page must not embed video: mfp.gov.html'
        assert not soup.select_one('[data-video-watch-page]'), 'sector page must not claim to be a watch page: mfp.gov.html'
        assert soup.select_one('a[href*="pages/video/takwin-registration.html"]'), 'missing descriptive watch-page link: mfp.gov.html'
        videos = [node for node in nodes(data) if 'VideoObject' in (node.get('@type', []) if isinstance(node.get('@type'), list) else [node.get('@type')])]
        assert not videos, 'sector page must not contain VideoObject without visible video: mfp.gov.html'
        continue
    assert soup.select_one('[data-video-watch-page]'), f'missing watch-page marker: {rel}'
    assert soup.select_one('iframe.video-primary-embed'), f'missing primary iframe: {rel}'
    assert soup.select_one('link[rel="video-watch-page"]'), f'missing watch link: {rel}'
    videos = [node for node in nodes(data) if 'VideoObject' in (node.get('@type', []) if isinstance(node.get('@type'), list) else [node.get('@type')])]
    assert videos, f'missing VideoObject: {rel}'
    video = videos[-1]
    assert video.get('mainEntityOfPage', {}).get('@id', '').endswith('#webpage'), f'missing mainEntityOfPage: {rel}'
    assert video.get('embedUrl'), f'missing embedUrl: {rel}'
    assert video.get('thumbnailUrl'), f'missing thumbnailUrl: {rel}'

for rel in WATCH:
    path = ROOT / rel
    soup, data = graphs(path)
    assert soup.select_one('meta[name="robots"][content*="max-video-preview"]'), f'missing video robots: {rel}'
    assert soup.select_one('iframe.video-primary-embed'), f'missing watch iframe: {rel}'
    assert soup.select_one('link[rel="canonical"]'), f'missing canonical: {rel}'
    videos = [node for node in nodes(data) if 'VideoObject' in (node.get('@type', []) if isinstance(node.get('@type'), list) else [node.get('@type')])]
    assert len(videos) == 1, f'expected one VideoObject: {rel}'
    video = videos[0]
    assert video.get('mainEntityOfPage', {}).get('@id', '').endswith('#webpage'), f'missing mainEntityOfPage: {rel}'
    assert video.get('potentialAction', {}).get('@type') == 'WatchAction', f'missing WatchAction: {rel}'

root = ET.parse(ROOT / 'sitemap.xml').getroot()
assert root.tag.endswith('urlset'), 'sitemap root is not urlset'
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9', 'v': 'http://www.google.com/schemas/sitemap-video/1.1'}
locs = {node.findtext('s:loc', namespaces=ns) for node in root.findall('s:url', ns)}
for rel in WATCH:
    assert 'https://imadtbn.github.io/dz_portal/' + rel in locs, f'missing sitemap url: {rel}'
assert len(locs) == len(root.findall('s:url', ns)), 'duplicate sitemap locs'
assert root.findall('.//v:video', ns), 'no video sitemap entries'
print(f'validated targets={len(TARGETS)} watch_pages={len(WATCH)} sitemap_urls={len(locs)}')
