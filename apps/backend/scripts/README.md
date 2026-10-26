# Dataset extraction script

Generates the cleaned book sample that the backend seeds into the database.

## What it does

`extract_books.py` reads the raw **Best Books Ever** CSV (Kaggle, ~52k rows)
and writes a compact, cleaned sample (default: first 3,000 rows) to
`../src/main/resources/data/books_sample.csv`.

The **raw CSV (~70 MB) is NOT committed** to Git (it is git-ignored). Only the
cleaned sample is versioned.

## Setup

1. Download the dataset from Kaggle:
   https://www.kaggle.com/datasets/pooriamst/best-books-ever-dataset/data
2. Put the raw file at: `apps/backend/data/raw/books.csv`
3. (Recommended) install the optional dependency for better text cleanup:
   ```bash
   pip install -r requirements.txt
   ```

## Run

From the `apps/backend/scripts` directory:

```bash
python extract_books.py
```

Custom paths / size:

```bash
python extract_books.py \
  --input  ../data/raw/books.csv \
  --output ../src/main/resources/data/books_sample.csv \
  --limit  3000
```

## Output format

CSV with a stable header the backend seeder relies on:

```
source_id, title, series, author, rating, description, language, isbn,
genres, characters, awards, book_format, pages, publisher, publish_year,
num_ratings, liked_percent, cover_img, price
```

- `genres`, `characters`, `awards` are **JSON arrays** (e.g. `["Fiction","Romance"]`),
  possibly empty (`[]`).
- Numeric fields (`rating`, `pages`, `num_ratings`, `liked_percent`, `price`)
  are emitted empty when missing/unparseable — never `NaN`.
- `isbn` placeholder `9999999999999` is normalized to empty.
- `publish_year` is a 4-digit year derived from `publishDate` / `firstPublishDate`.

## Cleaning rules (summary)

- Handles multi-line quoted fields and escaped quotes (standard CSV parsing).
- Parses Python-literal list columns (`['A', 'B']`) safely via `ast.literal_eval`.
- Repairs mojibake (needs `ftfy`; otherwise a light built-in fallback is used).
- Collapses internal whitespace/newlines to single spaces.
- Skips rows without a title; de-duplicates by `source_id`.

## Current selection criterion

**First N rows** (`--limit`, default 3000). A smarter criterion (e.g. top-N by
`num_ratings`) and a larger sample (~5k) are planned for the future.
