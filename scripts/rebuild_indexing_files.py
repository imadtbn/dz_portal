#!/usr/bin/env python3
"""Rebuild the static site's indexing files from canonical HTML pages."""
from __future__ import annotations

import copy
import json
import re
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://imadtbn.github.io/dz_portal/"
TODAY = "2026-08-18"
SITEMAP_PATH = ROOT / "sitemap.xml"
SUBMIT_PATH = ROOT / "submit-url.xml"
ROBOTS_PATH = ROOT / "robots.txt"

SM = "http://www.sitemaps.org/schemas/sitemap/0.9"
XHTML = "http://www.w3.org/1999/xhtml"
IMAGE = "http://www.google.com/schemas/sitemap-image/1.1"
VIDEO = "http://www.google.com/schemas/sitemap-video/1.1"
NS = {"sm": SM, "xhtml": XHTML, "image": IMAGE, "video": VIDEO}

ET.register_namespace("", SM)
ET.register_namespace("xhtml", XHTML)
ET.register_namespace("image", IMAGE)
ET.register_namespace("video", VIDEO)


def qname(namespace: str, name: str) -> str:
    return f"{{{namespace}}}{name}"


def page_url(path: Path) -> str:
    relative = path.relative_to(ROOT).as_posix()
    if relative == "index.html":
        return BASE
    if relative.endswith("/index.html"):
        relative = relative[:-len("index.html")]
    return urljoin(BASE, relative)


def canonical_pages() -> dict[str, tuple[Path, BeautifulSoup]]:
    pages: dict[str, tuple[Path, BeautifulSoup]] = {}
    for path in sorted(ROOT.rglob("*.html")):
        if ".git" in path.parts:
            continue
        soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="ignore"), "html.parser")
        robots = soup.find("meta", attrs={"name": "robots"})
        robots_value = (robots.get("content", "") if robots else "").lower()
        if "noindex" in robots_value:
            continue
        link = soup.find("link", rel=lambda value: value and ("canonical" in value if isinstance(value, str) else "canonical" in value))
        if not link or not link.get("href"):
            continue
        url = urljoin(BASE, link["href"])
        # لا تمثل صفحة alias URL صفحة أخرى في sitemap؛ يجب أن تكون الصفحة self-canonical.
        if url.rstrip("/") != page_url(path).rstrip("/"):
            continue
        pages[url] = (path, soup)
    return pages


def find_video_object(soup: BeautifulSoup) -> dict | None:
    def walk(value: object) -> dict | None:
        if isinstance(value, dict):
            types = value.get("@type", [])
            if isinstance(types, str):
                types = [types]
            if "VideoObject" in types:
                return value
            for child in value.values():
                found = walk(child)
                if found:
                    return found
        elif isinstance(value, list):
            for child in value:
                found = walk(child)
                if found:
                    return found
        return None

    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            data = json.loads(script.string or script.get_text())
        except (TypeError, json.JSONDecodeError):
            continue
        found = walk(data)
        if found:
            return found
    return None


def append_video_from_json(item: ET.Element, soup: BeautifulSoup) -> bool:
    video = find_video_object(soup)
    if not video:
        return False
    node = ET.SubElement(item, qname(VIDEO, "video"))
    thumbnail = video.get("thumbnailUrl", "")
    if isinstance(thumbnail, list):
        thumbnail = thumbnail[0] if thumbnail else ""
    if thumbnail:
        ET.SubElement(node, qname(VIDEO, "thumbnail_loc")).text = thumbnail
    if video.get("name"):
        ET.SubElement(node, qname(VIDEO, "title")).text = video["name"]
    if video.get("description"):
        ET.SubElement(node, qname(VIDEO, "description")).text = video["description"]
    player = video.get("embedUrl") or video.get("contentUrl")
    if player:
        player_node = ET.SubElement(node, qname(VIDEO, "player_loc"))
        player_node.set("allow_embed", "yes")
        player_node.text = player
    return True


def parse_existing_sitemap() -> dict[str, ET.Element]:
    root = ET.parse(SITEMAP_PATH).getroot()
    return {
        node.findtext(qname(SM, "loc")): node
        for node in root.findall(qname(SM, "url"))
        if node.findtext(qname(SM, "loc"))
    }


def child_text(node: ET.Element | None, namespace: str, name: str, default: str = "") -> str:
    if node is None:
        return default
    return node.findtext(qname(namespace, name), default=default) or default


def sort_key(url: str) -> tuple[int, int, str]:
    path = url.removeprefix(BASE).rstrip("/")
    if path == "":
        return (0, 0, path)
    if path.startswith("pages/video"):
        return (1, 0 if path == "pages/video" else 1, path)
    if path.startswith("pages/"):
        return (2, 0, path)
    if path.startswith("sectors/"):
        return (3, 0, path)
    return (4, 0, path)


