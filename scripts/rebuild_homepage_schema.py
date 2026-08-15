#!/usr/bin/env python3
"""Rebuild the homepage JSON-LD graph from the portal's actual local pages and cards."""

from __future__ import annotations

import html
import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://imadtbn.github.io/dz_portal/"
TODAY = date.today().isoformat()
INDEX = ROOT / "index.html"


def clean(value: str, limit: int = 240) -> str:
    value = re.sub(r"\s+", " ", value or "").strip()
    return value[:limit].rstrip(" ,،؛:.-")


def page_url(relative: str) -> str:
    return BASE if relative == "index.html" else urljoin(BASE, relative)


def absolute(value: str, base: str = BASE) -> str:
    return urljoin(base, (value or "").strip())


def page_info(relative: str) -> dict | None:
    path = ROOT / relative
    if not path.exists():
        return None
    soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="ignore"), "html.parser")
    if not soup.head or not soup.title:
        return None
    title = clean(soup.title.get_text(" ", strip=True), 150)
    description_tag = soup.select_one('meta[name="description"]')
    description = clean(description_tag.get("content", "") if description_tag else "", 240)
    if not description:
        description = f"الخدمات والروابط الرقمية المتاحة في صفحة {title}."
    image_tag = soup.select_one('meta[property="og:image"], link[rel="apple-touch-icon"], link[rel="icon"]')
    image_value = image_tag.get("content") if image_tag and image_tag.has_attr("content") else image_tag.get("href") if image_tag else "assets/images/icon.png"
    return {
        "relative": relative,
        "url": page_url(relative),
        "name": title,
        "description": description,
        "image": absolute(image_value),
    }


def schema_item(info: dict, item_type: str = "WebPage") -> dict:
    item = {
        "@type": item_type,
        "@id": f"{info['url']}#webpage" if item_type == "WebPage" else info["url"],
        "name": info["name"],
        "url": info["url"],
    }
    if info.get("description"):
        item["description"] = info["description"]
    if item_type == "WebPage":
        item["isPartOf"] = {"@id": f"{BASE}#website"}
        item["inLanguage"] = "ar-DZ"
    return item


def homepage_cards(soup: BeautifulSoup) -> list[dict]:
    selectors = ".sector-card, .service-item, .service-card, .app-card, .resource-card, .news-card"
    result: list[dict] = []
    seen: set[str] = set()
    for card in soup.select(selectors):
        link = card if card.name == "a" and card.get("href") else card.select_one("a[href]")
        if not link:
            continue
        target = absolute(link.get("href", ""))
        if not target or target.startswith(("mailto:", "tel:", "javascript:")) or target in seen:
            continue
        heading = card.select_one("h2, h3, h4, h5, .service-title, .sector-title, strong") or link
        name = clean(heading.get_text(" ", strip=True), 150)
        if not name:
            continue
        paragraph = card.select_one("p, .service-description, .card-description")
        description = clean(paragraph.get_text(" ", strip=True) if paragraph else card.get_text(" ", strip=True).replace(name, ""), 240)
        item_type = "WebPage" if "/dz_portal/" in target else "Service"
        result.append({"name": name, "url": target, "description": description, "item_type": item_type})
        seen.add(target)
    return result


def item_list(identifier: str, name: str, description: str, items: list[dict]) -> dict:
    return {
        "@type": "ItemList",
        "@id": f"{BASE}#{identifier}",
        "name": name,
        "description": description,
        "numberOfItems": len(items),
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": index,
                "item": item,
            }
            for index, item in enumerate(items, 1)
        ],
    }


def local_sector_items() -> list[dict]:
    items: list[dict] = []
    for path in sorted((ROOT / "sectors").rglob("*.html")):
        relative = path.relative_to(ROOT).as_posix()
        info = page_info(relative)
        if not info:
            continue
        items.append(schema_item(info, "WebPage"))
    return items


def group_items(prefix: str) -> list[dict]:
    items: list[dict] = []
    for path in sorted((ROOT / prefix).rglob("*.html")):
        relative = path.relative_to(ROOT).as_posix()
        info = page_info(relative)
        if info:
            items.append(schema_item(info, "WebPage"))
    return items


