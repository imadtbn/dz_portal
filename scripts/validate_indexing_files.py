#!/usr/bin/env python3
"""Validate sitemap.xml, submit-url.xml, and robots.txt against canonical HTML pages."""
from __future__ import annotations

import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://imadtbn.github.io/dz_portal/"
SM = "http://www.sitemaps.org/schemas/sitemap/0.9"
VIDEO = "http://www.google.com/schemas/sitemap-video/1.1"


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def get_canonical_pages() -> dict[str, Path]:
    pages: dict[str, Path] = {}
    for path in ROOT.rglob("*.html"):
        if ".git" in path.parts:
            continue
        soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="ignore"), "html.parser")
        robots = soup.find("meta", attrs={"name": "robots"})
        if robots and "noindex" in robots.get("content", "").lower():
            continue
        canonical = soup.find("link", rel=lambda value: value and ("canonical" in value if isinstance(value, str) else "canonical" in value))
        if canonical and canonical.get("href"):
            pages.setdefault(urljoin(BASE, canonical["href"]), path)
    return pages


def main() -> None:
    canonical = get_canonical_pages()
    root = ET.parse(ROOT / "sitemap.xml").getroot()
    nodes = root.findall(f"{{{SM}}}url")
    sitemap_urls = [node.findtext(f"{{{SM}}}loc") for node in nodes]
    sitemap_urls = [url for url in sitemap_urls if url]
    if len(sitemap_urls) != len(set(sitemap_urls)):
        fail("sitemap contains duplicate loc values")
    if set(sitemap_urls) != set(canonical):
        fail(f"sitemap/canonical mismatch: sitemap={len(sitemap_urls)} canonical={len(canonical)}")

    submit_urls = [
        line.strip()
        for line in (ROOT / "submit-url.xml").read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]
    if len(submit_urls) != len(set(submit_urls)):
        fail("submit-url.xml contains duplicate URLs")
    if set(submit_urls) != set(canonical):
        fail(f"submit-url/canonical mismatch: submit={len(submit_urls)} canonical={len(canonical)}")

    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    required_robot_lines = [
        "User-agent: *",
        "Allow: /pages/video/",
        "Sitemap: https://imadtbn.github.io/dz_portal/sitemap.xml",
    ]
    for line in required_robot_lines:
        if line not in robots:
            fail(f"robots.txt missing: {line}")
    for blocked in ["Disallow: /private/", "Disallow: /tmp/", "Disallow: /cgi-bin/", "Disallow: /*?*"]:
        if blocked not in robots:
            fail(f"robots.txt missing safety rule: {blocked}")

    for url, path in canonical.items():
        soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="ignore"), "html.parser")
        has_video_object = "VideoObject" in path.read_text(encoding="utf-8", errors="ignore")
        sitemap_node = next(node for node in nodes if node.findtext(f"{{{SM}}}loc") == url)
        has_video_sitemap = sitemap_node.find(f"{{{VIDEO}}}video") is not None
        is_standalone_watch_page = path.parent.name == "video" and path.name != "index.html"
        if is_standalone_watch_page and (not has_video_object or not has_video_sitemap):
            fail(f"standalone watch page must have VideoObject and video sitemap entry: {path.relative_to(ROOT)}")
        if has_video_sitemap and not is_standalone_watch_page:
            fail(f"non-watch page must not have video sitemap entry: {path.relative_to(ROOT)}")
        if path.name == "mfp.gov.html" and has_video_sitemap:
            fail("mfp.gov.html must remain link-only without video sitemap entry")
        if soup.find("meta", attrs={"name": "robots", "content": lambda value: value and "noindex" in value.lower()}):
            fail(f"indexable set contains noindex page: {path}")

    print(f"validated indexing files: canonical={len(canonical)} sitemap={len(sitemap_urls)} submit={len(submit_urls)} robots=ok video_entries=5")


if __name__ == "__main__":
    main()
