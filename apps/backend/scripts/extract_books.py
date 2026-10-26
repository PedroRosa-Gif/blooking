#!/usr/bin/env python3
"""
Blooking — book dataset extractor / cleaner.

Reads the raw "Best Books Ever" CSV (Kaggle, ~52k rows) and produces a clean,
compact sample (default: first 3,000 rows) that is committed to the repo and
consumed by the backend's seeder.

Why this script exists
----------------------
The raw CSV (~70 MB) is NOT committed to Git. Only the cleaned sample is.
The raw file has several quirks this script handles:

  * Multi-line quoted fields (e.g. descriptions containing newlines).
  * "List-like" columns stored as Python-literal strings, e.g.
        "['Young Adult', 'Fiction']"
    (single quotes -> NOT valid JSON). Parsed with ast.literal_eval and
    re-emitted as proper JSON arrays so the Java side can parse them trivially.
  * Escaped double quotes inside quoted fields ("" -> ").
  * Placeholder / dirty values: isbn "9999999999999", empty price/pages, etc.
  * Dates like MM/DD/YY -> we extract a 4-digit publish year when possible.
  * Mojibake (e.g. "â€”" instead of "—"). Fixed with `ftfy` if installed,
    otherwise a light best-effort cleanup.

Usage
-----
    python extract_books.py \
        --input  ../data/raw/books.csv \
        --output ../src/main/resources/data/books_sample.csv \
        --limit  3000

All arguments are optional; the defaults match the repo layout (run from the
`scripts/` directory).

Output columns (stable contract for the backend seeder)
-------------------------------------------------------
    source_id, title, series, author, rating, description, language, isbn,
    genres, characters, awards, book_format, pages, publisher, publish_year,
    num_ratings, liked_percent, cover_img, price

`genres`, `characters`, `awards` are emitted as JSON arrays (possibly empty).
Numeric columns are emitted empty when missing/unparseable (never "NaN").
"""

from __future__ import annotations

import argparse
import ast
import csv
import json
import os
import re
import sys

# Allow very large quoted fields (descriptions / awards can be huge).
csv.field_size_limit(10_000_000)

# Optional, improves text quality if installed: `pip install ftfy`
try:
    from ftfy import fix_text  # type: ignore
except Exception:  # pragma: no cover - ftfy is optional
    fix_text = None


# --- Defaults relative to this script's location (apps/backend/scripts) ---
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_INPUT = os.path.join(_SCRIPT_DIR, "..", "data", "raw", "books.csv")
DEFAULT_OUTPUT = os.path.join(
    _SCRIPT_DIR, "..", "src", "main", "resources", "data", "books_sample.csv"
)
DEFAULT_LIMIT = 3000

OUTPUT_COLUMNS = [
    "source_id",
    "title",
    "series",
    "author",
    "rating",
    "description",
    "language",
    "isbn",
    "genres",
    "characters",
    "awards",
    "book_format",
    "pages",
    "publisher",
    "publish_year",
    "num_ratings",
    "liked_percent",
    "cover_img",
    "price",
]

# ISBN placeholder used in the dataset for "unknown".
ISBN_PLACEHOLDER = "9999999999999"


def clean_text(value: str | None) -> str:
    """Normalize whitespace and repair mojibake; return a trimmed string."""
    if value is None:
        return ""
    text = str(value)
    if fix_text is not None:
        text = fix_text(text)
    else:
        # Best-effort cleanup of the most common mojibake if ftfy is absent.
        replacements = {
            "â€”": "—",
            "â€“": "–",
            "â€™": "’",
            "â€˜": "‘",
            "â€œ": "“",
            "â€\x9d": "”",
            "â€¦": "…",
        }
        for bad, good in replacements.items():
            text = text.replace(bad, good)
    # Collapse internal whitespace (including newlines) to single spaces.
    text = re.sub(r"\s+", " ", text).strip()
    return text


def parse_list(value: str | None) -> list[str]:
    """Parse a Python-literal list string into a list of clean strings.

    Accepts inputs like "['A', 'B']" or '[]' or ''. Returns [] on anything
    it cannot parse, so a single malformed row never aborts the run.
    """
    if value is None:
        return []
    raw = value.strip()
    if not raw or raw in ("[]", "''", '""'):
        return []
    try:
        parsed = ast.literal_eval(raw)
    except (ValueError, SyntaxError):
        return []
    if not isinstance(parsed, (list, tuple)):
        return []
    items: list[str] = []
    for element in parsed:
        cleaned = clean_text(str(element))
        if cleaned:
            items.append(cleaned)
    return items