def page_cards(relative: str) -> list[dict]:
    path = ROOT / relative
    soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="ignore"), "html.parser")
    base = page_url(relative)
    result: list[dict] = []
    seen: set[str] = set()
    for card in soup.select(".service-item, .service-card, .platform-card, .application-card, .app-card, .resource-card"):
        link = card if card.name == "a" and card.get("href") else card.select_one("a[href]")
        if not link:
            continue
        target = absolute(link.get("href", ""), base)
        if not target or target.startswith(("mailto:", "tel:", "javascript:")) or target in seen:
            continue
        heading = card.select_one("h2, h3, h4, h5, .service-title, .platform-title, strong") or link
        name = clean(heading.get_text(" ", strip=True), 150)
        paragraph = card.select_one("p, .service-description, .card-description")
        description = clean(paragraph.get_text(" ", strip=True) if paragraph else card.get_text(" ", strip=True).replace(name, ""), 240)
        result.append({
            "@type": "ListItem",
            "position": len(result) + 1,
            "item": {"@type": "Service", "name": name, "url": target, **({"description": description} if description else {})},
        })
        seen.add(target)
    return result


def collection_node(identifier: str, info: dict, list_identifier: str, description: str) -> dict:
    return {
        "@type": "CollectionPage",
        "@id": f"{info['url']}#collection",
        "url": info["url"],
        "name": info["name"],
        "description": description,
        "inLanguage": "ar-DZ",
        "isPartOf": {"@id": f"{BASE}#website"},
        "publisher": {"@id": f"{BASE}#organization"},
        "dateModified": TODAY,
        "mainEntity": {"@id": f"{BASE}#{list_identifier}"},
    }