def build_sitemap(pages: dict[str, tuple[Path, BeautifulSoup]], existing: dict[str, ET.Element]) -> None:
    root = ET.Element(qname(SM, "urlset"))

    for url in sorted(pages, key=sort_key):
        path, soup = pages[url]
        old = existing.get(url)
        item = ET.SubElement(root, qname(SM, "url"))
        ET.SubElement(item, qname(SM, "loc")).text = url
        lastmod = child_text(old, SM, "lastmod", TODAY)
        ET.SubElement(item, qname(SM, "lastmod")).text = lastmod
        changefreq = child_text(old, SM, "changefreq")
        if not changefreq:
            changefreq = "daily" if url == BASE else ("weekly" if url.removeprefix(BASE).startswith(("pages/", "sectors/")) else "monthly")
        ET.SubElement(item, qname(SM, "changefreq")).text = changefreq
        priority = child_text(old, SM, "priority")
        if not priority:
            priority = "1.0" if url == BASE else ("0.9" if url.removeprefix(BASE).startswith(("pages/video", "pages/statistics")) else "0.8")
        ET.SubElement(item, qname(SM, "priority")).text = priority

        old_alternate = old.find(qname(XHTML, "link")) if old is not None else None
        if old_alternate is not None:
            alternate = ET.SubElement(item, qname(XHTML, "link"))
            for key, value in old_alternate.attrib.items():
                alternate.set(key, value)
        elif url == BASE or url.removeprefix(BASE).startswith(("pages/", "sectors/")):
            alternate = ET.SubElement(item, qname(XHTML, "link"))
            alternate.set("rel", "alternate")
            alternate.set("hreflang", "ar")
            alternate.set("href", url)

        old_images = old.findall(qname(IMAGE, "image")) if old is not None else []
        for old_image in old_images:
            item.append(copy.deepcopy(old_image))

        is_standalone_watch_page = path.parent.name == "video" and path.name != "index.html"
        old_videos = old.findall(qname(VIDEO, "video")) if old is not None and is_standalone_watch_page else []
        if old_videos:
            for old_video in old_videos:
                item.append(copy.deepcopy(old_video))
        elif is_standalone_watch_page:
            append_video_from_json(item, soup)

    ET.indent(root, space="  ")
    header = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!-- Sitemap generated from canonical, indexable HTML pages. Updated: 2026-08-18 -->\n"
    SITEMAP_PATH.write_text(header + ET.tostring(root, encoding="unicode") + "\n", encoding="utf-8", newline="\n")


def build_submit_file(pages: dict[str, tuple[Path, BeautifulSoup]]) -> None:
    urls = sorted(pages, key=sort_key)
    lines = [
        "# robots.submiturl - البوابة الجزائرية للخدمات الرقمية",
        f"# {BASE}",
        f"# Generated from canonical pages: {TODAY}",
        f"# Unique URLs: {len(urls)}",
        "# ============================================================",
        "",
        *urls,
        "",
    ]
    SUBMIT_PATH.write_text("\n".join(lines), encoding="utf-8", newline="\n")


def build_robots() -> None:
    lines = [
        "# robots.txt - البوابة الجزائرية للخدمات الرقمية",
        f"# {BASE}",
        f"# Updated: {TODAY}",
        "",
        "User-agent: *",
        "Disallow: /private/",
        "Disallow: /tmp/",
        "Disallow: /cgi-bin/",
        "Disallow: /*?*",
        "Allow: /",
        "Allow: /pages/",
        "Allow: /pages/process/",
        "Allow: /pages/video/",
        "Allow: /sectors/",
        "Allow: /sectors/assurance/",
        "Allow: /sectors/bank/",
        "Allow: /assets/",
        "Allow: /icons/",
        "Allow: /manifest.json",
        "Crawl-delay: 5",
        "",
        "# Googlebot لا يدعم Crawl-delay؛ تتم إدارة معدل الزحف عبر Search Console.",
        "User-agent: Googlebot",
        "Disallow: /private/",
        "Disallow: /tmp/",
        "Disallow: /cgi-bin/",
        "Disallow: /*?*",
        "Allow: /",
        "Allow: /pages/",
        "Allow: /pages/process/",
        "Allow: /pages/video/",
        "Allow: /sectors/",
        "Allow: /assets/",
        "Allow: /icons/",
        "",
        "User-agent: Bingbot",
        "Disallow: /private/",
        "Disallow: /tmp/",
        "Disallow: /cgi-bin/",
        "Disallow: /*?*",
        "Allow: /",
        "Allow: /pages/",
        "Allow: /pages/process/",
        "Allow: /pages/video/",
        "Allow: /sectors/",
        "Allow: /assets/",
        "Allow: /icons/",
        "Crawl-delay: 10",
        "",
        "User-agent: Slurp",
        "Disallow: /private/",
        "Disallow: /tmp/",
        "Disallow: /cgi-bin/",
        "Disallow: /*?*",
        "Allow: /",
        "Allow: /pages/",
        "Allow: /pages/process/",
        "Allow: /pages/video/",
        "Allow: /sectors/",
        "Allow: /assets/",
        "Allow: /icons/",
        "Crawl-delay: 10",
        "",
        "User-agent: DuckDuckBot",
        "Disallow: /private/",
        "Disallow: /tmp/",
        "Disallow: /cgi-bin/",
        "Disallow: /*?*",
        "Allow: /",
        "Allow: /pages/",
        "Allow: /pages/process/",
        "Allow: /pages/video/",
        "Allow: /sectors/",
        "Allow: /assets/",
        "Allow: /icons/",
        "Crawl-delay: 5",
        "",
        "User-agent: Yandex",
        "Disallow: /private/",
        "Disallow: /tmp/",
        "Disallow: /cgi-bin/",
        "Disallow: /*?*",
        "Allow: /",
        "Allow: /pages/",
        "Allow: /pages/process/",
        "Allow: /pages/video/",
        "Allow: /sectors/",
        "Allow: /assets/",
        "Allow: /icons/",
        "Crawl-delay: 10",
        "",
        f"Sitemap: {BASE}sitemap.xml",
        "",
    ]
    ROBOTS_PATH.write_text("\n".join(lines), encoding="utf-8", newline="\n")


def main() -> None:
    pages = canonical_pages()
    existing = parse_existing_sitemap()
    build_sitemap(pages, existing)
    build_submit_file(pages)
    build_robots()
    print(f"rebuilt sitemap={len(pages)} submit_urls={len(pages)} robots=ok")


if __name__ == "__main__":
    main()
