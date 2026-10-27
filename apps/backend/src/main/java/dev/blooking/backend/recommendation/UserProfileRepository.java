package dev.blooking.backend.recommendation;

import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Native-SQL access for the recommendation feature.
 *
 * <p>Like {@code SearchRepository}, this uses {@link JdbcTemplate} rather than
 * JPA because every query touches the pgvector {@code embedding} columns
 * ({@code user_profiles.embedding} and {@code books.embedding}), which have no
 * portable JPA mapping.
 */
@Repository
public class UserProfileRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserProfileRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Recomputes and stores a user's preference embedding as the <b>centroid</b>
     * (element-wise mean) of the embeddings of the books they currently
     * favorite, all in a single SQL statement so the profile is always
     * consistent with the live favorites.
     *
     * <p>pgvector's {@code avg()} aggregate averages the vectors component by
     * component; only favorited books that actually have an embedding are
     * considered. {@code interaction_count} records how many vectors the mean
     * was taken over.
     *
     * <p>If the user has no favorites with an embedding, the average is
     * {@code NULL} and the profile is reset to an empty state
     * ({@code embedding = NULL, interaction_count = 0}) — which makes
     * recommendations fall back to popularity. The write is an UPSERT so it
     * works whether or not a profile row already exists.
     */
    public void recomputeProfile(long userId) {
        jdbcTemplate.update(
                """
                INSERT INTO user_profiles (user_id, embedding, interaction_count, updated_at)
                SELECT
                    ?,
                    agg.centroid,
                    agg.n,
                    now()
                FROM (
                    SELECT avg(b.embedding) AS centroid, count(b.embedding) AS n
                    FROM favorites f
                    JOIN books b ON b.id = f.book_id
                    WHERE f.user_id = ?
                      AND b.embedding IS NOT NULL
                ) AS agg
                ON CONFLICT (user_id) DO UPDATE
                    SET embedding = EXCLUDED.embedding,
                        interaction_count = EXCLUDED.interaction_count,
                        updated_at = EXCLUDED.updated_at
                """,
                userId, userId);
    }

    /** Whether the user has a non-null preference embedding (any positive signal). */
    public boolean hasProfileEmbedding(long userId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM user_profiles WHERE user_id = ? AND embedding IS NOT NULL",
                Long.class, userId);
        return count != null && count > 0;
    }

    /**
     * Content-based recommendations: the {@code limit} books nearest (cosine
     * distance) to the user's preference embedding, <b>excluding books the user
     * already favorites</b> (no point recommending what they already saved) and
     * books without an embedding. Ordered most-similar first.
     *
     * <p>Returns an empty list when the user has no preference embedding.
     */
    public List<Long> recommendByProfile(long userId, int limit) {
        return jdbcTemplate.query(
                """
                SELECT b.id
                FROM books b
                JOIN user_profiles p ON p.user_id = ?
                WHERE p.embedding IS NOT NULL
                  AND b.embedding IS NOT NULL
                  AND b.id NOT IN (SELECT book_id FROM favorites WHERE user_id = ?)
                ORDER BY b.embedding <=> p.embedding
                LIMIT ?
                """,
                (rs, rowNum) -> rs.getLong("id"),
                userId, userId, limit);
    }

    /**
     * Cold-start fallback: the most popular books (by number of ratings, then
     * rating), excluding anything the user already favorites. Used when the user
     * has no preference embedding yet (no favorites / brand-new account), so the
     * recommendations section (US05) is never empty.
     */
    public List<Long> recommendPopular(long userId, int limit) {
        return jdbcTemplate.query(
                """
                SELECT id
                FROM books
                WHERE id NOT IN (SELECT book_id FROM favorites WHERE user_id = ?)
                ORDER BY num_ratings DESC NULLS LAST, rating DESC NULLS LAST
                LIMIT ?
                """,
                (rs, rowNum) -> rs.getLong("id"),
                userId, limit);
    }

    /** Reads the stored interaction_count for a user, if a profile row exists. */
    public Optional<Integer> interactionCount(long userId) {
        List<Integer> counts = jdbcTemplate.query(
                "SELECT interaction_count FROM user_profiles WHERE user_id = ?",
                (rs, rowNum) -> rs.getInt("interaction_count"), userId);
        return counts.isEmpty() ? Optional.empty() : Optional.of(counts.get(0));
    }
}
