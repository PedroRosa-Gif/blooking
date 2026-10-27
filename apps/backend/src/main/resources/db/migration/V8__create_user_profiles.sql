-- V8 — User preference profile (recommendation source).
--
-- One row per user that holds a single "preference embedding": the centroid
-- (mean vector) of the embeddings of the books the user currently favorites.
-- It is DERIVED, mutable state — recomputed by the recommendation worker every
-- time the user favorites/unfavorites a book — kept deliberately separate from
-- the `users` identity/auth table:
--   * `users` is read on every authenticated request (JWT filter); we don't
--     want a 1024-dim vector blob on that hot path.
--   * `books.embedding` is likewise unmapped from JPA and accessed via raw SQL;
--     the profile embedding follows the same pgvector/JdbcTemplate pattern.
--
-- The embedding is nullable: a brand-new user (or one with zero favorites) has
-- no profile vector yet, and recommendations fall back to popularity.

CREATE TABLE user_profiles (
    -- 1:1 with users. PRIMARY KEY on the FK enforces at most one profile per
    -- user; CASCADE cleans the profile up when the user is deleted.
    user_id           BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    -- Mean of the favorited books' embeddings (pgvector, 1024 dims to match
    -- books.embedding). NULL until the user has at least one favorite.
    embedding         vector(1024),
    -- How many favorited books the current embedding was averaged over. 0 means
    -- "no preference signal yet" (profile effectively empty).
    interaction_count INTEGER NOT NULL DEFAULT 0,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
