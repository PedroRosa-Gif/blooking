package dev.blooking.backend.search;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Reciprocal Rank Fusion (RRF) — merges several ranked result lists into one
 * without needing to normalize their heterogeneous scores (cosine distance vs.
 * ts_rank relevance).
 *
 * <p>For a document appearing at (1-based) rank {@code r} in a list, it earns
 * {@code 1 / (k + r)}; the fused score is the sum across all lists. Documents
 * ranked highly in multiple lists rise to the top. {@code k} dampens the
 * influence of top ranks; 60 is the value from the original RRF paper and the
 * common default.
 */
public final class ReciprocalRankFusion {

    public static final int DEFAULT_K = 60;

    private ReciprocalRankFusion() {
    }

    /**
     * Fuses the given ranked lists (each already ordered best-first) and returns
     * document ids ordered by descending fused score.
     */
    @SafeVarargs
    public static List<Long> fuse(int k, List<Long>... rankedLists) {
        Map<Long, Double> scores = new LinkedHashMap<>();
        for (List<Long> list : rankedLists) {
            if (list == null) {
                continue;
            }
            for (int i = 0; i < list.size(); i++) {
                long id = list.get(i);
                int rank = i + 1; // 1-based
                scores.merge(id, 1.0 / (k + rank), Double::sum);
            }
        }
        return scores.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    @SafeVarargs
    public static List<Long> fuse(List<Long>... rankedLists) {
        return fuse(DEFAULT_K, rankedLists);
    }
}
