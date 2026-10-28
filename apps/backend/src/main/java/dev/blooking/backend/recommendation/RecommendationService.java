package dev.blooking.backend.recommendation;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.blooking.backend.book.Book;
import dev.blooking.backend.book.BookRepository;
import dev.blooking.backend.book.dto.BookSummaryResponse;

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

    private final UserProfileRepository userProfileRepository;
    private final BookRepository bookRepository;

    public RecommendationService(UserProfileRepository userProfileRepository,
                                 BookRepository bookRepository) {
        this.userProfileRepository = userProfileRepository;
        this.bookRepository = bookRepository;
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
     * Fetches books by id and returns them preserving the ranked id order
     * ({@code findAllById} does not guarantee ordering).
     */
    private List<BookSummaryResponse> toSummariesInOrder(List<Long> rankedIds) {
        if (rankedIds.isEmpty()) {
            return List.of();
        }
        Map<Long, Book> byId = bookRepository.findAllById(rankedIds).stream()
                .collect(Collectors.toMap(Book::getId, Function.identity()));
        return rankedIds.stream()
                .map(byId::get)
                .filter(b -> b != null)
                .map(BookSummaryResponse::from)
                .collect(Collectors.toList());
    }
}
