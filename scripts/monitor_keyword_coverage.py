"""Check keyword coverage across sector pages and write a review report.

This is a deterministic content-health check, not a substitute for Search Console
ranking data. It flags pages whose tracked phrases are absent from title, description,
headings, or visible body text.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "seo" / "keyword-catalog.json"
REPORT_JSON = ROOT / "seo" / "keyword-coverage-report.json"
REPORT_MD = ROOT / "seo" / "keyword-coverage-report.md"

def norm(value: str) -> str:
    return re.sub(r"[\u064b-\u065f\u0670\u0640\s]+", " ", value or "").strip().casefold()

catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
rows = []
for item in catalog.get("sectors", []):
    path = ROOT / item["path"]
    soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="ignore"), "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    description = next((m.get("content", "") for m in soup.select('meta[name="description"]')), "")
    headings = " ".join(n.get_text(" ", strip=True) for n in soup.select("h1,h2,h3"))
    body = soup.get_text(" ", strip=True)
    searchable = norm(" ".join((title, description, headings, body)))
    covered = [kw for kw in item.get("keywords", []) if norm(kw) in searchable]
    missing = [kw for kw in item.get("keywords", []) if norm(kw) not in searchable]
    rows.append({"path": item["path"], "sector": item.get("sector", ""), "tracked": len(item.get("keywords", [])), "covered": len(covered), "coverage_percent": round(100 * len(covered) / max(1, len(item.get("keywords", []))), 1), "missing": missing[:12]})

rows.sort(key=lambda row: (row["coverage_percent"], row["path"]))
summary = {"generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "pages": len(rows), "below_70_percent": sum(row["coverage_percent"] < 70 for row in rows), "rows": rows}
REPORT_JSON.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
lines = ["# تقرير تغطية الكلمات المفتاحية القطاعية", "", f"تاريخ التقرير: `{summary['generated_at']}`", "", f"عدد الصفحات المفحوصة: **{summary['pages']}**. الصفحات التي تقل تغطيتها عن 70%: **{summary['below_70_percent']}**.", "", "| الصفحة | القطاع | التغطية | عبارات تحتاج مراجعة |", "|---|---|---:|---|"]
for row in rows:
    missing = "، ".join(row["missing"]) or "—"
    lines.append(f"| `{row['path']}` | {row['sector']} | {row['coverage_percent']}% | {missing} |")
lines += ["", "> هذا التقرير يقيس وجود العبارات في محتوى الصفحة، ولا يثبت ترتيبها في Google أو Bing. لمتابعة الترتيب الفعلي، اربط الموقع بـ Google Search Console وراجع استعلامات الأداء دورياً."]
REPORT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Checked {len(rows)} pages; below 70%: {summary['below_70_percent']}")
print(REPORT_MD)
