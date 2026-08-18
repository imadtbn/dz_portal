#!/usr/bin/env python3
"""Validate the static educational video hub without changing site assets."""
from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlparse

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "pages" / "video" / "index.html"
SITEMAP = ROOT / "sitemap.xml"
EXPECTED_WATCH_PAGES = [
    "arpce-777.html",
    "apostille-registration.html",
    "naftal-tyres.html",
    "awlyaa-registration.html",
    "takwin-registration.html",
]


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def main() -> None:
    if not PAGE.is_file():
        fail(f"missing {PAGE}")

    soup = BeautifulSoup(PAGE.read_text(encoding="utf-8"), "html.parser")
    title = soup.title.get_text(strip=True) if soup.title else ""
    if not title:
        fail("missing title")
    canonical = soup.find("link", rel="canonical")
    if not canonical or canonical.get("href") != "https://imadtbn.github.io/dz_portal/pages/video/":
        fail("canonical is missing or incorrect")
    if not soup.find("meta", attrs={"name": "description"}):
        fail("missing meta description")
    if not soup.find("meta", attrs={"name": "keywords"}):
        fail("missing meta keywords")
    if soup.find("iframe") or "VideoObject" in PAGE.read_text(encoding="utf-8"):
        fail("hub must not contain an iframe or VideoObject")

    json_ld = soup.find_all("script", attrs={"type": "application/ld+json"})
    if len(json_ld) != 1:
        fail("expected exactly one JSON-LD block")
    graph = json.loads(json_ld[0].string or "{}").get("@graph", [])
    types = {node.get("@type") for node in graph}
    for required in {"WebSite", "Organization", "CollectionPage", "BreadcrumbList", "ItemList"}:
        if required not in types:
            fail(f"missing JSON-LD type {required}")
    item_list = next(node for node in graph if node.get("@type") == "ItemList")
    if item_list.get("numberOfItems") != 5 or len(item_list.get("itemListElement", [])) != 5:
        fail("ItemList must contain five watch pages")

    ads = soup.select("ins.adsbygoogle")
    if len(ads) != 2:
        fail(f"expected two AdSense units, found {len(ads)}")
    if any(ad.get("data-ad-client") != "ca-pub-5656416032906373" for ad in ads):
        fail("unexpected AdSense publisher ID")
    if len(soup.select('[aria-label="إعلان"]')) != 2:
        fail("each ad must have a clear accessible label")

    hrefs = {anchor.get("href") for anchor in soup.find_all("a")}
    for filename in EXPECTED_WATCH_PAGES:
        if filename not in hrefs:
            fail(f"missing internal watch link {filename}")
        if not (PAGE.parent / filename).is_file():
            fail(f"missing watch page file {filename}")
    if "../../index.html" not in hrefs:
        fail("missing home link")

    sitemap = SITEMAP.read_text(encoding="utf-8")
    if "https://imadtbn.github.io/dz_portal/pages/video/" not in sitemap:
        fail("hub missing from sitemap")

    for src in [img.get("src") for img in soup.find_all("img")]:
        if not src or urlparse(src).scheme:
            continue
        if not (PAGE.parent / src).resolve().is_file():
            fail(f"missing local image {src}")

    print("validated video hub: seo=ok structured_data=ok ads=2 watch_pages=5 assets=ok sitemap=ok")


if __name__ == "__main__":
    main()
