from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import quote
from xml.sax.saxutils import escape

from bs4 import BeautifulSoup

ROOT = Path('/home/ubuntu/dz_portal')
BASE = 'https://imadtbn.github.io/dz_portal/'
CSS_HREF = 'assets/css/video-watch.css'

VIDEOS = {
    'arpce': {
        'source': 'pages/process/arpce.html',
        'watch': 'pages/video/arpce-777.html',
        'name': 'برنامج جيل لجيل 777 للإدماج الرقمي',
        'description': 'فيديو يشرح برنامج جيل لجيل 777 للتعلم والإدماج الرقمي وتطوير المهارات عن بعد في الجزائر.',
        'youtube': 'opO1dEXGFDw',
        'thumbnail': 'assets/images/arpce.png',
        'duration': 'PT35S',
        'uploadDate': '2026-08-15',
        'service_url': 'sectors/arpce.html',
        'service_name': 'سلطة ضبط البريد والاتصالات الإلكترونية',
    },
    'arpce2': {
        'source': 'pages/process/arpce2.html',
        'watch': 'pages/video/arpce-777.html',
        'name': 'برنامج جيل لجيل 777 للإدماج الرقمي',
        'description': 'فيديو يشرح برنامج جيل لجيل 777 للتعلم والإدماج الرقمي وتطوير المهارات عن بعد في الجزائر.',
        'youtube': 'opO1dEXGFDw',
        'thumbnail': 'assets/images/arpce.png',
        'duration': 'PT35S',
        'uploadDate': '2026-08-15',
        'service_url': 'sectors/arpce.html',
        'service_name': 'سلطة ضبط البريد والاتصالات الإلكترونية',
    },
    'apostille': {
        'source': 'pages/process/apostille.html',
        'watch': 'pages/video/apostille-registration.html',
        'name': 'طريقة التسجيل في المنصة الوطنية الرقمية للأبوستيل',
        'description': 'شرح مرئي لطريقة التسجيل في المنصة الوطنية الرقمية للأبوستيل وتصديق الوثائق إلكترونيًا.',
        'youtube': 'Abph3zC5gZA',
        'thumbnail': 'assets/images/logo-hcn.png',
        'duration': 'PT3M16S',
        'uploadDate': '2025-06-01',
        'service_url': 'sectors/mfa.html',
        'service_name': 'المنصة الوطنية الرقمية للأبوستيل',
    },
    'naftal': {
        'source': 'pages/process/e-mahata.naftal.html',
        'watch': 'pages/video/naftal-tyres.html',
        'name': 'طريقة التسجيل في منصة محطتي لاقتناء عجلات السيارات',
        'description': 'شرح مرئي لطريقة التسجيل في منصة محطتي التابعة لنفطال لاقتناء العجلات المطاطية.',
        'youtube': 'U-3YSOxddEs',
        'thumbnail': 'assets/images/naftal.webp',
        'duration': 'PT3M05S',
        'uploadDate': '2026-05-10',
        'service_url': 'sectors/naftal.html',
        'service_name': 'خدمات نفطال الرقمية',
    },
    'awlyaa': {
        'source': 'pages/process/awlyaa-process.html',
        'watch': 'pages/video/awlyaa-registration.html',
        'name': 'طريقة التسجيل في فضاء الأولياء 2026',
        'description': 'شرح مرئي لطريقة التسجيل في فضاء الأولياء ومتابعة الأبناء دراسيًا عبر المنصة الرسمية.',
        'facebook': 'https://www.facebook.com/watch/?v=485913154242019',
        'thumbnail': 'assets/images/education.png',
        'service_url': 'sectors/awlyaa-education.html',
        'service_name': 'فضاء الأولياء',
    },
    'mfp': {
        'source': 'sectors/mfp.gov.html',
        'watch': 'pages/video/takwin-registration.html',
        'name': 'طريقة التسجيل في الدخول التكويني 2026',
        'description': 'شرح مرئي لطريقة التسجيل في الدخول التكويني وخدمات وزارة التكوين والتعليم المهنيين في الجزائر.',
        'facebook': 'https://www.facebook.com/reel/1967640217271523',
        'thumbnail': 'assets/images/formation.png',
        'service_url': 'sectors/mfp.gov.html',
        'service_name': 'التكوين والتعليم المهنيين',
        'sector_only': True,
    },
}


def abs_url(rel: str) -> str:
    return BASE + rel.lstrip('/')


def relative_asset(from_rel: str, asset_rel: str) -> str:
    depth = len(Path(from_rel).parent.parts)
    return '../' * depth + asset_rel


def youtube_embed(video_id: str) -> str:
    return f'https://www.youtube.com/embed/{video_id}'


