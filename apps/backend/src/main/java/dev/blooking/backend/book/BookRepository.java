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
     * case-insensitive substring match over title/author — this is only a basic
     * listing convenience. The real hybrid (semantic + keyword) search arrives
     * in Phase 3.
     *
     * <p>Genre filtering uses the native array "contains" operator via a tiny
     * SpEL-free native fragment: {@code :genre = ANY(genres)}.
     */
    @Query(value = """
            SELECT * FROM books b
            WHERE (:q IS NULL
                   OR b.title ILIKE '%' || :q || '%'
                   OR b.author ILIKE '%' || :q || '%')
              AND (:author IS NULL OR b.author ILIKE '%' || :author || '%')
              AND (:genre IS NULL OR :genre = ANY(b.genres))
            """,
            countQuery = """
            SELECT count(*) FROM books b
            WHERE (:q IS NULL
                   OR b.title ILIKE '%' || :q || '%'
                   OR b.author ILIKE '%' || :q || '%')
              AND (:author IS NULL OR b.author ILIKE '%' || :author || '%')
              AND (:genre IS NULL OR :genre = ANY(b.genres))
            """,
            nativeQuery = true)
    Page<Book> search(@Param("q") String q,
                      @Param("author") String author,
                      @Param("genre") String genre,
                      Pageable pageable);
}
