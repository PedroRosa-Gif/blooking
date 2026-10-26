package dev.blooking.backend.search;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import dev.blooking.backend.book.Book;
import dev.blooking.backend.book.BookRepository;
import dev.blooking.backend.book.dto.BookSummaryResponse;

/**
 * Orchestrates hybrid search: it runs a semantic (vector) query and a keyword
 * (Full-Text Search) query in parallel strategies, fuses their rankings with
 * Reciprocal Rank Fusion (RRF), and returns the top results.
 */
@Service
@Transactional(readOnly = true)
public class HybridSearchService {

    /** How many candidates to pull from EACH strategy before fusing. */
    private static final int CANDIDATE_POOL = 50;

    private final EmbeddingService embeddingService;
    private final SearchRepository searchRepository;
    private final BookRepository bookRepository;

    public HybridSearchService(EmbeddingService embeddingService,
                               SearchRepository searchRepository,
                               BookRepository bookRepository) {
        this.embeddingService = embeddingService;
        this.searchRepository = searchRepository;
        this.bookRepository = bookRepository;
    }

    /**
     * Runs hybrid search for a free-text query and returns up to {@code limit}
     * fused results. A blank query yields an empty list.
     */
    public List<BookSummaryResponse> search(String query, int limit) {
        if (!StringUtils.hasText(query)) {
            return List.of();
        }

        // Keyword candidates (FTS) — cheap, always available.
        List<Long> keywordIds = searchRepository.keywordCandidates(query, CANDIDATE_POOL);

        // Semantic candidates (vector) — embed the query, then cosine-nearest.
        List<Long> semanticIds;
        try {
            float[] queryVector = embeddingService.embed(query);
            semanticIds = searchRepository.semanticCandidates(queryVector, CANDIDATE_POOL);
        } catch (RuntimeException e) {
            // If the embedding backend (Ollama) is unavailable, degrade
            // gracefully to keyword-only results rather than failing the request.
            semanticIds = List.of();
        }

        // Fuse the two rankings with RRF.
        List<Long> fusedIds = ReciprocalRankFusion.fuse(semanticIds, keywordIds);
        if (fusedIds.isEmpty()) {
            return List.of();
        }

        List<Long> topIds = fusedIds.stream().limit(limit).toList();

        // Fetch the books and return them in the fused order (findAllById does
        // not guarantee ordering, so we re-order by the fused id list).
        Map<Long, Book> byId = bookRepository.findAllById(topIds).stream()
                .collect(Collectors.toMap(Book::getId, Function.identity()));

        return topIds.stream()
                .map(byId::get)
                .filter(b -> b != null)
                .map(BookSummaryResponse::from)
                .collect(Collectors.toList());
    }
}
