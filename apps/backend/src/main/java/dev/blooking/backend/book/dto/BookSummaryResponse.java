package dev.blooking.backend.book.dto;

import java.math.BigDecimal;
import java.util.List;

import dev.blooking.backend.book.Book;

/**
 * Compact book representation for list/grid views (US02 / US03).
 * Omits heavy fields like description, characters and awards.
 */
public record BookSummaryResponse(
        Long id,
        String title,
        String author,
        String series,
        List<String> genres,
        BigDecimal rating,
        Long numRatings,
        Integer publishYear,
        String coverImg
) {
    public static BookSummaryResponse from(Book book) {
        return new BookSummaryResponse(
                book.getId(),
                book.getTitle(),
                book.getAuthor(),
                book.getSeries(),
                book.getGenres() == null ? List.of() : List.of(book.getGenres()),
                book.getRating(),
                book.getNumRatings(),
                book.getPublishYear(),
                book.getCoverImg()
        );
    }
}
