-- V6 — User favorites (US09–US11).
--
-- A user can favorite a book at most once (enforced by the unique constraint).
-- Deleting a user or book cascades to their favorites.

CREATE TABLE favorites (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    book_id    BIGINT NOT NULL REFERENCES books (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_favorites_user_book UNIQUE (user_id, book_id)
);

-- Fast lookup of a user's favorites (the list endpoint) and membership checks.
CREATE INDEX idx_favorites_user_id ON favorites (user_id);
