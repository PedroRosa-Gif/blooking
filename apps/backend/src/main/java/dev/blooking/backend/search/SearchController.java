package dev.blooking.backend.search;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import dev.blooking.backend.book.dto.BookSummaryResponse;
import dev.blooking.backend.common.security.CurrentUser;
import dev.blooking.backend.events.EventPublisher;
import dev.blooking.backend.events.InteractionEvent;
import dev.blooking.backend.events.InteractionEventType;
import org.springframework.util.StringUtils;

/**
 * Hybrid search endpoint (US01): combines semantic (vector) and keyword
 * (Full-Text Search) retrieval, fused with Reciprocal Rank Fusion.
 */
@RestController
@RequestMapping("/api/search")
public class SearchController {

    private static final int MAX_LIMIT = 50;

    private final HybridSearchService hybridSearchService;
    private final EventPublisher eventPublisher;

    public SearchController(HybridSearchService hybridSearchService, EventPublisher eventPublisher) {
        this.hybridSearchService = hybridSearchService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Example: {@code GET /api/search?q=young wizard school&limit=10}
     *
     * @param q     free-text query (supports English and Portuguese)
     * @param limit max number of results (1..50, default 20)
     */
    @GetMapping
    public List<BookSummaryResponse> search(
            @RequestParam String q,
            @RequestParam(required = false, defaultValue = "20") int limit) {
        int effectiveLimit = Math.max(1, Math.min(limit, MAX_LIMIT));
        List<BookSummaryResponse> results = hybridSearchService.search(q, effectiveLimit);

        // A non-blank query is a "searched" interaction; the query text is kept
        // in `detail` (no specific book). Attributed to the user if logged in.
        if (StringUtils.hasText(q)) {
            eventPublisher.publish(InteractionEvent.of(
                    InteractionEventType.SEARCHED, CurrentUser.idOrNull(), null, q));
        }
        return results;
    }
}
