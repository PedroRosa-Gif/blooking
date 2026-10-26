package dev.blooking.backend.search;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Native-SQL access for the hybrid search feature.
 *
 * <p>Uses {@link JdbcTemplate} rather than JPA because both the embedding write
 * path and the ranked candidate queries rely on pgvector / Full-Text Search SQL
 * that has no portable JPA mapping (the {@code embedding} and {@code search_vector}
 * columns are intentionally unmapped on the {@code Book} entity).
 */
@Repository
public class SearchRepository {

    private final JdbcTemplate jdbcTemplate;

    public SearchRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** Stores (or overwrites) the embedding for a single book. */
    public void updateEmbedding(long bookId, float[] embedding) {
        jdbcTemplate.update(
                "UPDATE books SET embedding = ?::vector WHERE id = ?",
                VectorLiterals.toVectorLiteral(embedding), bookId);
    }

    /** Number of books that already have an embedding (used to gate indexing). */
    public long countEmbedded() {
        Long count = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM books WHERE embedding IS NOT NULL", Long.class);
        return count == null ? 0L : count;
    }

    /**
     * Semantic candidates: the {@code limit} nearest books by cosine distance
     * to the query vector, ordered closest-first. Rank 1 = most similar.
     * Only rows that actually have an embedding are considered.
     */
    public List<Long> semanticCandidates(float[] queryVector, int limit) {
        return jdbcTemplate.query(
                """
                SELECT id
                FROM books
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> ?::vector
                LIMIT ?
                """,
                (rs, rowNum) -> rs.getLong("id"),
                VectorLiterals.toVectorLiteral(queryVector), limit);
    }

    /**
     * Keyword candidates: the {@code limit} best Full-Text Search matches for
     * the query, ordered by {@code ts_rank} (weighted by the search_vector
     * field weights), best-first. Rank 1 = best textual match.
     *
     * <p>Uses {@code websearch_to_tsquery} with the same {@code 'simple'}
     * configuration the generated column uses, so queries and stored lexemes
     * are produced consistently.
     */
    public List<Long> keywordCandidates(String query, int limit) {
        return jdbcTemplate.query(
                """
                SELECT id
                FROM books
                WHERE search_vector @@ websearch_to_tsquery('simple', ?)
                ORDER BY ts_rank(search_vector, websearch_to_tsquery('simple', ?)) DESC
                LIMIT ?
                """,
                (rs, rowNum) -> rs.getLong("id"),
                query, query, limit);
    }
}
