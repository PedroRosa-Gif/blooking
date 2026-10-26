-- V1 — Enable required PostgreSQL extensions.
--
-- This is the very first migration Flyway applies to a fresh database.
-- It only enables extensions; no application tables are created yet
-- (those arrive in later, feature-specific migrations).
--
-- pgvector: provides the `vector` column type and similarity operators
--           (cosine `<=>`, L2 `<->`, inner product `<#>`) used by the
--           semantic search / recommendation features.
CREATE EXTENSION IF NOT EXISTS vector;
