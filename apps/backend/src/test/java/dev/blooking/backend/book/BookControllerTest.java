package dev.blooking.backend.book;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import dev.blooking.backend.book.dto.BookDetailResponse;
import dev.blooking.backend.book.dto.BookSummaryResponse;
import dev.blooking.backend.common.exception.ResourceNotFoundException;

/**
 * Web-layer tests for {@link BookController}. The service is mocked, so these
 * run fast and need no database.
 */
@WebMvcTest(BookController.class)
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
class BookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BookService bookService;

    @MockitoBean
    private dev.blooking.backend.events.EventPublisher eventPublisher;

    private BookSummaryResponse sampleSummary() {
        return new BookSummaryResponse(1L, "The Hunger Games", "Suzanne Collins",
                "The Hunger Games #1", List.of("Fiction", "Dystopia"),
                new BigDecimal("4.33"), 6376780L, 2008, "http://cover");
    }

    private BookDetailResponse sampleDetail() {
        return new BookDetailResponse(1L, "The Hunger Games", "The Hunger Games #1",
                "Suzanne Collins", "A description", "English", "9780439023481",
                List.of("Fiction", "Dystopia"), List.of("Katniss"), List.of("Some Award"),
                "Hardcover", 374, "Scholastic Press", 2008,
                new BigDecimal("4.33"), 6376780L, 96, "http://cover", new BigDecimal("5.09"));
    }

    @Test
    void list_returnsPagedBooks() throws Exception {
        Page<BookSummaryResponse> page =
                new PageImpl<>(List.of(sampleSummary()), PageRequest.of(0, 20), 1);
        when(bookService.list(isNull(), isNull(), isNull(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/books"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].title").value("The Hunger Games"))
                .andExpect(jsonPath("$.content[0].genres[0]").value("Fiction"));
    }

    @Test
    void list_passesFiltersToService() throws Exception {
        Page<BookSummaryResponse> page =
                new PageImpl<>(List.of(sampleSummary()), PageRequest.of(0, 20), 1);
        when(bookService.list(eq("harry"), eq("rowling"), eq("Fantasy"), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/books")
                        .param("q", "harry")
                        .param("author", "rowling")
                        .param("genre", "Fantasy"))
                .andExpect(status().isOk());

        verify(bookService).list(eq("harry"), eq("rowling"), eq("Fantasy"), any(Pageable.class));
    }

    @Test
    void list_capsPageSizeAt100() throws Exception {
        Page<BookSummaryResponse> page =
                new PageImpl<>(List.of(sampleSummary()), PageRequest.of(0, 100), 1);
        when(bookService.list(isNull(), isNull(), isNull(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/books").param("size", "500"))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(bookService).list(isNull(), isNull(), isNull(), captor.capture());
        // The controller must cap the requested size (500) down to the max (100).
        org.assertj.core.api.Assertions.assertThat(captor.getValue().getPageSize()).isEqualTo(100);
    }

    @Test
    void getById_returnsDetail() throws Exception {
        when(bookService.getById(1L)).thenReturn(sampleDetail());

        mockMvc.perform(get("/api/books/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.isbn").value("9780439023481"))
                .andExpect(jsonPath("$.pages").value(374))
                .andExpect(jsonPath("$.characters[0]").value("Katniss"));
    }

    @Test
    void getById_notFound_returns404() throws Exception {
        when(bookService.getById(999L))
                .thenThrow(new ResourceNotFoundException("Book not found: 999"));

        mockMvc.perform(get("/api/books/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Book not found: 999"));
    }

    @Test
    void getById_nonNumericId_returns400() throws Exception {
        mockMvc.perform(get("/api/books/not-a-number"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
