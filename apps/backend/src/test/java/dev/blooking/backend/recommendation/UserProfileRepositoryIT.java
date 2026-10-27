package dev.blooking.backend.recommendation;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import dev.blooking.backend.search.VectorLiterals;
import dev.blooking.backend.support.PostgresTestContainer;

/**
 * Integration tests for {@link UserProfileRepository} against a real PostgreSQL
 * (+pgvector) container. Exercises the pgvector SQL that cannot run on an
 * embedded DB: centroid (vector {@code avg()}) profile building, cosine
 * nearest-neighbor recommendations with favorite exclusion, and the popularity
 * cold-start fallback.
 *
 * <p>Requires Docker (skipped otherwise, see {@link PostgresTestContainer}).
 *
 * <p>Embeddings are 1024-dim to match the schema. We use simple axis-aligned
 * vectors (a single component set to 1.0) so cosine distances are predictable:
 * two books sharing the same hot component are identical in direction (distance
 * 0); books on different axes are orthogonal.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
@Import(UserProfileRepository.class)
class UserProfileRepositoryIT extends PostgresTestContainer {

    private static final int DIM = 1024;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private UserProfileRepository repo;

    private long userId;

    @BeforeEach
    void cleanAndSeedUser() {
        // Clean in FK-safe order.
        jdbc.update("DELETE FROM user_profiles");
        jdbc.update("DELETE FROM favorites");
        jdbc.update("DELETE FROM interactions");
        jdbc.update("DELETE FROM books");
        jdbc.update("DELETE FROM users");

        jdbc.update("INSERT INTO users (username, password_hash) VALUES ('alice', 'x')");
        userId = jdbc.queryForObject("SELECT id FROM users WHERE username = 'alice'", Long.class);
    }

    /** Inserts a book with the given popularity and an optional axis-aligned embedding. */
    private long insertBook(String title, long numRatings, Integer hotAxis) {
        jdbc.update("INSERT INTO books (title, num_ratings, rating) VALUES (?, ?, 4.0)",
                title, numRatings);
        long id = jdbc.queryForObject("SELECT id FROM books WHERE title = ?", Long.class, title);
        if (hotAxis != null) {
            jdbc.update("UPDATE books SET embedding = ?::vector WHERE id = ?",
                    VectorLiterals.toVectorLiteral(axisVector(hotAxis)), id);
        }
        return id;
    }

    private void favorite(long bookId) {
        jdbc.update("INSERT INTO favorites (user_id, book_id) VALUES (?, ?)", userId, bookId);
    }

    /** A 1024-dim unit vector with a single component (hotAxis) set to 1.0. */
    private static float[] axisVector(int hotAxis) {
        float[] v = new float[DIM];
        v[hotAxis] = 1.0f;
        return v;
    }

    @Test
    void recompute_withNoFavorites_leavesEmptyProfile() {
        repo.recomputeProfile(userId);

        assertThat(repo.hasProfileEmbedding(userId)).isFalse();
        assertThat(repo.interactionCount(userId)).contains(0);
    }

    @Test
    void recompute_averagesFavoritedBookEmbeddings() {
        long a = insertBook("A on axis 0", 100, 0);
        long b = insertBook("B on axis 1", 100, 1);
        insertBook("C not favorited", 100, 2);

        favorite(a);
        favorite(b);
        repo.recomputeProfile(userId);

        assertThat(repo.hasProfileEmbedding(userId)).isTrue();
        // Centroid built from the two favorited books only.
        assertThat(repo.interactionCount(userId)).contains(2);
    }

    @Test
    void recompute_ignoresFavoritesWithoutEmbedding() {
        long withEmb = insertBook("has embedding", 100, 0);
        long noEmb = insertBook("no embedding", 100, null);

        favorite(withEmb);
        favorite(noEmb);
        repo.recomputeProfile(userId);

        // Only the one embedded favorite contributes to the centroid.
        assertThat(repo.interactionCount(userId)).contains(1);
        assertThat(repo.hasProfileEmbedding(userId)).isTrue();
    }

    @Test
    void unfavorite_recompute_removesSignal() {
        long a = insertBook("A on axis 0", 100, 0);
        favorite(a);
        repo.recomputeProfile(userId);
        assertThat(repo.hasProfileEmbedding(userId)).isTrue();

        // Simulate an unfavorite: remove the favorite, then recompute.
        jdbc.update("DELETE FROM favorites WHERE user_id = ? AND book_id = ?", userId, a);
        repo.recomputeProfile(userId);

        assertThat(repo.hasProfileEmbedding(userId)).isFalse();
        assertThat(repo.interactionCount(userId)).contains(0);
    }

    @Test
    void recommendByProfile_returnsNearest_excludingFavorites() {
        long favA = insertBook("fav on axis 0", 100, 0);
        long near = insertBook("near on axis 0", 100, 0);   // same direction as the profile
        long far = insertBook("far on axis 5", 100, 5);     // orthogonal

        favorite(favA);
        repo.recomputeProfile(userId);

        List<Long> recs = repo.recommendByProfile(userId, 10);

        // The favorited book is excluded; the same-axis book ranks before the
        // orthogonal one.
        assertThat(recs).doesNotContain(favA);
        assertThat(recs).containsExactly(near, far);
    }

    @Test
    void recommendByProfile_isEmpty_whenNoProfileEmbedding() {
        insertBook("some book", 100, 0);

        assertThat(repo.recommendByProfile(userId, 10)).isEmpty();
    }

    @Test
    void recommendPopular_ordersByRatingsDesc_excludingFavorites() {
        long top = insertBook("most popular", 5000, null);
        long mid = insertBook("mid popular", 3000, null);
        long favTop = insertBook("favorited popular", 9000, null);

        favorite(favTop);

        List<Long> recs = repo.recommendPopular(userId, 10);

        assertThat(recs).doesNotContain(favTop);
        assertThat(recs).containsExactly(top, mid);
    }

    @Test
    void interactionCount_isEmpty_whenNoProfileRow() {
        assertThat(repo.interactionCount(userId)).isEmpty();
    }
}
