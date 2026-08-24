#!/usr/bin/env python3
"""Build page-specific SEO metadata for the static DZ Portal HTML pages."""

from __future__ import annotations

import html
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://imadtbn.github.io/dz_portal/"
SKIP_FILES = {"google4e08a8803a39e9f9.html", "yandex_eedcfd7f491ddd14.html"}
KEYWORD_CATALOG = ROOT / "seo" / "keyword-catalog.json"
META_RE = re.I | re.S


def load_keyword_catalog() -> dict[str, list[str]]:
    try:
        payload = json.loads(KEYWORD_CATALOG.read_text(encoding="utf-8"))
        return {item["path"]: item.get("keywords", []) for item in payload.get("sectors", []) if item.get("path")}
    except (OSError, json.JSONDecodeError, TypeError):
        return {}


KEYWORD_MAP = load_keyword_catalog()


def esc(value: str) -> str:
    return html.escape(str(value or ""), quote=True)


def canonical_for(relative: str) -> str:
    return BASE if relative == "index.html" else urljoin(BASE, relative)


def absolute_url(page_url: str, value: str) -> str:
    value = (value or "").strip()
    if not value or value.startswith("data:") or value.startswith("javascript:"):
        return ""
    return urljoin(page_url, value)


def first_tag(soup: BeautifulSoup, selector: str) -> str:
    node = soup.select_one(selector)
    return node.get_text(" ", strip=True) if node else ""


def clean_text(value: str, limit: int = 300) -> str:
    value = re.sub(r"\s+", " ", value or "").strip()
    return value[:limit].rstrip(" ,،؛:.-")


def page_name(soup: BeautifulSoup, title: str, relative: str) -> str:
    name = first_tag(soup, "main h1, .sector-hero h1, .sector-hero h2, h1, h2")
    if name:
        return clean_text(name, 120)
    base = re.split(r"\s*[|–—-]\s*", title, maxsplit=1)[0].strip()
    if base:
        return clean_text(base, 120)
    return Path(relative).stem.replace(".", " ").replace("-", " ").strip() or "البوابة الجزائرية للخدمات الرقمية"


def get_meta(head: str, attribute: str, value: str) -> list[str]:
    pattern = re.compile(rf'<meta\b(?=[^>]*\b{attribute}\s*=\s*["\']{re.escape(value)}["\'])[^>]*>', META_RE)
    return pattern.findall(head)


def replace_meta(head: str, attribute: str, value: str, content: str) -> str:
    pattern = re.compile(rf'\s*<meta\b(?=[^>]*\b{attribute}\s*=\s*["\']{re.escape(value)}["\'])[^>]*>', META_RE)
    tag = f'\n    <meta {attribute}="{esc(value)}" content="{esc(content)}">'
    head = pattern.sub("", head)
    return head.replace("</head>", tag + "\n</head>", 1)


def replace_link_rel(head: str, rel: str, tag: str) -> str:
    pattern = re.compile(rf'\s*<link\b(?=[^>]*\brel\s*=\s*["\'][^"\']*\b{re.escape(rel)}\b[^"\']*["\'])[^>]*>', META_RE)
    head = pattern.sub("", head)
    return head.replace("</head>", "\n    " + tag + "\n</head>", 1)


def replace_title(head: str, title: str) -> str:
    pattern = re.compile(r"\s*<title\b[^>]*>.*?</title>", META_RE)
    tag = f"\n    <title>{esc(title)}</title>"
    if pattern.search(head):
        return pattern.sub(tag, head, count=1)
    return head.replace("</head>", tag + "\n</head>", 1)


def existing_jsonld(head: str) -> list[dict]:
    blocks = re.findall(r'<script\b(?=[^>]*\btype\s*=\s*["\']application/ld\+json["\'])[^>]*>(.*?)</script>', head, META_RE)
    nodes: list[dict] = []
    for raw in blocks:
        try:
            payload = json.loads(raw.strip())
        except json.JSONDecodeError:
            continue
        if isinstance(payload, dict) and isinstance(payload.get("@graph"), list):
            nodes.extend(item for item in payload["@graph"] if isinstance(item, dict))
        elif isinstance(payload, dict):
            nodes.append(payload)
        elif isinstance(payload, list):
            nodes.extend(item for item in payload if isinstance(item, dict))
    return nodes


