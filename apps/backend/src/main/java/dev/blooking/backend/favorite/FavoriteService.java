package dev.blooking.backend.favorite;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.blooking.backend.book.Book;
import dev.blooking.backend.book.BookRepository;
import dev.blooking.backend.book.dto.BookSummaryResponse;
import dev.blooking.backend.common.exception.ResourceNotFoundException;
import dev.blooking.backend.events.EventPublisher;
import dev.blooking.backend.events.InteractionEvent;
import dev.blooking.backend.events.InteractionEventType;

/**
 * Favorite/unfavorite books and list a user's favorites (US09–US11).
 *
 * <p>Each favorite/unfavorite emits an interaction event to RabbitMQ (for the
 * recommendation pipeline). The event is published only after the state change
 * is committed in the database; a publish failure does not roll it back.
 */
@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final BookRepository bookRepository;
    private final EventPublisher eventPublisher;

    public FavoriteService(FavoriteRepository favoriteRepository,
                           BookRepository bookRepository,
                           EventPublisher eventPublisher) {
        this.favoriteRepository = favoriteRepository;
        this.bookRepository = bookRepository;
        this.eventPublisher = eventPublisher;
    }

    /** Favorites a book (idempotent: re-favoriting is a no-op). US09. */
    @Transactional
    public void favorite(Long userId, Long bookId) {
        if (!bookRepository.existsById(bookId)) {
            throw new ResourceNotFoundException("Book not found: " + bookId);
        }
        if (favoriteRepository.existsByUserIdAndBookId(userId, bookId)) {
            return; // already favorited — nothing to do, no duplicate event
        }
        favoriteRepository.save(new Favorite(userId, bookId));
        eventPublisher.publish(InteractionEvent.of(InteractionEventType.FAVORITED, userId, bookId));
    }

    /** Removes a favorite (idempotent: removing a non-favorite is a no-op). US10. */
    @Transactional
    public void unfavorite(Long userId, Long bookId) {
        favoriteRepository.findByUserIdAndBookId(userId, bookId).ifPresent(favorite -> {
            favoriteRepository.delete(favorite);
            eventPublisher.publish(InteractionEvent.of(InteractionEventType.UNFAVORITED, userId, bookId));
        });
    }

    /** Lists a user's favorite books as summaries. US11. */
    @Transactional(readOnly = true)
    public Page<BookSummaryResponse> listFavorites(Long userId, Pageable pageable) {
        Page<Favorite> favorites = favoriteRepository.findByUserId(userId, pageable);
        List<Long> bookIds = favorites.map(Favorite::getBookId).getContent();

        // Preserve the favorites page order when mapping to book summaries.
        List<Book> books = bookRepository.findAllById(bookIds);
        return favorites.map(fav -> books.stream()
                .filter(b -> b.getId().equals(fav.getBookId()))
                .findFirst()
                .map(BookSummaryResponse::from)
                .orElse(null));
    }
}
