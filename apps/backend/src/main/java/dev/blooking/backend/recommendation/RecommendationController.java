package dev.blooking.backend.recommendation;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.blooking.backend.book.dto.BookSummaryResponse;

/**
 * Personalized recommendations endpoint (US05). Requires authentication; the
 * target user is taken from the JWT (never from a request parameter), so a user
 * can only ever fetch their own recommendations.
 */
@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    /** Default number of recommendations when the caller doesn't specify one. */
    private static final int DEFAULT_LIMIT = 12;
    /** Hard cap to protect the backend from abusive requests. */
    private static final int MAX_LIMIT = 50;

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping
    public List<BookSummaryResponse> recommendations(
            Authentication authentication,
            @RequestParam(defaultValue = "" + DEFAULT_LIMIT) int limit) {
        long userId = (Long) authentication.getPrincipal();
        return recommendationService.recommendForUser(userId, clampLimit(limit));
    }

    private static int clampLimit(int limit) {
        if (limit < 1) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }
}
