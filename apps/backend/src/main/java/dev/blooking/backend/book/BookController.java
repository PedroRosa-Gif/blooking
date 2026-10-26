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
import dev.blooking.backend.common.security.CurrentUser;
import dev.blooking.backend.events.EventPublisher;
import dev.blooking.backend.events.InteractionEvent;
import dev.blooking.backend.events.InteractionEventType;

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
    private final EventPublisher eventPublisher;

    public BookController(BookService bookService, EventPublisher eventPublisher) {
        this.bookService = bookService;
        this.eventPublisher = eventPublisher;
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
        BookDetailResponse book = bookService.getById(id);
        // US04: opening a book detail is a "viewed" interaction. Emitted after a
        // successful lookup (a 404 does not produce an event). Attributed to the
        // user if logged in, anonymous otherwise.
        eventPublisher.publish(
                InteractionEvent.of(InteractionEventType.VIEWED, CurrentUser.idOrNull(), id));
        return book;
    }

    private static Pageable capPageSize(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            return org.springframework.data.domain.PageRequest.of(
                    pageable.getPageNumber(), MAX_PAGE_SIZE, pageable.getSort());
        }
        return pageable;
    }
}
