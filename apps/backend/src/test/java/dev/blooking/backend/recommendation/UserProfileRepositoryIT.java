package dev.blooking.backend.recommendation;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;

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
 * embedded DB: the weighted-centroid profile (favorites + capped views), cosine
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

    // Default weights, mirroring application.yml, used by the recompute helper.
    private static final double FAVORITE_WEIGHT = 1.0;
    private static final double VIEW_WEIGHT = 0.25;
    private static final int VIEW_CAP = 3;

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

    /** Recompute with the default weights. */
    private void recompute() {
        repo.recomputeProfile(userId, FAVORITE_WEIGHT, VIEW_WEIGHT, VIEW_CAP);
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

    /** Records {@code times} book.viewed interactions for the given book. */
    private void view(long bookId, int times) {
        for (int i = 0; i < times; i++) {
            jdbc.update(
                    "INSERT INTO interactions (event_id, event_type, user_id, book_id, occurred_at) "
                            + "VALUES (?, 'book.viewed', ?, ?, now())",
                    UUID.randomUUID(), userId, bookId);
        }
    }

    /** A 1024-dim unit vector with a single component (hotAxis) set to 1.0. */
    private static float[] axisVector(int hotAxis) {
        float[] v = new float[DIM];
        v[hotAxis] = 1.0f;
        return v;
    }

    @Test
    void recompute_withNoSignal_leavesEmptyProfile() {
        recompute();

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
        recompute();

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
        recompute();

        // Only the one embedded favorite contributes to the centroid.
        assertThat(repo.interactionCount(userId)).contains(1);
        assertThat(repo.hasProfileEmbedding(userId)).isTrue();
    }

    @Test
    void unfavorite_recompute_removesSignal() {
        long a = insertBook("A on axis 0", 100, 0);
        favorite(a);
        recompute();
        assertThat(repo.hasProfileEmbedding(userId)).isTrue();

        // Simulate an unfavorite: remove the favorite, then recompute.
        jdbc.update("DELETE FROM favorites WHERE user_id = ? AND book_id = ?", userId, a);
        recompute();

        assertThat(repo.hasProfileEmbedding(userId)).isFalse();
        assertThat(repo.interactionCount(userId)).contains(0);
    }

    @Test
    void recompute_viewContributesToProfile() {
        long viewed = insertBook("viewed book", 100, 0);
        insertBook("other", 100, 1);

        view(viewed, 1);
        recompute();

        // A view (no favorites) is enough to build a profile; one distinct book.
        assertThat(repo.hasProfileEmbedding(userId)).isTrue();
        assertThat(repo.interactionCount(userId)).contains(1);
    }

    @Test
    void recompute_repeatedViewsOfSameBookCountAsOneDistinctBook() {
        long viewed = insertBook("viewed many times", 100, 0);

        view(viewed, 10); // many refreshes
        recompute();

        // interaction_count counts DISTINCT contributing books, not raw views.
        assertThat(repo.interactionCount(userId)).contains(1);
        assertThat(repo.hasProfileEmbedding(userId)).isTrue();
    }

    @Test
    void recompute_viewsOfFavoritedBookAreExcluded() {
        long fav = insertBook("favorited and viewed", 100, 0);

        favorite(fav);
        view(fav, 5);
        recompute();

        // The view rows for a favorited book must not double-count: only the
        // favorite contributes, so exactly one distinct book.
        assertThat(repo.interactionCount(userId)).contains(1);
    }

    @Test
    void recompute_cappedViewsLetFavoriteDominateDirection() {
        // Favorite points on axis 0; a heavily-viewed book points on axis 1.
        // With favorite weight 1.0 and view weight 0.25 capped at 3 views
        // (-> 0.75), the favorite still outweighs the views, so the profile
        // leans toward axis 0 and a fresh axis-0 book ranks first.
        long fav = insertBook("fav axis 0", 100, 0);
        long viewedLots = insertBook("viewed axis 1", 100, 1);
        long candidate0 = insertBook("candidate axis 0", 100, 0);
        long candidate1 = insertBook("candidate axis 1", 100, 1);

        favorite(fav);
        view(viewedLots, 50); // capped at VIEW_CAP
        recompute();

        List<Long> recs = repo.recommendByProfile(userId, 10);

        // Already-interacted books (favorite + viewed) are excluded from recs.
        assertThat(recs).doesNotContain(fav, viewedLots);
        // The axis-0 candidate (aligned with the dominant favorite) ranks first.
        assertThat(recs.indexOf(candidate0)).isLessThan(recs.indexOf(candidate1));
    }

    @Test
    void recommendByProfile_returnsNearest_excludingFavorites() {
        long favA = insertBook("fav on axis 0", 100, 0);
        long near = insertBook("near on axis 0", 100, 0);   // same direction as the profile
        long far = insertBook("far on axis 5", 100, 5);     // orthogonal

        favorite(favA);
        recompute();

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
