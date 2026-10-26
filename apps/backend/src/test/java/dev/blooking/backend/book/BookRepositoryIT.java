package dev.blooking.backend.book;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import dev.blooking.backend.support.PostgresTestContainer;

/**
 * Integration tests for {@link BookRepository} against a real PostgreSQL
 * (+pgvector) container. Exercises the native filtered search query, including
 * the {@code text[]} genre filter which cannot run on an embedded DB.
 *
 * <p>Requires Docker to be running.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
class BookRepositoryIT extends PostgresTestContainer {

    @Autowired
    private BookRepository bookRepository;

    @BeforeEach
    void seedData() {
        bookRepository.deleteAll();
        // Flush so the subsequent NATIVE query sees the rows (native queries do
        // not trigger an automatic flush of the persistence context).
        bookRepository.saveAllAndFlush(List.of(
                book("hp5", "Harry Potter and the Order of the Phoenix", "J.K. Rowling",
                        new String[]{"Fantasy", "Young Adult"}, 2507623L, new BigDecimal("4.50")),
                book("hunger", "The Hunger Games", "Suzanne Collins",
                        new String[]{"Fantasy", "Dystopia"}, 6376780L, new BigDecimal("4.33")),
                book("pride", "Pride and Prejudice", "Jane Austen",
                        new String[]{"Classics", "Romance"}, 2998241L, new BigDecimal("4.26"))));
    }

    private Book book(String sourceId, String title, String author,
                      String[] genres, Long numRatings, BigDecimal rating) {
        Book b = new Book();
        b.setSourceId(sourceId);
        b.setTitle(title);
        b.setAuthor(author);
        b.setGenres(genres);
        b.setNumRatings(numRatings);
        b.setRating(rating);
        return b;
    }

    private PageRequest page() {
        return PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "num_ratings"));
    }

    @Test
    void search_noFilters_returnsAll() {
        Page<Book> result = bookRepository.search(null, null, null, page());
        assertThat(result.getTotalElements()).isEqualTo(3);
    }

    @Test
    void search_byGenre_usesArrayContains() {
        Page<Book> result = bookRepository.search(null, null, "Fantasy", page());
        assertThat(result.getContent())
                .extracting(Book::getTitle)
                .containsExactlyInAnyOrder(
                        "Harry Potter and the Order of the Phoenix",
                        "The Hunger Games");
    }

    @Test
    void search_byAuthor_matchesPartialCaseInsensitive() {
        Page<Book> result = bookRepository.search(null, "austen", null, page());
        assertThat(result.getContent())
                .singleElement()
                .extracting(Book::getTitle)
                .isEqualTo("Pride and Prejudice");
    }

    @Test
    void search_byFreeText_matchesTitleOrAuthor() {
        Page<Book> byTitle = bookRepository.search("hunger", null, null, page());
        assertThat(byTitle.getContent())
                .singleElement()
                .extracting(Book::getTitle)
                .isEqualTo("The Hunger Games");

        Page<Book> byAuthor = bookRepository.search("rowling", null, null, page());
        assertThat(byAuthor.getContent())
                .singleElement()
                .extracting(Book::getAuthor)
                .isEqualTo("J.K. Rowling");
    }

    @Test
    void search_sortsByNumRatingsDescending() {
        Page<Book> result = bookRepository.search(null, null, null, page());
        assertThat(result.getContent())
                .extracting(Book::getTitle)
                .containsExactly(
                        "The Hunger Games",                          // 6,376,780
                        "Pride and Prejudice",                       // 2,998,241
                        "Harry Potter and the Order of the Phoenix");// 2,507,623
    }

    @Test
    void existsBySourceId_worksForSeededAndMissing() {
        assertThat(bookRepository.existsBySourceId("hunger")).isTrue();
        assertThat(bookRepository.existsBySourceId("does-not-exist")).isFalse();
    }
}
