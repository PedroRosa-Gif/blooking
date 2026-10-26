package dev.blooking.backend.search;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import dev.blooking.backend.book.dto.BookSummaryResponse;

@WebMvcTest(SearchController.class)
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
class SearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private HybridSearchService hybridSearchService;

    @MockitoBean
    private dev.blooking.backend.events.EventPublisher eventPublisher;

    private BookSummaryResponse sample() {
        return new BookSummaryResponse(1L, "The Hunger Games", "Suzanne Collins",
                "The Hunger Games #1", List.of("Dystopia"),
                new BigDecimal("4.33"), 6376780L, 2008, "http://cover");
    }

    @Test
    void search_returnsResults() throws Exception {
        when(hybridSearchService.search(eq("dystopia"), eq(20))).thenReturn(List.of(sample()));

        mockMvc.perform(get("/api/search").param("q", "dystopia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("The Hunger Games"));
    }

    @Test
    void search_cappsLimitAt50() throws Exception {
        when(hybridSearchService.search(eq("x"), eq(50))).thenReturn(List.of());

        mockMvc.perform(get("/api/search").param("q", "x").param("limit", "999"))
                .andExpect(status().isOk());

        ArgumentCaptor<Integer> limit = ArgumentCaptor.forClass(Integer.class);
        verify(hybridSearchService).search(eq("x"), limit.capture());
        org.assertj.core.api.Assertions.assertThat(limit.getValue()).isEqualTo(50);
    }

    @Test
    void search_missingQueryParam_returns400() throws Exception {
        mockMvc.perform(get("/api/search"))
                .andExpect(status().isBadRequest());
    }
}