def node_types(node: dict) -> set[str]:
    value = node.get("@type", [])
    return set(value if isinstance(value, list) else [value])


def merge_node(existing: dict | None, generated: dict) -> dict:
    result = dict(existing or {})
    result.update(generated)
    return result


def git_dates(relative: str) -> tuple[str, str]:
    try:
        result = subprocess.run(
            ["git", "log", "--follow", "--format=%aI", "--", relative],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        values = [line.strip() for line in result.stdout.splitlines() if line.strip()]
        if values:
            return values[-1], values[0]
    except (OSError, subprocess.CalledProcessError):
        pass
    today = datetime.now(timezone.utc).isoformat(timespec="seconds")
    return today, today


def make_keywords(soup: BeautifulSoup, title: str, existing: str, relative: str = "") -> str:
    candidates: list[str] = []
    catalog_keywords = KEYWORD_MAP.get(relative, [])
    candidates.extend(catalog_keywords)
    if not catalog_keywords and existing:
        candidates.extend(part.strip() for part in re.split(r"[,،]", existing) if part.strip())
    candidates.append(re.split(r"\s*[|–—-]\s*", title, maxsplit=1)[0].strip())
    for node in soup.select("main h1, main h2, main h3, .service-title, .sector-title, .section-title")[:12]:
        value = clean_text(node.get_text(" ", strip=True), 90)
        if value and value not in candidates:
            candidates.append(value)
    seen: set[str] = set()
    result: list[str] = []
    for candidate in candidates:
        key = re.sub(r"\s+", " ", candidate).casefold()
        if len(key) < 2 or key in seen:
            continue
        seen.add(key)
        result.append(candidate)
    return ", ".join(result[:24])


def make_description(soup: BeautifulSoup, title: str, existing: str) -> str:
    if existing:
        return clean_text(existing, 170)
    name = page_name(soup, title, "")
    details = []
    for node in soup.select("main p, .service-description, .hero-description, .sector-hero p"):
        value = clean_text(node.get_text(" ", strip=True), 120)
        if value and value not in details:
            details.append(value)
        if len(details) == 2:
            break
    suffix = " ".join(details)
    base = f"{name}: دليل الخدمات الرقمية والروابط الرسمية في الجزائر."
    return clean_text(f"{base} {suffix}" if suffix else base, 170)


def image_for(soup: BeautifulSoup, page_url: str) -> str:
    for node in soup.select('meta[property="og:image"], meta[name="twitter:image"]'):
        value = absolute_url(page_url, node.get("content", ""))
        if value:
            return value
    for node in soup.select('link[rel="apple-touch-icon"], link[rel="icon"], img[src]'):
        value = absolute_url(page_url, node.get("href") or node.get("src") or "")
        if value and urlparse(value).path.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            return value
    return urljoin(BASE, "assets/images/icon.png")


def list_candidates(soup: BeautifulSoup, page_url: str) -> list[dict]:
    selectors = ".sector-card, .service-item, .service-card, .app-card, .resource-card, .news-card"
    candidates: list[dict] = []
    seen: set[str] = set()
    for card in soup.select(selectors):
        link = card if card.name == "a" and card.get("href") else card.select_one("a[href]")
        if not link:
            continue
        target = absolute_url(page_url, link.get("href", ""))
        if not target or target.startswith("mailto:") or target.startswith("tel:") or target in seen:
            continue
        name = clean_text(first_tag(card, "h2, h3, h4, h5, .service-title, .sector-title, strong"), 120)
        if not name:
            name = clean_text(link.get_text(" ", strip=True), 120)
        if not name:
            continue
        desc = clean_text(first_tag(card, "p, .service-description, .card-description"), 220)
        seen.add(target)
        candidates.append({"name": name, "description": desc, "url": target})
    return candidates[:100]


def media_nodes(soup: BeautifulSoup, page_url: str, page_name_value: str, image: str, published: str) -> list[dict]:
    videos: list[dict] = []
    for video in soup.select("video"):
        source = video.get("src") or ((video.select_one("source") or {}).get("src") if video.select_one("source") else "")
        content_url = absolute_url(page_url, source)
        if not content_url:
            continue
        videos.append({
            "@type": "VideoObject",
            "@id": f"{page_url}#video-{len(videos) + 1}",
            "name": clean_text(video.get("title") or page_name_value, 120),
            "description": clean_text(video.get("aria-label") or f"فيديو تعريفي حول {page_name_value}", 200),
            "thumbnailUrl": [image],
            "uploadDate": published,
            "contentUrl": content_url,
            "inLanguage": "ar",
        })
    for iframe in soup.select('iframe[src*="youtube.com"], iframe[src*="youtu.be"], iframe[src*="vimeo.com"]'):
        embed_url = absolute_url(page_url, iframe.get("src", ""))
        if not embed_url:
            continue
        videos.append({
            "@type": "VideoObject",
            "@id": f"{page_url}#video-{len(videos) + 1}",
            "name": clean_text(iframe.get("title") or page_name_value, 120),
            "description": f"فيديو توضيحي حول {page_name_value}",
            "thumbnailUrl": [image],
            "uploadDate": published,
            "embedUrl": embed_url,
            "inLanguage": "ar",
        })
    return videos


def howto_node(soup: BeautifulSoup, page_url: str, page_name_value: str, published: str) -> dict | None:
    if not (soup.select(".howto-step, [class*='step']") or re.search(r"خطوات|كيفية|طريقة|إرشادات|ارشادات", soup.get_text(" ", strip=True))):
        return None
    items = []
    for li in soup.select("ol > li"):
        text = clean_text(li.get_text(" ", strip=True), 260)
        if text:
            items.append({"@type": "HowToStep", "position": len(items) + 1, "name": text[:120], "text": text})
    if not items:
        for node in soup.select(".howto-step, [class*='step']")[:12]:
            text = clean_text(node.get_text(" ", strip=True), 260)
            if text:
                items.append({"@type": "HowToStep", "position": len(items) + 1, "name": text[:120], "text": text})
    if len(items) < 2:
        return None
    return {
        "@type": "HowTo",
        "@id": f"{page_url}#howto",
        "name": f"كيفية الاستفادة من {page_name_value}",
        "description": f"خطوات استخدام أو الوصول إلى {page_name_value}.",
        "datePublished": published,
        "dateModified": published,
        "step": items,
        "inLanguage": "ar",
    }


def build_graph(soup: BeautifulSoup, relative: str, title: str, description: str, image: str, old_nodes: list[dict]) -> list[dict]:
    page_url = canonical_for(relative)
    name = page_name(soup, title, relative)
    modified, published = git_dates(relative)
    core_types = {"WebSite", "Organization", "WebPage", "AboutPage", "ContactPage", "CollectionPage", "BreadcrumbList", "ItemList"}
    old_core = [node for node in old_nodes if node_types(node) & core_types]
    old_extra = [node for node in old_nodes if not (node_types(node) & core_types)]
    old_by_type = {next(iter(node_types(node)), ""): node for node in old_core}

    website = merge_node(old_by_type.get("WebSite"), {
        "@type": "WebSite",
        "@id": f"{BASE}#website",
        "url": BASE,
        "name": "البوابة الجزائرية للخدمات الرقمية",
        "alternateName": ["DZ Portal", "البوابة الرقمية للخدمات الجزائرية"],
        "description": "منصة موحدة للوصول إلى الخدمات الحكومية والعمومية الرقمية في الجزائر.",
        "inLanguage": "ar-DZ",
        "publisher": {"@id": f"{BASE}#organization"},
    })
    organization = merge_node(old_by_type.get("Organization"), {
        "@type": "Organization",
        "@id": f"{BASE}#organization",
        "name": "البوابة الجزائرية للخدمات الرقمية",
        "url": BASE,
        "logo": {"@type": "ImageObject", "url": urljoin(BASE, "assets/images/icon.png")},
        "email": "tabaniimadeddine@gmail.com",
        "areaServed": {"@type": "Country", "name": "الجزائر"},
    })
    page_types: list[str] = ["WebPage"]
    if relative.endswith("pages/about.html"):
        page_types.append("AboutPage")
    if relative.endswith("pages/contact.html"):
        page_types.append("ContactPage")
    if relative.endswith("pages/statistics.html"):
        page_types.append("CollectionPage")

    breadcrumb_items = [{"@type": "ListItem", "position": 1, "name": "الرئيسية", "item": BASE}]
    if relative != "index.html":
        parent = Path(relative).parent.as_posix()
        if parent not in {".", ""} and parent != "pages":
            parent_name = {"sectors": "القطاعات والخدمات الرقمية", "assurance": "التأمين", "bank": "البنوك"}.get(Path(parent).name, "الخدمات الرقمية")
            parent_url = urljoin(BASE, parent + "/")
            breadcrumb_items.append({"@type": "ListItem", "position": len(breadcrumb_items) + 1, "name": parent_name, "item": parent_url})
        breadcrumb_items.append({"@type": "ListItem", "position": len(breadcrumb_items) + 1, "name": name, "item": page_url})
    breadcrumb_id = f"{page_url}#breadcrumb"
    webpage = merge_node(old_by_type.get("WebPage") or old_by_type.get("AboutPage") or old_by_type.get("ContactPage") or old_by_type.get("CollectionPage"), {
        "@type": page_types,
        "@id": f"{page_url}#webpage",
        "url": page_url,
        "name": title,
        "description": description,
        "inLanguage": "ar-DZ",
        "isPartOf": {"@id": f"{BASE}#website"},
        "about": {"@type": "Thing", "name": name},
        "publisher": {"@id": f"{BASE}#organization"},
        "primaryImageOfPage": {"@type": "ImageObject", "url": image},
        "datePublished": published,
        "dateModified": modified,
        "breadcrumb": {"@id": breadcrumb_id},
    })
    breadcrumb = {
        "@type": "BreadcrumbList",
        "@id": breadcrumb_id,
        "itemListElement": breadcrumb_items,
    }
    candidates = list_candidates(soup, page_url)
    itemlist = None
    if candidates:
        itemlist_id = f"{page_url}#itemlist"
        item_type = "WebPage" if relative == "index.html" else "Service"
        itemlist = {
            "@type": "ItemList",
            "@id": itemlist_id,
            "name": f"الخدمات والروابط الرقمية في {name}",
            "description": f"قائمة منظمة بالخدمات والروابط المرتبطة بصفحة {name}.",
            "numberOfItems": len(candidates),
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": index,
                    "item": {
                        "@type": item_type,
                        "name": candidate["name"],
                        "url": candidate["url"],
                        **({"description": candidate["description"]} if candidate["description"] else {}),
                    },
                }
                for index, candidate in enumerate(candidates, 1)
            ],
        }
        webpage["mainEntity"] = {"@id": itemlist_id}
    else:
        webpage.pop("mainEntity", None)

    graph = [website, organization, webpage, breadcrumb]
    if itemlist:
        graph.append(itemlist)
    existing_video = [node for node in old_extra if "VideoObject" in node_types(node)]
    existing_howto = [node for node in old_extra if "HowTo" in node_types(node)]
    preserved_extra = [node for node in old_extra if not ({"VideoObject", "HowTo"} & node_types(node))]
    graph.extend(preserved_extra)
    graph.extend(existing_video or media_nodes(soup, page_url, name, image, published))
    generated_howto = howto_node(soup, page_url, name, published)
    if generated_howto:
        graph.extend(existing_howto or [generated_howto])
    return graph