def facebook_embed(url: str) -> str:
    return 'https://www.facebook.com/plugins/video.php?href=' + quote(url, safe='') + '&show_text=false'


def video_urls(cfg: dict) -> tuple[str, str]:
    if cfg.get('youtube'):
        return youtube_embed(cfg['youtube']), f"https://www.youtube.com/watch?v={cfg['youtube']}"
    return facebook_embed(cfg['facebook']), cfg['facebook']


def jsonld_scripts(text: str) -> list[tuple[int, int, dict]]:
    matches = []
    pattern = re.compile(r'<script\s+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', re.I | re.S)
    for match in pattern.finditer(text):
        raw = match.group(1).strip()
        try:
            matches.append((match.start(1), match.end(1), json.loads(raw)))
        except json.JSONDecodeError:
            continue
    return matches


def update_video_graph(text: str, cfg: dict) -> str:
    scripts = jsonld_scripts(text)
    if not scripts:
        return text
    start, end, data = scripts[0]
    graph = data.setdefault('@graph', [])
    watch_url = abs_url(cfg['watch'])
    if cfg.get('sector_only'):
        graph[:] = [node for node in graph if not ('VideoObject' in (node.get('@type', []) if isinstance(node, dict) and isinstance(node.get('@type'), list) else [node.get('@type')]) and node.get('@id') == f'{watch_url}#video')]
        serialized = json.dumps(data, ensure_ascii=False, indent=4)
        return text[:start] + '\n' + serialized + '\n' + text[end:]
    embed_url, content_url = video_urls(cfg)
    video = {
        '@type': 'VideoObject',
        '@id': f"{watch_url}#video",
        'name': cfg['name'],
        'description': cfg['description'],
        'thumbnailUrl': [abs_url(cfg['thumbnail'])],
        'embedUrl': embed_url,
        'contentUrl': content_url,
        'mainEntityOfPage': {'@id': f'{watch_url}#webpage'},
        'inLanguage': 'ar-DZ',
        'publisher': {'@id': f'{BASE}#organization'},
        'potentialAction': {'@type': 'WatchAction', 'target': watch_url},
    }
    if cfg.get('duration'):
        video['duration'] = cfg['duration']
    if cfg.get('uploadDate'):
        video['uploadDate'] = cfg['uploadDate']
    replaced = False
    for index, node in enumerate(graph):
        types = node.get('@type', []) if isinstance(node, dict) else []
        if isinstance(types, str):
            types = [types]
        if 'VideoObject' in types:
            graph[index] = video
            replaced = True
            break
    if not replaced:
        graph.append(video)
    serialized = json.dumps(data, ensure_ascii=False, indent=4)
    return text[:start] + '\n' + serialized + '\n' + text[end:]


def add_head_assets(text: str, rel: str, cfg: dict) -> str:
    if cfg.get('sector_only'):
        return text
    if 'video-watch.css' not in text:
        css_path = relative_asset(rel, CSS_HREF)
        text = text.replace('</head>', f'    <link rel="stylesheet" href="{css_path}">\n</head>', 1)
    embed_url, content_url = video_urls(cfg)
    extras = [
        f'<meta property="og:type" content="video.other">',
        f'<meta property="og:video" content="{embed_url}">',
        f'<meta property="og:video:url" content="{embed_url}">',
        f'<meta property="og:video:secure_url" content="{embed_url}">',
        '<meta property="og:video:type" content="text/html">',
        f'<link rel="video-watch-page" href="{abs_url(cfg["watch"])}">',
    ]
    marker = '<meta property="og:type" content="video.other">'
    if marker not in text:
        insertion = '\n    ' + '\n    '.join(extras) + '\n'
        text = text.replace('</head>', insertion + '</head>', 1)
    return text


def primary_section(cfg: dict, rel: str, sector: bool = False) -> str:
    embed_url, _ = video_urls(cfg)
    watch_href = relative_asset(rel, cfg['watch'])
    service_href = relative_asset(rel, cfg['service_url'])
    loading = 'eager'
    iframe = (
        f'<iframe class="tutorial-frame video-primary-embed" src="{embed_url}" '
        f'title="{cfg["name"]}" loading="{loading}" '
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" '
        'allowfullscreen></iframe>'
    )
    return f'''\n    <section class="video-watch-section video-primary-section" id="video" data-video-watch-page="{abs_url(cfg['watch'])}">\n        <div class="video-watch-heading">\n            <span class="video-watch-kicker"><i class="fas fa-circle-play"></i> فيديو تعليمي</span>\n            <h2>{cfg['name']}</h2>\n            <p>{cfg['description']}</p>\n        </div>\n        <div class="video-watch-player">{iframe}</div>\n        <div class="video-watch-actions">\n            <a class="video-watch-primary" href="{watch_href}"><i class="fas fa-expand"></i> صفحة مشاهدة الفيديو</a>\n            <a class="video-watch-secondary" href="{service_href}"><i class="fas fa-arrow-right"></i> العودة إلى الخدمة</a>\n        </div>\n    </section>\n'''


