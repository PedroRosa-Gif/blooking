-- V4 — Application users.
--
-- Identity table backing JWT authentication (US06–US08). Login is by `username`
-- for now; an optional verified `email` can be added later when email
-- verification / password recovery is implemented.

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    -- BCrypt hash of the password. Never store or log the plaintext password.
    password_hash TEXT NOT NULL,
    display_name  TEXT,
    -- Coarse-grained role for authorization. 'USER' today; 'ADMIN' later.
    role          TEXT NOT NULL DEFAULT 'USER',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
