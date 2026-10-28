package dev.blooking.backend.recommendation;

import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import dev.blooking.backend.search.VectorLiterals;

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

    /** A single book embedding plus the weight it contributes to the centroid. */
    private record WeightedEmbedding(float[] embedding, double weight) {
    }

    /**
     * Recomputes and stores a user's preference embedding as a <b>weighted
     * centroid</b> of the books they have interacted with, combining two signals
     * in a single SQL statement so the profile is always consistent with the
     * live data:
     *
     * <ul>
     *   <li><b>Favorites</b> (strong signal): each favorited book contributes
     *       its embedding with weight {@code favoriteWeight} (e.g. 1.0). This is
     *       a live set — unfavoriting removes the book from the average.</li>
     *   <li><b>Views</b> (weaker signal): each <em>distinct</em> viewed book
     *       contributes with weight {@code viewWeight × min(view_count, viewCap)}.
     *       The cap lets repeated views of the same book count as a stronger
     *       interest ("the user keeps coming back") <em>without</em> letting a
     *       burst of page refreshes drown out the user's other interests.
     *       Views of books the user has <em>favorited</em> are excluded to avoid
     *       double-counting — the favorite is already the strongest signal.</li>
     * </ul>
     *
     * <p>The profile is the weighted mean {@code SUM(weight·embedding) / SUM(weight)}.
     * The per-book weights are selected in SQL, but the weighted average itself
     * is computed in Java: pgvector does <em>not</em> provide a scalar
     * {@code vector * float} operator (only element-wise {@code vector * vector}),
     * so doing the weighting in Java is both correct and version-independent.
     * Only books that actually have an embedding participate.
     * {@code interaction_count} records how many distinct books contributed
     * (favorites + distinct non-favorited views).
     *
     * <p>If there is no usable signal (no favorites and no views with an
     * embedding), the profile is reset to an empty state
     * ({@code embedding = NULL, interaction_count = 0}) — which makes
     * recommendations fall back to popularity. The write is an UPSERT so it
     * works whether or not a profile row already exists.
     *
     * @param favoriteWeight per-book weight for a favorite (e.g. 1.0)
     * @param viewWeight     per-view weight for a viewed book (e.g. 0.25)
     * @param viewCap        max views per book counted (e.g. 3) — caps refreshes
     */
    public void recomputeProfile(long userId, double favoriteWeight, double viewWeight, int viewCap) {
        List<WeightedEmbedding> signals = loadWeightedEmbeddings(userId, favoriteWeight, viewWeight, viewCap);
        float[] centroid = weightedCentroid(signals);
        upsertProfile(userId, centroid, signals.size());
    }

    /**
     * Loads one {@link WeightedEmbedding} per contributing book: every favorited
     * book with an embedding (weight = favoriteWeight), plus every distinct
     * non-favorited viewed book with an embedding (weight =
     * viewWeight × min(view_count, viewCap)). The embedding is read as pgvector's
     * text literal and parsed to a {@code float[]}.
     */
    private List<WeightedEmbedding> loadWeightedEmbeddings(long userId, double favoriteWeight,
                                                           double viewWeight, int viewCap) {
        return jdbcTemplate.query(
                """
                -- Favorites: strong signal, one row per favorited book.
                SELECT b.embedding::text AS embedding, CAST(? AS double precision) AS weight
                FROM favorites f
                JOIN books b ON b.id = f.book_id
                WHERE f.user_id = ?
                  AND b.embedding IS NOT NULL

                UNION ALL

                -- Views: weaker signal, one row per DISTINCT viewed book, weight
                -- scaled by capped view count, excluding already-favorited books.
                SELECT b.embedding::text AS embedding,
                       CAST(? * least(v.view_count, ?) AS double precision) AS weight
                FROM (
                    SELECT book_id, count(*) AS view_count
                    FROM interactions
                    WHERE user_id = ?
                      AND event_type = 'book.viewed'
                      AND book_id IS NOT NULL
                    GROUP BY book_id
                ) v
                JOIN books b ON b.id = v.book_id
                WHERE b.embedding IS NOT NULL
                  AND v.book_id NOT IN (SELECT book_id FROM favorites WHERE user_id = ?)
                """,
                (rs, rowNum) -> new WeightedEmbedding(
                        VectorLiterals.fromVectorLiteral(rs.getString("embedding")),
                        rs.getDouble("weight")),
                favoriteWeight, userId,
                viewWeight, viewCap, userId, userId);
    }

    /**
     * Computes the weighted mean of the given embeddings, or {@code null} when
     * there is no usable signal (empty input or non-positive total weight).
     */
    private static float[] weightedCentroid(List<WeightedEmbedding> signals) {
        if (signals.isEmpty()) {
            return null;
        }
        int dim = signals.get(0).embedding().length;
        double[] acc = new double[dim];
        double totalWeight = 0;
        for (WeightedEmbedding s : signals) {
            double w = s.weight();
            if (w <= 0) {
                continue;
            }
            float[] e = s.embedding();
            for (int i = 0; i < dim; i++) {
                acc[i] += w * e[i];
            }
            totalWeight += w;
        }
        if (totalWeight <= 0) {
            return null;
        }
        float[] centroid = new float[dim];
        for (int i = 0; i < dim; i++) {
            centroid[i] = (float) (acc[i] / totalWeight);
        }
        return centroid;
    }

    /**
     * UPSERTs the user's profile. A {@code null} embedding resets the profile to
     * an empty state (count 0), which triggers the popularity fallback.
     */
    private void upsertProfile(long userId, float[] embedding, int interactionCount) {
        if (embedding == null) {
            // No usable signal: reset to an empty profile (popularity fallback).
            jdbcTemplate.update(
                    """
                    INSERT INTO user_profiles (user_id, embedding, interaction_count, updated_at)
                    VALUES (?, NULL, 0, now())
                    ON CONFLICT (user_id) DO UPDATE
                        SET embedding = NULL,
                            interaction_count = 0,
                            updated_at = now()
                    """,
                    userId);
            return;
        }
        jdbcTemplate.update(
                """
                INSERT INTO user_profiles (user_id, embedding, interaction_count, updated_at)
                VALUES (?, ?::vector, ?, now())
                ON CONFLICT (user_id) DO UPDATE
                    SET embedding = EXCLUDED.embedding,
                        interaction_count = EXCLUDED.interaction_count,
                        updated_at = EXCLUDED.updated_at
                """,
                userId, VectorLiterals.toVectorLiteral(embedding), interactionCount);
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
