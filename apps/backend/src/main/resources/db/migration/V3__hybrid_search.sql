-- V3 — Hybrid search support.
--
-- Two changes to enable the hybrid (semantic + keyword) search:
--   1) Re-weight the Full-Text Search vector to the agreed field priority:
--        title > author > description > (genres / rest)
--      (V2 had title > author > genres > description.)
--   2) Add an approximate-nearest-neighbour index on the `embedding` column so
--      cosine-similarity semantic search does not fall back to a sequential
--      scan once embeddings are populated.

-- 1) Rebuild the generated search_vector with the new weight ordering.
--    A STORED generated column cannot be altered in place, so we drop and
--    recreate it. The IMMUTABLE requirements from V2 still apply:
--      * pin the config with ::regconfig (2-arg to_tsvector is only STABLE);
--      * use array_to_tsvector(genres) (immutable) instead of array_to_string.
ALTER TABLE books DROP COLUMN search_vector;

ALTER TABLE books
    ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple'::regconfig, coalesce(title, '')),       'A') ||
        setweight(to_tsvector('simple'::regconfig, coalesce(author, '')),      'B') ||
        setweight(to_tsvector('simple'::regconfig, coalesce(description, '')), 'C') ||
        setweight(array_to_tsvector(genres),                                   'D')
    ) STORED;

-- Recreate the FTS index dropped together with the column.
CREATE INDEX idx_books_search_vector ON books USING GIN (search_vector);

-- 2) Approximate nearest-neighbour index for semantic search.
--    HNSW with cosine distance (vector_cosine_ops) matches the `<=>` operator
--    used by the semantic query. HNSW builds fine on an empty/partly-populated
--    table and is maintained as rows are updated with embeddings.
CREATE INDEX idx_books_embedding_hnsw
    ON books USING hnsw (embedding vector_cosine_ops);
