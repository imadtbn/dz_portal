#!/usr/bin/env python3
from __future__ import annotations

import html
import re
from datetime import date
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://imadtbn.github.io/dz_portal/"
TODAY = date.today().isoformat()
SKIP = {"google4e08a8803a39e9f9.html", "yandex_eedcfd7f491ddd14.html", "Untitled-1.html", "sectors/adsns.html"}


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def page_url(relative: str) -> str:
    return BASE if relative == "index.html" else urljoin(BASE, relative)


def content_pages() -> list[str]:
    pages = []
    for path in sorted(ROOT.rglob("*.html")):
        relative = path.relative_to(ROOT).as_posix()
        if relative in SKIP or ".git" in path.parts:
            continue
        soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="ignore"), "html.parser")
        if soup.head and soup.title and soup.select_one('link[rel="canonical"]'):
            pages.append(relative)
    return pages


def sitemap_entry(relative: str) -> str:
    url = page_url(relative)
    if relative.startswith("sectors/assurance/"):
        priority, changefreq = "0.75", "monthly"
    elif relative.startswith("sectors/bank/"):
        priority, changefreq = "0.75", "monthly"
    elif relative in {"sectors/assurance.html", "sectors/bank.html", "sectors/mesrs.dz.html", "sectors/progres.mesrs.html"}:
        priority, changefreq = "0.9", "weekly"
    elif relative.startswith("sectors/"):
        priority, changefreq = "0.8", "weekly"
    elif relative.startswith("pages/process/"):
        priority, changefreq = "0.7", "monthly"
    else:
        priority, changefreq = "0.8", "monthly"
    return "\n".join([
        "  <url>",
        f"    <loc>{esc(url)}</loc>",
        f"    <lastmod>{TODAY}</lastmod>",
        f"    <changefreq>{changefreq}</changefreq>",
        f"    <priority>{priority}</priority>",
        f"    <xhtml:link rel=\"alternate\" hreflang=\"ar\" href=\"{esc(url)}\" />",
        "  </url>",
    ])


def update_sitemap() -> int:
    path = ROOT / "sitemap.xml"
    raw = path.read_bytes()
    newline = "\r\n" if b"\r\n" in raw else "\n"
    text = raw.decode("utf-8", errors="ignore").replace("\r\n", "\n").replace("\r", "\n")
    original_text = text
    seen: set[str] = set()
    def keep_unique(match: re.Match[str]) -> str:
        block = match.group(0)
        loc_match = re.search(r"<loc>(.*?)</loc>", block)
        loc = loc_match.group(1) if loc_match else ""
        if loc and loc in seen:
            return ""
        if loc:
            seen.add(loc)
        return block
    text = re.sub(r"\s*<url>.*?</url>", keep_unique, text, flags=re.S)
    existing = set(re.findall(r"<loc>(.*?)</loc>", text))
    missing = [relative for relative in content_pages() if page_url(relative) not in existing]
    if missing:
        additions = "\n" + "\n".join(sitemap_entry(relative) for relative in missing) + "\n"
        text = text.replace("</urlset>", additions + "</urlset>", 1)
    if text != original_text:
        path.write_bytes(text.replace("\n", newline).encode("utf-8"))
    print(f"Added {len(missing)} sitemap URLs")
    return len(missing)


def update_robots() -> None:
    content = f"""# robots.txt - البوابة الجزائرية للخدمات الرقمية
# https://imadtbn.github.io/dz_portal/
# Updated: {TODAY}

User-agent: *
Disallow: /private/
Disallow: /tmp/
Disallow: /cgi-bin/
Disallow: /*?*
Allow: /
Allow: /pages/
Allow: /pages/process/
Allow: /sectors/
Allow: /sectors/assurance/
Allow: /sectors/bank/
Allow: /sectors/mesrs.dz.html
Allow: /sectors/progres.mesrs.html
Allow: /assets/
Allow: /icons/
Allow: /manifest.json
Crawl-delay: 5

# Googlebot لا يدعم Crawl-delay؛ تتم إدارة معدل الزحف عبر Search Console.
User-agent: Googlebot
Disallow: /private/
Disallow: /tmp/
Disallow: /cgi-bin/
Disallow: /*?*
Allow: /
Allow: /pages/
Allow: /pages/process/
Allow: /sectors/
Allow: /sectors/assurance/
Allow: /sectors/bank/
Allow: /sectors/mesrs.dz.html
Allow: /sectors/progres.mesrs.html
Allow: /assets/
Allow: /icons/

User-agent: Bingbot
Disallow: /private/
Disallow: /tmp/
Disallow: /cgi-bin/
Disallow: /*?*
Allow: /
Allow: /pages/
Allow: /pages/process/
Allow: /sectors/
Allow: /sectors/assurance/
Allow: /sectors/bank/
Allow: /sectors/mesrs.dz.html
Allow: /sectors/progres.mesrs.html
Allow: /assets/
Allow: /icons/
Crawl-delay: 10

User-agent: Slurp
Crawl-delay: 10

User-agent: DuckDuckBot
Crawl-delay: 5

User-agent: Yandex
Crawl-delay: 10

Sitemap: {BASE}sitemap.xml
"""
    (ROOT / "robots.txt").write_text(content, encoding="utf-8")
    print("Updated robots.txt")


if __name__ == "__main__":
    update_sitemap()
    update_robots()
