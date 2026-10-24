-- V2 — Book catalog table.
--
-- Creates the core `books` table used by the discovery features. The schema is
-- already prepared for later phases (semantic search + keyword search), even
-- though those columns are not populated yet:
--   * `embedding`      — pgvector column, filled during Phase 3 (semantic search).
--   * `search_vector`  — generated tsvector for PostgreSQL Full-Text Search.

CREATE TABLE books (
    id            BIGSERIAL PRIMARY KEY,

    -- Stable identifier coming from the source dataset (Goodreads/Kaggle).
    -- Used to de-duplicate and to make re-seeding idempotent.
    source_id     TEXT UNIQUE,

    title         TEXT NOT NULL,
    series        TEXT,
    author        TEXT,
    description   TEXT,
    language      TEXT,
    isbn          TEXT,

    -- List-like fields, stored as native PostgreSQL text arrays.
    genres        TEXT[] NOT NULL DEFAULT '{}',
    characters    TEXT[] NOT NULL DEFAULT '{}',
    awards        TEXT[] NOT NULL DEFAULT '{}',

    book_format   TEXT,
    pages         INTEGER,
    publisher     TEXT,
    publish_year  INTEGER,

    rating        NUMERIC(3,2),
    num_ratings   BIGINT,
    liked_percent INTEGER,

    cover_img     TEXT,
    price         NUMERIC(10,2),

    -- Phase 3 (semantic search): bge-m3 produces 1024-dimensional vectors.
    -- Nullable now; populated once embeddings are generated.
    embedding     vector(1024),

    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Full-Text Search vector, auto-maintained by PostgreSQL.
    -- Weights (A > B > C > D) make matches in the title count more than in the
    -- author, genres, or description. The 'simple' configuration is used on
    -- purpose: the dataset mixes languages (EN/PT), and 'simple' avoids
    -- language-specific stemming that would misbehave across languages.
    -- NOTE: the exact field weighting is a deferred tuning decision.
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(author, '')), 'B') ||
        setweight(to_tsvector('simple', coalesce(array_to_string(genres, ' '), '')), 'C') ||
        setweight(to_tsvector('simple', coalesce(description, '')), 'D')
    ) STORED
);

-- Index for keyword search (Phase 3).
CREATE INDEX idx_books_search_vector ON books USING GIN (search_vector);

-- Index for genre filtering (US03).
CREATE INDEX idx_books_genres ON books USING GIN (genres);

-- Helps author filtering / sorting.
CREATE INDEX idx_books_author ON books (author);
