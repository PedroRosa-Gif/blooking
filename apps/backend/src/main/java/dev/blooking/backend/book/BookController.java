package dev.blooking.backend.book;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import dev.blooking.backend.book.dto.BookDetailResponse;
import dev.blooking.backend.book.dto.BookSummaryResponse;

/**
 * Read-only catalog endpoints for book discovery.
 *
 * <ul>
 *   <li>US02 — list all books (paginated)</li>
 *   <li>US03 — filter by genre / author / free text</li>
 *   <li>US04 — book detail page</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/books")
public class BookController {

    /** Hard cap on page size to protect the backend from abusive requests. */
    private static final int MAX_PAGE_SIZE = 100;

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    public Page<BookSummaryResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String genre,
            @PageableDefault(size = 20, sort = "num_ratings", direction = Sort.Direction.DESC) Pageable pageable) {
        return bookService.list(q, author, genre, capPageSize(pageable));
    }

    @GetMapping("/{id}")
    public BookDetailResponse getById(@PathVariable Long id) {
        return bookService.getById(id);
    }

    private static Pageable capPageSize(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            return org.springframework.data.domain.PageRequest.of(
                    pageable.getPageNumber(), MAX_PAGE_SIZE, pageable.getSort());
        }
        return pageable;
    }
}