def replace_process_video_section(text: str, cfg: dict, rel: str) -> str:
    section_pattern = re.compile(r'\s*<section class="section-card video-section" id="video">.*?</section>', re.I | re.S)
    replacement = primary_section(cfg, rel)
    new_text, count = section_pattern.subn(replacement, text, count=1)
    if count != 1:
        raise RuntimeError(f'video section not found: {rel}')
    return new_text


def sector_link_section(cfg: dict, rel: str) -> str:
    watch_href = relative_asset(rel, cfg['watch'])
    return f'''\n    <section class="section-card content-link-section" id="video-guide" aria-labelledby="videoGuideTitle">\n        <div class="section-header-card">\n            <h3 class="section-title" id="videoGuideTitle">\n                <i class="fas fa-circle-play" aria-hidden="true"></i>\n                شرح طريقة التسجيل في الدخول التكويني 2026\n            </h3>\n            <span class="service-count">صفحة مشاهدة</span>\n        </div>\n        <div class="section-content">\n            <p>للاطلاع على الشرح المرئي لطريقة التسجيل، انتقل إلى صفحة المشاهدة المستقلة. تبقى هذه الصفحة مخصصة لخدمات قطاع التكوين والتعليم المهنيين وروابطها الرقمية.</p>\n            <a class="service-link" href="{watch_href}">\n                <i class="fas fa-external-link-alt" aria-hidden="true"></i>\n                مشاهدة شرح التسجيل بالفيديو\n            </a>\n        </div>\n    </section>\n'''


def insert_sector_video(text: str, cfg: dict, rel: str) -> str:
    if 'data-video-watch-page=' in text or 'id="video-guide"' in text:
        return text
    marker = '    <!-- Vocational Training Welcome Alert -->'
    section = sector_link_section(cfg, rel) if cfg.get('sector_only') else primary_section(cfg, rel, sector=True)
    if marker not in text:
        raise RuntimeError(f'sector insertion marker not found: {rel}')
    return text.replace(marker, section + '\n' + marker, 1)


