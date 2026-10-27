package dev.blooking.backend.favorite;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * A user's favorite book (migration V6). Unique per (user, book).
 */
@Entity
@Table(name = "favorites",
        uniqueConstraints = @UniqueConstraint(name = "uq_favorites_user_book",
                columnNames = {"user_id", "book_id"}))
public class Favorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "book_id", nullable = false)
    private Long bookId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected Favorite() {
        // Required by JPA.
    }

    public Favorite(Long userId, Long bookId) {
        this.userId = userId;
        this.bookId = bookId;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getBookId() {
        return bookId;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
