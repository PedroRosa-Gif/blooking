package dev.blooking.backend.book;

import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import dev.blooking.backend.book.dto.BookDetailResponse;
import dev.blooking.backend.book.dto.BookSummaryResponse;
import dev.blooking.backend.common.exception.ResourceNotFoundException;

@Service
@Transactional(readOnly = true)
public class BookService {

    /**
     * Whitelist of sortable fields. Because the listing uses a native query,
     * the sort must reference real column names. We also accept the JPA field
     * aliases and translate them, so clients can use either form safely.
     */
    private static final Map<String, String> SORTABLE_COLUMNS = Map.of(
            "title", "title",
            "author", "author",
            "rating", "rating",
            "numRatings", "num_ratings",
            "num_ratings", "num_ratings",
            "publishYear", "publish_year",
            "publish_year", "publish_year");

    private static final Set<String> ALLOWED_COLUMNS = Set.copyOf(SORTABLE_COLUMNS.values());

    private static final String DEFAULT_SORT_COLUMN = "num_ratings";

    private final BookRepository bookRepository;

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    /**
     * Paginated, optionally-filtered catalog listing (US02 / US03).
     * Blank filter values are normalized to {@code null} (no filter).
     */
    public Page<BookSummaryResponse> list(String q, String author, String genre, Pageable pageable) {
        Page<Book> page = bookRepository.search(
                blankToNull(q),
                blankToNull(author),
                blankToNull(genre),
                sanitizeSort(pageable));
        return page.map(BookSummaryResponse::from);
    }

    /**
     * Rebuilds the {@link Pageable} so its sort only references whitelisted
     * physical columns (protects the native query from injection / invalid
     * identifiers). Unknown sort fields fall back to the default column.
     */
    private Pageable sanitizeSort(Pageable pageable) {
        Sort.Order order = pageable.getSort().stream().findFirst().orElse(null);
        String column = DEFAULT_SORT_COLUMN;
        Sort.Direction direction = Sort.Direction.DESC;
        if (order != null) {
            column = SORTABLE_COLUMNS.getOrDefault(order.getProperty(), DEFAULT_SORT_COLUMN);
            direction = order.getDirection();
        }
        if (!ALLOWED_COLUMNS.contains(column)) {
            column = DEFAULT_SORT_COLUMN;
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(direction, column));
    }

    /** Book detail by id (US04); 404 when not found. */
    public BookDetailResponse getById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found: " + id));
        return BookDetailResponse.from(book);
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
