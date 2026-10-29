package dev.blooking.backend.book;

import java.util.List;
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

    /** How a multi-genre filter combines the selected genres. */
    public enum GenreMatch {
        /** The book must contain EVERY selected genre (default). */
        ALL,
        /** The book must contain AT LEAST ONE of the selected genres. */
        ANY
    }

    /**
     * Paginated, optionally-filtered catalog listing (US02 / US03).
     *
     * <p>Blank {@code q}/{@code author} values are normalized to {@code null}
     * (no filter). {@code genres} filters by multiple genres: {@code ALL}
     * requires every genre, {@code ANY} requires at least one. A null/empty
     * list applies no genre filter. Blank genre entries are dropped.
     */
    public Page<BookSummaryResponse> list(
            String q, String author, List<String> genres, GenreMatch match, Pageable pageable) {
        String[] genreArray = toGenreArray(genres);
        Pageable sorted = sanitizeSort(pageable);
        Page<Book> page = (match == GenreMatch.ANY)
                ? bookRepository.searchAnyGenre(blankToNull(q), blankToNull(author), genreArray, sorted)
                : bookRepository.searchAllGenres(blankToNull(q), blankToNull(author), genreArray, sorted);
        return page.map(BookSummaryResponse::from);
    }

    /**
     * Trim and drop blank genres. Returns {@code null} (not an empty array) when
     * there is nothing to filter, so the query skips the genre condition —
     * matching an empty array with {@code @>} or {@code &&} would exclude every
     * book.
     */
    private static String[] toGenreArray(List<String> genres) {
        if (genres == null || genres.isEmpty()) {
            return null;
        }
        String[] cleaned = genres.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .toArray(String[]::new);
        return cleaned.length == 0 ? null : cleaned;
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
