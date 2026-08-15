#!/usr/bin/env python3
from __future__ import annotations

import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITEMAP = ROOT / 'sitemap.xml'
OUTPUT = ROOT / 'submit-url.xml'
TODAY = date.today().isoformat()

sitemap = SITEMAP.read_text(encoding='utf-8', errors='ignore')
urls = []
seen = set()
for block in re.findall(r'<url>.*?</url>', sitemap, flags=re.S):
    match = re.search(r'<loc>(.*?)</loc>', block)
    if not match:
        continue
    url = match.group(1).strip()
    if url and url not in seen:
        seen.add(url)
        urls.append(url)

header = [
    '# ============================================================',
    '# submit-url - البوابة الجزائرية للخدمات الرقمية',
    '# https://imadtbn.github.io/dz_portal/',
    f'# Updated: {TODAY}',
    '# Source: sitemap.xml (unique page URLs only)',
    '# ============================================================',
    '',
]
OUTPUT.write_text('\n'.join(header + urls) + '\n', encoding='utf-8')
print(f'Wrote {len(urls)} unique page URLs to {OUTPUT}')
