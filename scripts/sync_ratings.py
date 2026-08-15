#!/usr/bin/env python3
"""Synchronize public Google Sheets ratings into the static site JSON file."""

from __future__ import annotations

import csv
import io
import json
import os
import statistics
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

SOURCE = "https://docs.google.com/spreadsheets/d/1TJgv9b2F2olI961PqxRscPqecQK--eqpiv9McaJKnBQ/edit?usp=drivesdk"
CSV_URL = "https://docs.google.com/spreadsheets/d/1TJgv9b2F2olI961PqxRscPqecQK--eqpiv9McaJKnBQ/gviz/tq?tqx=out:csv&gid=0"
OUTPUT = Path(__file__).resolve().parents[1] / "assets/data/site-rating.json"


def set_output(name: str, value: str) -> None:
    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a", encoding="utf-8") as handle:
            handle.write(f"{name}={value}\n")


def fetch_csv() -> str:
    request = Request(CSV_URL, headers={"User-Agent": "dz-portal-rating-sync/1.0"})
    with urlopen(request, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError(f"Google Sheets returned HTTP {response.status}")
        payload = response.read()
    return payload.decode("utf-8-sig")


def parse_scores(csv_text: str) -> list[float]:
    rows = list(csv.reader(io.StringIO(csv_text)))
    if len(rows) < 2:
        raise ValueError("The CSV does not contain rating rows")

    scores: list[float] = []
    for row in rows[1:]:
        if len(row) < 3:
            continue
        try:
            score = float(row[2].strip().replace(",", "."))
        except (AttributeError, ValueError):
            continue
        if 1 <= score <= 5:
            scores.append(score)

    if not scores:
        raise ValueError("The CSV contains no valid ratings in column 3")
    return scores


def build_payload(scores: list[float], previous: dict | None) -> dict:
    distribution = Counter(str(int(score)) for score in scores if score.is_integer())
    candidate = {
        "source": SOURCE,
        "sourceQuery": CSV_URL,
        "responses": len(scores),
        "average": round(statistics.mean(scores), 2),
        "distribution": {str(score): distribution.get(str(score), 0) for score in range(1, 6)},
    }

    previous_core = {
        key: previous.get(key)
        for key in ("source", "sourceQuery", "responses", "average", "distribution")
    } if previous else None

    if previous_core == candidate and previous and previous.get("syncedAt"):
        candidate["syncedAt"] = previous["syncedAt"]
    else:
        candidate["syncedAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    return candidate


def main() -> int:
    set_output("changed", "false")
    try:
        csv_text = fetch_csv()
        scores = parse_scores(csv_text)
    except (HTTPError, URLError, TimeoutError, OSError, RuntimeError, ValueError) as error:
        print(f"Rating sync skipped; keeping the previous valid file: {error}", file=sys.stderr)
        return 0

    previous = None
    if OUTPUT.exists():
        try:
            previous = json.loads(OUTPUT.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            print(f"Previous rating file could not be read and will be replaced: {error}")

    payload = build_payload(scores, previous)
    rendered = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    old_rendered = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""

    if rendered == old_rendered:
        print(f"Ratings unchanged: {payload['responses']} responses, average {payload['average']}")
        return 0

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(rendered, encoding="utf-8")
    set_output("changed", "true")
    print(f"Ratings updated: {payload['responses']} responses, average {payload['average']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
