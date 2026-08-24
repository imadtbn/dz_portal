"""Build a maintainable keyword catalog for every DZ Portal sector page.

The catalog is derived from visible page content and conservative sector aliases. It is
used by the SEO metadata builder and can be reviewed/exported for Search Console tracking.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SECTORS = ROOT / "sectors"
OUT = ROOT / "seo" / "keyword-catalog.json"

COMMON = ["الجزائر", "البوابة الجزائرية للخدمات الرقمية"]
ALIASES = {
    "aadl": ["عدل", "AADL", "عدل 3", "سكن عدل", "دفع كراء عدل", "التسجيل في عدل"],
    "education": ["التربية والتعليم", "فضاء الأولياء", "فضاء الأستاذ", "نتائج التلاميذ", "التسجيل في الامتحانات"],
    "awlyaa-education": ["فضاء الأولياء", "نتائج التلاميذ", "التسجيل في فضاء الأولياء"],
    "mesrs.dz": ["التعليم العالي", "التسجيل الجامعي", "الجامعات الجزائرية", "Progres"],
    "progres.mesrs": ["Progres", "التسجيل الجامعي", "الخدمات الجامعية", "الإيواء الجامعي"],
    "mfp.gov": ["التكوين المهني", "التسجيل في التكوين المهني", "منصة مهنتي"],
    "interieur": ["وزارة الداخلية الجزائرية", "شهادة الميلاد", "بطاقة التعريف البيومترية", "جواز السفر البيومتري", "رخصة السياقة"],
    "mjustice": ["العدالة الجزائرية", "السوابق العدلية", "الجنسية الجزائرية", "النيابة الإلكترونية"],
    "mtess": ["وزارة العمل والتشغيل والضمان الاجتماعي", "منحة البطالة", "الضمان الاجتماعي", "CNAS", "CASNOS", "CNR"],
    "anem": ["الوكالة الوطنية للتشغيل", "منحة البطالة", "عروض العمل", "التسجيل في وكالة التشغيل"],
    "cnas": ["CNAS", "الضمان الاجتماعي للعمال الأجراء", "فضاء الهناء", "شهادة الانتساب"],
    "casnos": ["CASNOS", "الضمان الاجتماعي لغير الأجراء", "حمايتي", "شهادة الانتساب"],
    "cnr": ["CNR", "التقاعد في الجزائر", "حساب التقاعد", "صب المعاش"],
    "mf.gov": ["المالية والجباية", "الضرائب الجزائرية", "الطابع الجبائي", "قسيمة السيارات"],
    "nifenligne": ["الترقيم الجبائي", "المعرف الجبائي", "الضرائب الجزائرية", "التسجيل الجبائي"],
    "qassimatouka": ["قسيمة السيارات", "شراء قسيمة السيارات", "قسيمتك"],
    "tabioucom": ["الطابع الجبائي الإلكتروني", "شراء الطابع الجبائي", "طابعكم"],
    "bank": ["البنوك الجزائرية", "فتح حساب بنكي", "القروض البنكية", "الخدمات البنكية الإلكترونية"],
    "poste": ["بريد الجزائر", "البطاقة الذهبية", "بريدي موب", "تعبئة البطاقة الذهبية"],
    "sonalgaz": ["سونلغاز", "دفع فاتورة الكهرباء والغاز", "فاتورة الكهرباء", "فاتورة الغاز"],
    "ade": ["الجزائرية للمياه", "دفع فاتورة الماء", "فاتورة ADE"],
    "seaal": ["سيال", "دفع فاتورة الماء", "فاتورة SEAAL"],
    "seor": ["سيور", "فاتورة الماء", "توزيع المياه"],
    "transport": ["النقل في الجزائر", "حجز تذاكر الطيران", "حجز تذاكر القطار", "مواقيت النقل"],
    "sntf": ["مواقيت قطارات الجزائر", "حجز تذاكر SNTF", "القطار في الجزائر"],
    "sante": ["الصحة في الجزائر", "العيادة الرقمية", "بنك الدم", "الخدمات الصحية"],
    "douane": ["الجمارك الجزائرية", "الخدمات الجمركية الإلكترونية", "التجارة الخارجية"],
    "mhuv.gov": ["السكن والعمران", "السكن الاجتماعي", "السكن الترقوي المدعم", "العقار في الجزائر"],
    "assurance": ["التأمين في الجزائر", "تأمين الممتلكات", "تعويضات التأمين"],
    "mobilis": ["موبيليس", "تعبئة رصيد موبيليس", "خدمات موبيليس"],
    "djezzy": ["جازي", "تعبئة رصيد جازي", "خدمات جازي"],
    "ooredoo": ["أوريدو الجزائر", "تعبئة رصيد أوريدو", "خدمات أوريدو"],
}

def clean(value: str, limit: int = 100) -> str:
    return re.sub(r"\s+", " ", value or "").strip()[:limit].strip(" ,،؛:-")

def extract(path: Path) -> dict:
    soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="ignore"), "html.parser")
    title = clean(soup.title.get_text(" ", strip=True) if soup.title else path.stem.replace("-", " "))
    title_name = title.split("|")[0].strip()
    heading = soup.select_one(".sector-hero h1, .sector-hero h2, main h1, main h2")
    heading_name = clean(heading.get_text(" ", strip=True)) if heading else ""
    name = heading_name if heading_name and "البوابة الجزائرية" not in heading_name else clean(title_name)
    slug = path.stem
    keywords = []
    keywords.extend(ALIASES.get(slug, []))
    keywords.extend([name, title.split("|")[0].strip()])
    for node in soup.select("main h1, main h2, main h3, .service-title, .sector-title")[:12]:
        phrase = clean(node.get_text(" ", strip=True))
        if phrase and len(phrase) > 2:
            keywords.append(phrase)
    dedup = []
    seen = set()
    for keyword in COMMON + keywords:
        key = re.sub(r"\s+", " ", keyword).casefold()
        if len(key) > 2 and key not in seen:
            seen.add(key)
            dedup.append(keyword)
    return {"slug": slug, "path": f"sectors/{path.name}", "title": title, "sector": name, "keywords": dedup[:28]}

OUT.parent.mkdir(parents=True, exist_ok=True)
entries = [extract(path) for path in sorted(SECTORS.glob("*.html"))]
OUT.write_text(json.dumps({"version": 1, "generated_from": "visible sector page content", "sectors": entries}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Generated {len(entries)} sector keyword records: {OUT}")