def parse_float(value: str | None) -> str:
    """Return a float as string, or '' if missing/unparseable."""
    if value is None:
        return ""
    raw = str(value).strip()
    if not raw:
        return ""
    try:
        return str(float(raw))
    except ValueError:
        return ""


def parse_int(value: str | None) -> str:
    """Return an int as string, or '' if missing/unparseable.

    Tolerates values that arrive as floats or with thousands separators.
    """
    if value is None:
        return ""
    raw = str(value).strip().replace(",", "")
    if not raw:
        return ""
    try:
        return str(int(float(raw)))
    except ValueError:
        return ""


def parse_year(*values: str | None) -> str:
    """Extract a 4-digit year from the first value that contains one.

    Handles 'MM/DD/YY', 'MM/DD/YYYY' and free text. For 2-digit years we map
    00-29 -> 2000s and 30-99 -> 1900s (reasonable for a books dataset).
    """
    for value in values:
        if not value:
            continue
        raw = str(value).strip()
        if not raw:
            continue
        # Full 4-digit year anywhere in the string.
        match = re.search(r"(1[5-9]\d{2}|20\d{2})", raw)
        if match:
            return match.group(1)
        # MM/DD/YY style -> take the trailing 2-digit year.
        match = re.match(r"^\d{1,2}/\d{1,2}/(\d{2})$", raw)
        if match:
            yy = int(match.group(1))
            return str(2000 + yy if yy <= 29 else 1900 + yy)
    return ""


def clean_isbn(value: str | None) -> str:
    isbn = clean_text(value)
    return "" if isbn == ISBN_PLACEHOLDER else isbn


def build_row(row: dict[str, str]) -> dict[str, str]:
    """Map one raw CSV row to the cleaned output contract."""
    return {
        "source_id": clean_text(row.get("bookId")),
        "title": clean_text(row.get("title")),
        "series": clean_text(row.get("series")),
        "author": clean_text(row.get("author")),
        "rating": parse_float(row.get("rating")),
        "description": clean_text(row.get("description")),
        "language": clean_text(row.get("language")),
        "isbn": clean_isbn(row.get("isbn")),
        "genres": json.dumps(parse_list(row.get("genres")), ensure_ascii=False),
        "characters": json.dumps(parse_list(row.get("characters")), ensure_ascii=False),
        "awards": json.dumps(parse_list(row.get("awards")), ensure_ascii=False),
        "book_format": clean_text(row.get("bookFormat")),
        "pages": parse_int(row.get("pages")),
        "publisher": clean_text(row.get("publisher")),
        "publish_year": parse_year(row.get("publishDate"), row.get("firstPublishDate")),
        "num_ratings": parse_int(row.get("numRatings")),
        "liked_percent": parse_int(row.get("likedPercent")),
        "cover_img": clean_text(row.get("coverImg")),
        "price": parse_float(row.get("price")),
    }


def extract(input_path: str, output_path: str, limit: int) -> None:
    if not os.path.isfile(input_path):
        sys.exit(f"ERROR: input file not found: {input_path}")

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    written = 0
    skipped_no_title = 0
    seen_ids: set[str] = set()

    # utf-8-sig strips a BOM if present.
    with open(input_path, "r", encoding="utf-8-sig", newline="") as fin, \
            open(output_path, "w", encoding="utf-8", newline="") as fout:
        reader = csv.DictReader(fin)
        writer = csv.DictWriter(fout, fieldnames=OUTPUT_COLUMNS, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()

        for raw in reader:
            if written >= limit:
                break

            out = build_row(raw)

            # A book without a title is useless for the catalog; skip it.
            if not out["title"]:
                skipped_no_title += 1
                continue

            # Deduplicate by source_id when present.
            sid = out["source_id"]
            if sid:
                if sid in seen_ids:
                    continue
                seen_ids.add(sid)

            writer.writerow(out)
            written += 1

    print(f"Done. Wrote {written} books to: {output_path}")
    if skipped_no_title:
        print(f"Skipped {skipped_no_title} row(s) with no title.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract and clean the books dataset.")
    parser.add_argument("--input", default=DEFAULT_INPUT, help="Path to the raw Kaggle CSV.")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help="Path to the cleaned sample CSV.")
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT, help="Max number of books.")
    args = parser.parse_args()
    extract(args.input, args.output, args.limit)


if __name__ == "__main__":
    main()