def make_watch_page(cfg: dict) -> str:
    rel = cfg['watch']
    css = relative_asset(rel, CSS_HREF)
    embed_url, content_url = video_urls(cfg)
    thumb = abs_url(cfg['thumbnail'])
    watch_url = abs_url(rel)
    service_url = abs_url(cfg['service_url'])
    video = {
        '@type': 'VideoObject',
        '@id': f'{watch_url}#video',
        'name': cfg['name'],
        'description': cfg['description'],
        'thumbnailUrl': [thumb],
        'embedUrl': embed_url,
        'contentUrl': content_url,
        'mainEntityOfPage': {'@id': f'{watch_url}#webpage'},
        'inLanguage': 'ar-DZ',
        'publisher': {'@id': f'{BASE}#organization'},
        'potentialAction': {'@type': 'WatchAction', 'target': watch_url},
    }
    if cfg.get('duration'):
        video['duration'] = cfg['duration']
    if cfg.get('uploadDate'):
        video['uploadDate'] = cfg['uploadDate']
    graph = [
        {'@type': 'WebSite', '@id': f'{BASE}#website', 'url': BASE, 'name': 'البوابة الجزائرية للخدمات الرقمية', 'inLanguage': 'ar-DZ'},
        {'@type': 'Organization', '@id': f'{BASE}#organization', 'name': 'البوابة الجزائرية للخدمات الرقمية', 'url': BASE, 'logo': {'@type': 'ImageObject', 'url': abs_url('icons/icon.png')}},
        {'@type': 'WebPage', '@id': f'{watch_url}#webpage', 'url': watch_url, 'name': cfg['name'] + ' | فيديو', 'headline': cfg['name'], 'description': cfg['description'], 'inLanguage': 'ar-DZ', 'isPartOf': {'@id': f'{BASE}#website'}, 'publisher': {'@id': f'{BASE}#organization'}, 'primaryImageOfPage': {'@type': 'ImageObject', 'url': thumb}, 'mainEntity': {'@id': f'{watch_url}#video'}},
        {'@type': 'BreadcrumbList', '@id': f'{watch_url}#breadcrumb', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'الرئيسية', 'item': BASE}, {'@type': 'ListItem', 'position': 2, 'name': 'الفيديوهات التعليمية', 'item': abs_url('pages/video/')}, {'@type': 'ListItem', 'position': 3, 'name': cfg['name'], 'item': watch_url}]},
        video,
    ]
    ld = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, indent=4)
    title = cfg['name'] + ' | فيديو تعليمي | البوابة الجزائرية'
    canonical = watch_url
    relative_home = relative_asset(rel, 'index.html')
    return f'''<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>{title}</title>\n    <meta name="description" content="{cfg['description']}">\n    <meta name="robots" content="index,follow,max-video-preview:-1">\n    <link rel="canonical" href="{canonical}">\n    <meta property="og:type" content="video.other">\n    <meta property="og:title" content="{title}">\n    <meta property="og:description" content="{cfg['description']}">\n    <meta property="og:url" content="{canonical}">\n    <meta property="og:image" content="{thumb}">\n    <meta property="og:video" content="{embed_url}">\n    <meta property="og:video:url" content="{embed_url}">\n    <meta property="og:video:secure_url" content="{embed_url}">\n    <meta property="og:video:type" content="text/html">\n    <meta name="twitter:card" content="player">\n    <meta name="twitter:title" content="{title}">\n    <meta name="twitter:description" content="{cfg['description']}">\n    <meta name="twitter:image" content="{thumb}">\n    <link rel="stylesheet" href="{css}">\n    <script type="application/ld+json">\n{ld}\n    </script>\n</head>\n<body>\n<header class="video-watch-header">\n    <a href="{relative_home}" class="video-watch-brand">البوابة الجزائرية <span>للخدمات الرقمية</span></a>\n    <a href="{relative_home}" class="video-watch-home"><i class="fas fa-home"></i> الرئيسية</a>\n</header>\n<main class="video-watch-page">\n    <nav class="video-watch-breadcrumb" aria-label="مسار التنقل"><a href="{relative_home}">الرئيسية</a><span>←</span><span>فيديو تعليمي</span></nav>\n    <article class="video-watch-article">\n        <div class="video-watch-label">صفحة مشاهدة الفيديو</div>\n        <h1>{cfg['name']}</h1>\n        <p class="video-watch-description">{cfg['description']}</p>\n        <div class="video-watch-player video-watch-primary-player">\n            <iframe class="video-primary-embed" src="{embed_url}" title="{cfg['name']}" loading="eager" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>\n        </div>\n        <p class="video-watch-caption">هذا الفيديو هو المحتوى الرئيسي لهذه الصفحة، ويمكن العودة إلى صفحة الخدمة للاطلاع على التفاصيل والروابط الرقمية المرتبطة.</p>\n        <a href="{service_url}" class="video-watch-service-link"><i class="fas fa-arrow-right"></i> الانتقال إلى صفحة الخدمة</a>\n    </article>\n</main>\n<footer class="video-watch-footer">© 2026 البوابة الجزائرية للخدمات الرقمية</footer>\n</body>\n</html>\n'''


def update_sitemap() -> None:
    path = ROOT / 'sitemap.xml'
    text = path.read_text(encoding='utf-8')
    if 'xmlns:video=' not in text:
        text = text.replace('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">', 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">', 1)
    entries = []
    for cfg in VIDEOS.values():
        url = abs_url(cfg['watch'])
        if url in text:
            continue
        embed_url, _ = video_urls(cfg)
        thumb = abs_url(cfg['thumbnail'])
        entry = f'''  <url>\n    <loc>{url}</loc>\n    <lastmod>2026-08-18</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n    <video:video>\n      <video:thumbnail_loc>{thumb}</video:thumbnail_loc>\n      <video:title>{cfg['name']}</video:title>\n      <video:description>{cfg['description']}</video:description>\n      <video:player_loc allow_embed="yes">{escape(embed_url)}</video:player_loc>\n    </video:video>\n  </url>\n'''
        entries.append(entry)
    if entries:
        text = text.replace('</urlset>', ''.join(entries) + '</urlset>', 1)
    path.write_text(text, encoding='utf-8')


def main() -> None:
    pages_dir = ROOT / 'pages/video'
    pages_dir.mkdir(parents=True, exist_ok=True)
    for cfg in VIDEOS.values():
        source_path = ROOT / cfg['source']
        raw = source_path.read_bytes()
        newline = b'\r\n' if b'\r\n' in raw else b'\n'
        text = raw.decode('utf-8').replace('\r\n', '\n').replace('\r', '\n')
        text = add_head_assets(text, cfg['source'], cfg)
        text = update_video_graph(text, cfg)
        if cfg['source'].startswith('pages/process/'):
            text = replace_process_video_section(text, cfg, cfg['source'])
        else:
            text = insert_sector_video(text, cfg, cfg['source'])
        source_path.write_bytes(text.replace('\n', newline.decode()).encode('utf-8'))
        (ROOT / cfg['watch']).write_text(make_watch_page(cfg), encoding='utf-8')
    update_sitemap()


if __name__ == '__main__':
    main()
