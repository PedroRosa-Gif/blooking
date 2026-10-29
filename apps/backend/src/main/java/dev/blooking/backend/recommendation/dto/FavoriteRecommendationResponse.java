package dev.blooking.backend.recommendation.dto;

import java.util.List;

import dev.blooking.backend.book.dto.BookSummaryResponse;

/**
 * One "because you liked X" carousel: a favorited book the user already saved
 * ({@code source}) paired with the books most similar to it ({@code similar}),
 * ranked most-similar first.
 *
 * <p>The recommendations screen renders one of these per recent favorite. A
 * book may appear in more than one carousel (each carousel is independent and
 * anchored on its own source favorite); the source favorites themselves are
 * never included in any {@code similar} list.
 */
public record FavoriteRecommendationResponse(
        BookSummaryResponse source,
        List<BookSummaryResponse> similar
) {
}