def enhance(path: Path) -> bool:
    relative = path.relative_to(ROOT).as_posix()
    if relative in SKIP_FILES:
        return False
    raw = path.read_bytes()
    newline = "\r\n" if b"\r\n" in raw else "\n"
    text = raw.decode("utf-8", errors="ignore").replace("\r\n", "\n").replace("\r", "\n")
    if "</head>" not in text.lower():
        return False
    soup = BeautifulSoup(text, "html.parser")
    head = soup.head
    if not head:
        return False
    old_title = head.title.get_text(" ", strip=True) if head.title else ""
    name = page_name(soup, old_title, relative)
    title = old_title or f"{name} | البوابة الجزائرية للخدمات الرقمية"
    existing_description = next((m.get("content", "").strip() for m in head.select('meta[name="description"]') if m.get("content")), "")
    description = make_description(soup, title, existing_description)
    existing_keywords = next((m.get("content", "").strip() for m in head.select('meta[name="keywords"]') if m.get("content")), "")
    keywords = make_keywords(soup, title, existing_keywords, relative)
    page_url = canonical_for(relative)
    image = image_for(soup, page_url)
    modified, published = git_dates(relative)
    old_nodes = existing_jsonld(text[text.lower().find("<head"):text.lower().find("</head>") + 7])
    graph = build_graph(soup, relative, title, description, image, old_nodes)
    jsonld = "\n    <script type=\"application/ld+json\">\n" + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=4) + "\n    </script>"

    head_text = text[:text.lower().find("</head>") + 7]
    body_text = text[text.lower().find("</head>") + 7:]
    head_text = replace_title(head_text, title)
    head_text = replace_meta(head_text, "name", "description", description)
    head_text = replace_meta(head_text, "name", "keywords", keywords)
    head_text = replace_meta(head_text, "name", "robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1")
    head_text = replace_meta(head_text, "property", "og:type", "website")
    head_text = replace_meta(head_text, "property", "og:title", title)
    head_text = replace_meta(head_text, "property", "og:description", description)
    head_text = replace_meta(head_text, "property", "og:url", page_url)
    head_text = replace_meta(head_text, "property", "og:site_name", "البوابة الجزائرية للخدمات الرقمية")
    head_text = replace_meta(head_text, "property", "og:locale", "ar_DZ")
    head_text = replace_meta(head_text, "property", "og:image", image)
    head_text = replace_meta(head_text, "property", "article:published_time", published)
    head_text = replace_meta(head_text, "property", "article:modified_time", modified)
    head_text = replace_meta(head_text, "name", "twitter:card", "summary_large_image")
    head_text = replace_meta(head_text, "name", "twitter:title", title)
    head_text = replace_meta(head_text, "name", "twitter:description", description)
    head_text = replace_meta(head_text, "name", "twitter:url", page_url)
    head_text = replace_meta(head_text, "name", "twitter:image", image)
    canonical_tag = f'<link rel="canonical" href="{esc(page_url)}">'
    head_text = replace_link_rel(head_text, "canonical", canonical_tag)
    alternate_tag = f'<link rel="alternate" hreflang="ar-DZ" href="{esc(page_url)}">'
    head_text = replace_link_rel(head_text, "alternate", alternate_tag)
    head_text = re.sub(r'\s*<script\b(?=[^>]*\btype\s*=\s*["\']application/ld\+json["\'])[^>]*>.*?</script>', "", head_text, flags=META_RE)
    head_text = head_text.replace("</head>", jsonld + "\n</head>", 1)
    result = head_text + body_text
    encoded = result.replace("\n", newline).encode("utf-8")
    if encoded == raw:
        return False
    path.write_bytes(encoded)
    return True


changed = []
for path in sorted(ROOT.rglob("*.html")):
    if any(part in {".git", "node_modules"} for part in path.parts):
        continue
    if enhance(path):
        changed.append(path.relative_to(ROOT).as_posix())
print(f"Enhanced {len(changed)} HTML pages")
for item in changed:
    print(item)
