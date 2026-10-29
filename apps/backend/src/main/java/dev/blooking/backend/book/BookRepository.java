package dev.blooking.backend.book;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookRepository extends JpaRepository<Book, Long> {

    boolean existsBySourceId(String sourceId);

    /**
     * Paginated catalog listing with optional filters (US02 / US03).
     *
     * <p>All filters are optional: when a parameter is {@code null} the
     * corresponding condition is skipped. The {@code q} filter is a simple
     * case-insensitive substring match over title/author.
     *
     * <p>Genre filtering supports several genres with two modes, selected by the
     * caller (see {@link BookService}):
     * <ul>
     *   <li><b>ALL</b> — the book must contain every selected genre
     *       ({@code b.genres @> :genres}).</li>
     *   <li><b>ANY</b> — the book must contain at least one
     *       ({@code b.genres && :genres}).</li>
     * </ul>
     * Both operators use the GIN index on {@code genres}. A {@code null}
     * {@code genres} array skips the genre condition entirely. The two methods
     * are kept separate (rather than one query branching on a mode flag) so each
     * native SQL stays simple and its {@code countQuery} mirrors it exactly.
     *
     * <p>The {@code :genres} parameter is bound as a {@code String[]} and cast to
     * {@code text[]} in SQL to match the {@code genres text[]} column.
     */
    @Query(value = """
            SELECT * FROM books b
            WHERE (:q IS NULL
                   OR b.title ILIKE '%' || :q || '%'
                   OR b.author ILIKE '%' || :q || '%')
              AND (:author IS NULL OR b.author ILIKE '%' || :author || '%')
              AND (CAST(:genres AS text[]) IS NULL OR b.genres @> CAST(:genres AS text[]))
            """,
            countQuery = """
            SELECT count(*) FROM books b
            WHERE (:q IS NULL
                   OR b.title ILIKE '%' || :q || '%'
                   OR b.author ILIKE '%' || :q || '%')
              AND (:author IS NULL OR b.author ILIKE '%' || :author || '%')
              AND (CAST(:genres AS text[]) IS NULL OR b.genres @> CAST(:genres AS text[]))
            """,
            nativeQuery = true)
    Page<Book> searchAllGenres(@Param("q") String q,
                               @Param("author") String author,
                               @Param("genres") String[] genres,
                               Pageable pageable);

    @Query(value = """
            SELECT * FROM books b
            WHERE (:q IS NULL
                   OR b.title ILIKE '%' || :q || '%'
                   OR b.author ILIKE '%' || :q || '%')
              AND (:author IS NULL OR b.author ILIKE '%' || :author || '%')
              AND (CAST(:genres AS text[]) IS NULL OR b.genres && CAST(:genres AS text[]))
            """,
            countQuery = """
            SELECT count(*) FROM books b
            WHERE (:q IS NULL
                   OR b.title ILIKE '%' || :q || '%'
                   OR b.author ILIKE '%' || :q || '%')
              AND (:author IS NULL OR b.author ILIKE '%' || :author || '%')
              AND (CAST(:genres AS text[]) IS NULL OR b.genres && CAST(:genres AS text[]))
            """,
            nativeQuery = true)
    Page<Book> searchAnyGenre(@Param("q") String q,
                              @Param("author") String author,
                              @Param("genres") String[] genres,
                              Pageable pageable);
}
