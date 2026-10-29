package dev.blooking.backend.recommendation;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.blooking.backend.book.Book;
import dev.blooking.backend.book.BookRepository;
import dev.blooking.backend.book.dto.BookSummaryResponse;
import dev.blooking.backend.favorite.Favorite;
import dev.blooking.backend.favorite.FavoriteRepository;
import dev.blooking.backend.recommendation.dto.FavoriteRecommendationResponse;

/**
 * Serves personalized book recommendations (US05).
 *
 * <p>Strategy:
 * <ol>
 *   <li><b>Content-based</b> — if the user has a preference embedding (built by
 *       the recommendation worker from their favorites), return the books whose
 *       embeddings are nearest to it by cosine distance, excluding books they
 *       already favorite.</li>
 *   <li><b>Cold-start fallback</b> — if the user has no preference embedding yet
 *       (no favorites), return the most popular books instead, so the section is
 *       never empty.</li>
 * </ol>
 */
@Service
@Transactional(readOnly = true)
public class RecommendationService {

    /** How many of the user's most-recent favorites become carousels. */
    private static final int MAX_FAVORITE_CAROUSELS = 8;
    /** How many similar books each "because you liked X" carousel contains. */
    private static final int SIMILAR_PER_FAVORITE = 12;

    private final UserProfileRepository userProfileRepository;
    private final BookRepository bookRepository;
    private final FavoriteRepository favoriteRepository;

    public RecommendationService(UserProfileRepository userProfileRepository,
                                 BookRepository bookRepository,
                                 FavoriteRepository favoriteRepository) {
        this.userProfileRepository = userProfileRepository;
        this.bookRepository = bookRepository;
        this.favoriteRepository = favoriteRepository;
    }

    /**
     * Returns up to {@code limit} recommended books for the user, in ranked
     * order (most relevant first).
     */
    public List<BookSummaryResponse> recommendForUser(long userId, int limit) {
        boolean personalized = userProfileRepository.hasProfileEmbedding(userId);
        List<Long> rankedIds = personalized
                ? userProfileRepository.recommendByProfile(userId, limit)
                : userProfileRepository.recommendPopular(userId, limit);

        // Defensive: if the personalized query somehow returned nothing (e.g.
        // the user favorited every embedded book), fall back to popularity so
        // the response is still useful.
        if (rankedIds.isEmpty() && personalized) {
            rankedIds = userProfileRepository.recommendPopular(userId, limit);
        }

        return toSummariesInOrder(rankedIds);
    }

    /**
     * "Because you liked X" recommendations (US05): one carousel per recent
     * favorite, each listing the books most similar to that favorite by content
     * (book-to-book cosine distance on the pgvector embedding).
     *
     * <p>Builds at most {@value #MAX_FAVORITE_CAROUSELS} carousels, anchored on
     * the user's most-recent favorites, each with up to
     * {@value #SIMILAR_PER_FAVORITE} similar books. Carousels whose source book
     * has no embedding (hence no similar books) are dropped so the response has
     * no empty sections. A book may legitimately appear in more than one
     * carousel; the user's own favorites are always excluded from every
     * carousel. The list is ordered by favorite recency (newest first).
     */
    public List<FavoriteRecommendationResponse> recommendByFavorites(long userId) {
        List<Favorite> recent = favoriteRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(0, MAX_FAVORITE_CAROUSELS));
        if (recent.isEmpty()) {
            return List.of();
        }

        // Rank similar-book ids per favorite first, then resolve every book
        // (sources + all similars) in a single findAllById to avoid N+1 queries.
        record Carousel(long sourceId, List<Long> similarIds) {
        }
        List<Carousel> carousels = new ArrayList<>();
        for (Favorite fav : recent) {
            List<Long> similarIds = userProfileRepository.recommendSimilarToBook(
                    fav.getBookId(), userId, SIMILAR_PER_FAVORITE);
            if (!similarIds.isEmpty()) {
                carousels.add(new Carousel(fav.getBookId(), similarIds));
            }
        }
        if (carousels.isEmpty()) {
            return List.of();
        }

        Map<Long, Book> byId = loadBooks(carousels.stream()
                .flatMap(c -> java.util.stream.Stream.concat(
                        java.util.stream.Stream.of(c.sourceId()), c.similarIds().stream()))
                .collect(Collectors.toList()));

        List<FavoriteRecommendationResponse> out = new ArrayList<>();
        for (Carousel c : carousels) {
            Book source = byId.get(c.sourceId());
            if (source == null) {
                continue; // favorite points at a book that no longer exists
            }
            List<BookSummaryResponse> similar = c.similarIds().stream()
                    .map(byId::get)
                    .filter(b -> b != null)
                    .map(BookSummaryResponse::from)
                    .collect(Collectors.toList());
            if (!similar.isEmpty()) {
                out.add(new FavoriteRecommendationResponse(
                        BookSummaryResponse.from(source), similar));
            }
        }
        return out;
    }

    /**
     * Fetches books by id and returns them preserving the ranked id order
     * ({@code findAllById} does not guarantee ordering).
     */
    private List<BookSummaryResponse> toSummariesInOrder(List<Long> rankedIds) {
        if (rankedIds.isEmpty()) {
            return List.of();
        }
        Map<Long, Book> byId = loadBooks(rankedIds);
        return rankedIds.stream()
                .map(byId::get)
                .filter(b -> b != null)
                .map(BookSummaryResponse::from)
                .collect(Collectors.toList());
    }

    /** Loads the given book ids into an id→Book map (order not guaranteed). */
    private Map<Long, Book> loadBooks(List<Long> ids) {
        return bookRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Book::getId, Function.identity()));
    }
}
