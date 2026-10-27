-- V7 — User interaction log.
--
-- Append-only record of user interaction events consumed from RabbitMQ. Serves
-- two purposes:
--   1) Audit trail / history of what users did and when.
--   2) Source data for personalized recommendations (next phase).
--
-- This table is only ever INSERTed into — never updated or deleted — which is
-- the common pattern for an event/audit log.

CREATE TABLE interactions (
    id          BIGSERIAL PRIMARY KEY,
    -- Deduplication key: the event id from the message envelope. UNIQUE so a
    -- redelivered message (RabbitMQ is at-least-once) is not recorded twice.
    event_id    UUID NOT NULL UNIQUE,
    event_type  TEXT NOT NULL,        -- book.viewed | book.searched | book.favorited | book.unfavorited
    -- Nullable: anonymous interactions (viewed/searched without login) have no user.
    user_id     BIGINT REFERENCES users (id) ON DELETE SET NULL,
    -- Nullable: a search event has no specific book.
    book_id     BIGINT REFERENCES books (id) ON DELETE SET NULL,
    -- Free-form detail, e.g. the search query text for book.searched.
    detail      TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interactions_user_id ON interactions (user_id);
CREATE INDEX idx_interactions_event_type ON interactions (event_type);
