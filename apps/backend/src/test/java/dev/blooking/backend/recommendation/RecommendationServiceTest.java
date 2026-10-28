package dev.blooking.backend.recommendation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import dev.blooking.backend.book.Book;
import dev.blooking.backend.book.BookRepository;
import dev.blooking.backend.book.dto.BookSummaryResponse;

/**
 * Unit tests for {@link RecommendationService}: verifies the strategy selection
 * (personalized vs. cold-start fallback) and that results are returned in the
 * repository's ranked order. The repository (pgvector SQL) is mocked, so these
 * run fast with no database.
 */
@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private BookRepository bookRepository;

    @InjectMocks
    private RecommendationService recommendationService;

    @Test
    void usesProfile_whenUserHasPreferenceEmbedding() {
        when(userProfileRepository.hasProfileEmbedding(1L)).thenReturn(true);
        when(userProfileRepository.recommendByProfile(1L, 12)).thenReturn(List.of(10L, 20L));
        when(bookRepository.findAllById(List.of(10L, 20L)))
                .thenReturn(List.of(bookWithId(10L, "Nearest"), bookWithId(20L, "Second")));

        List<BookSummaryResponse> result = recommendationService.recommendForUser(1L, 12);

        assertThat(result).extracting(BookSummaryResponse::title)
                .containsExactly("Nearest", "Second");
        verify(userProfileRepository, never()).recommendPopular(anyLong(), anyInt());
    }

    @Test
    void fallsBackToPopularity_whenNoPreferenceEmbedding() {
        when(userProfileRepository.hasProfileEmbedding(1L)).thenReturn(false);
        when(userProfileRepository.recommendPopular(1L, 12)).thenReturn(List.of(99L));
        when(bookRepository.findAllById(List.of(99L)))
                .thenReturn(List.of(bookWithId(99L, "Popular")));

        List<BookSummaryResponse> result = recommendationService.recommendForUser(1L, 12);

        assertThat(result).extracting(BookSummaryResponse::title).containsExactly("Popular");
        verify(userProfileRepository, never()).recommendByProfile(anyLong(), anyInt());
    }

    @Test
    void fallsBackToPopularity_whenPersonalizedQueryReturnsNothing() {
        when(userProfileRepository.hasProfileEmbedding(1L)).thenReturn(true);
        when(userProfileRepository.recommendByProfile(1L, 12)).thenReturn(List.of());
        when(userProfileRepository.recommendPopular(1L, 12)).thenReturn(List.of(99L));
        when(bookRepository.findAllById(List.of(99L)))
                .thenReturn(List.of(bookWithId(99L, "Popular")));

        List<BookSummaryResponse> result = recommendationService.recommendForUser(1L, 12);

        assertThat(result).extracting(BookSummaryResponse::title).containsExactly("Popular");
    }

    @Test
    void preservesRankedOrder_evenWhenFindAllByIdReordersThem() {
        when(userProfileRepository.hasProfileEmbedding(1L)).thenReturn(true);
        when(userProfileRepository.recommendByProfile(1L, 12)).thenReturn(List.of(30L, 10L, 20L));
        // findAllById returns in arbitrary (here: ascending id) order.
        when(bookRepository.findAllById(List.of(30L, 10L, 20L))).thenReturn(List.of(
                bookWithId(10L, "A"), bookWithId(20L, "B"), bookWithId(30L, "C")));

        List<BookSummaryResponse> result = recommendationService.recommendForUser(1L, 12);

        assertThat(result).extracting(BookSummaryResponse::id)
                .containsExactly(30L, 10L, 20L);
    }

    /** Builds a Book whose id getter returns the given id (id is DB-generated,
     *  so we set it via reflection for test purposes). */
    private static Book bookWithId(long id, String title) {
        Book b = new Book();
        b.setTitle(title);
        b.setSourceId("src-" + id);
        try {
            java.lang.reflect.Field f = Book.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(b, id);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
        return b;
    }
}
