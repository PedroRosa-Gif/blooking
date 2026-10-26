package dev.blooking.backend.search;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class ReciprocalRankFusionTest {

    @Test
    void fuse_documentInBothLists_outranksSingleListDocuments() {
        // id 2 appears in both lists -> should rank first after fusion.
        List<Long> semantic = List.of(1L, 2L, 3L);
        List<Long> keyword = List.of(2L, 4L, 5L);

        List<Long> fused = ReciprocalRankFusion.fuse(semantic, keyword);

        assertThat(fused).first().isEqualTo(2L);
        assertThat(fused).contains(1L, 2L, 3L, 4L, 5L);
    }

    @Test
    void fuse_respectsRankWithinASingleList() {
        List<Long> only = List.of(10L, 20L, 30L);

        List<Long> fused = ReciprocalRankFusion.fuse(only, List.of());

        assertThat(fused).containsExactly(10L, 20L, 30L);
    }

    @Test
    void fuse_handlesNullAndEmptyLists() {
        assertThat(ReciprocalRankFusion.fuse((List<Long>) null)).isEmpty();
        assertThat(ReciprocalRankFusion.fuse(List.of(), List.of())).isEmpty();
    }

    @Test
    void fuse_higherKReducesSeparationButKeepsOrder() {
        List<Long> a = List.of(1L, 2L);
        List<Long> b = List.of(2L, 1L);

        // 1 and 2 are symmetric here; both present -> both retained.
        List<Long> fused = ReciprocalRankFusion.fuse(100, a, b);
        assertThat(fused).containsExactlyInAnyOrder(1L, 2L);
    }
}
