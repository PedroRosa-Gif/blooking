package dev.blooking.backend.book.dto;

import java.math.BigDecimal;
import java.util.List;

import dev.blooking.backend.book.Book;

/**
 * Full book representation for the detail page (US04).
 * Note: the internal {@code embedding} vector is never exposed.
 */
public record BookDetailResponse(
        Long id,
        String title,
        String series,
        String author,
        String description,
        String language,
        String isbn,
        List<String> genres,
        List<String> characters,
        List<String> awards,
        String bookFormat,
        Integer pages,
        String publisher,
        Integer publishYear,
        BigDecimal rating,
        Long numRatings,
        Integer likedPercent,
        String coverImg,
        BigDecimal price
) {
    private static List<String> toList(String[] arr) {
        return arr == null ? List.of() : List.of(arr);
    }

    public static BookDetailResponse from(Book book) {
        return new BookDetailResponse(
                book.getId(),
                book.getTitle(),
                book.getSeries(),
                book.getAuthor(),
                book.getDescription(),
                book.getLanguage(),
                book.getIsbn(),
                toList(book.getGenres()),
                toList(book.getCharacters()),
                toList(book.getAwards()),
                book.getBookFormat(),
                book.getPages(),
                book.getPublisher(),
                book.getPublishYear(),
                book.getRating(),
                book.getNumRatings(),
                book.getLikedPercent(),
                book.getCoverImg(),
                book.getPrice()
        );
    }
}