def rebuild() -> None:
    raw = INDEX.read_bytes()
    newline = "\r\n" if b"\r\n" in raw else "\n"
    text = raw.decode("utf-8", errors="ignore").replace("\r\n", "\n").replace("\r", "\n")
    soup = BeautifulSoup(text, "html.parser")
    title = clean(soup.title.get_text(" ", strip=True), 150)
    description_tag = soup.select_one('meta[name="description"]')
    description = clean(description_tag.get("content", "") if description_tag else "", 240)
    image_tag = soup.select_one('meta[property="og:image"]')
    image = image_tag.get("content") if image_tag else urljoin(BASE, "assets/images/icon.png")

    sector_items = local_sector_items()
    featured_items = [
        {"@type": card["item_type"], "name": card["name"], "url": card["url"], **({"description": card["description"]} if card["description"] else {})}
        for card in homepage_cards(soup)
    ]
    insurance_info = page_info("sectors/assurance.html")
    bank_info = page_info("sectors/bank.html")
    mesrs_info = page_info("sectors/mesrs.dz.html")
    progres_info = page_info("sectors/progres.mesrs.html")
    insurance_items = group_items("sectors/assurance")
    bank_items = group_items("sectors/bank")
    mesrs_items = page_cards("sectors/mesrs.dz.html") if mesrs_info else []
    if progres_info:
        mesrs_items.insert(0, {"@type": "ListItem", "position": 1, "item": schema_item(progres_info, "WebPage")})
        for position, node in enumerate(mesrs_items, 1):
            node["position"] = position

    website = {
        "@type": "WebSite",
        "@id": f"{BASE}#website",
        "url": BASE,
        "name": "البوابة الجزائرية للخدمات الرقمية",
        "alternateName": ["DZ Portal", "DZ E-Services Portal", "البوابة الرقمية للخدمات الجزائرية"],
        "description": "منصة موحدة للوصول إلى الخدمات الحكومية والعمومية الرقمية في الجزائر.",
        "inLanguage": "ar-DZ",
        "publisher": {"@id": f"{BASE}#organization"},
        "hasPart": [
            {"@id": f"{info['url']}#collection"}
            for info in (insurance_info, bank_info, mesrs_info)
            if info
        ],
    }
    organization = {
        "@type": "Organization",
        "@id": f"{BASE}#organization",
        "name": "البوابة الجزائرية للخدمات الرقمية",
        "url": BASE,
        "logo": {"@type": "ImageObject", "url": urljoin(BASE, "assets/images/icon.png")},
        "email": "tabaniimadeddine@gmail.com",
        "areaServed": {"@type": "Country", "name": "الجزائر"},
    }
    webpage = {
        "@type": ["WebPage", "CollectionPage"],
        "@id": f"{BASE}#webpage",
        "url": BASE,
        "name": title,
        "description": description,
        "inLanguage": "ar-DZ",
        "isPartOf": {"@id": f"{BASE}#website"},
        "about": {"@type": "GovernmentService", "name": "الخدمات الحكومية والعمومية الرقمية في الجزائر", "areaServed": {"@type": "Country", "name": "الجزائر"}},
        "publisher": {"@id": f"{BASE}#organization"},
        "primaryImageOfPage": {"@type": "ImageObject", "url": image},
        "datePublished": "2026-08-15",
        "dateModified": TODAY,
        "breadcrumb": {"@id": f"{BASE}#breadcrumb"},
        "mainEntity": {"@id": f"{BASE}#sector-catalog"},
    }
    breadcrumb = {
        "@type": "BreadcrumbList",
        "@id": f"{BASE}#breadcrumb",
        "itemListElement": [{"@type": "ListItem", "position": 1, "name": "الرئيسية", "item": BASE}],
    }
    sector_list = item_list("sector-catalog", "دليل القطاعات والخدمات الرقمية في الجزائر", "قائمة شاملة بالقطاعات والصفحات المحلية للخدمات الرقمية في البوابة الجزائرية.", sector_items)
    featured_list = item_list("featured-services", "الخدمات والروابط الرقمية المميزة", "الخدمات والروابط الظاهرة في الصفحة الرئيسية للبوابة.", featured_items)
    graph = [website, organization, webpage, breadcrumb, sector_list, featured_list]
    if insurance_info:
        graph.append(collection_node("insurance", insurance_info, "insurance-catalog", "دليل وكالات وشركات التأمين والخدمات الرقمية المرتبطة بها في الجزائر."))
        graph.append(item_list("insurance-catalog", "وكالات التأمين في الجزائر", "قائمة صفحات وكالات وشركات التأمين المدرجة في البوابة.", insurance_items))
    if bank_info:
        graph.append(collection_node("banking", bank_info, "banking-catalog", "دليل البنوك العمومية والخاصة والخدمات البنكية الرقمية في الجزائر."))
        graph.append(item_list("banking-catalog", "البنوك في الجزائر", "قائمة صفحات البنوك والخدمات البنكية المدرجة في البوابة.", bank_items))
    if mesrs_info:
        graph.append(collection_node("mesrs", mesrs_info, "mesrs-catalog", "دليل منصات وزارة التعليم العالي والبحث العلمي والخدمات الجامعية الرقمية في الجزائر."))
        graph.append(item_list("mesrs-catalog", "منصات وزارة التعليم العالي والبحث العلمي", "قائمة منصات وخدمات وزارة التعليم العالي والبحث العلمي، بما فيها خدمات الطالب والتعليم عن بعد والبحث والابتكار.", mesrs_items))

    payload = {"@context": "https://schema.org", "@graph": graph}
    jsonld = "    <script type=\"application/ld+json\">\n" + json.dumps(payload, ensure_ascii=False, indent=4) + "\n    </script>"
    pattern = re.compile(r"\s*<script\b(?=[^>]*\btype\s*=\s*[\"']application/ld\+json[\"'])[^>]*>.*?</script>", re.I | re.S)
    if not pattern.search(text):
        raise RuntimeError("No JSON-LD script found in index.html")
    result = pattern.sub("\n" + jsonld, text, count=1)
    INDEX.write_bytes(result.replace("\n", newline).encode("utf-8"))
    print(json.dumps({
        "sectorItems": len(sector_items),
        "featuredItems": len(featured_items),
        "insuranceItems": len(insurance_items),
        "bankingItems": len(bank_items),
        "mesrsItems": len(mesrs_items),
        "graphNodes": len(graph),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    rebuild()
