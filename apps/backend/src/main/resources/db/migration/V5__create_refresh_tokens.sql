-- V5 — Refresh tokens.
--
-- Supports the refresh-token flow: short-lived access tokens (JWT) plus
-- long-lived, server-side-revocable refresh tokens. Enables real logout
-- (revoke) and refresh-token rotation.
--
-- SECURITY: we store only a SHA-256 HASH of the refresh token, never the raw
-- token. A database leak therefore does not expose usable refresh tokens.

CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    -- SHA-256 hex digest of the raw refresh token.
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup by hash during refresh/logout, and by user for bulk revocation.
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
