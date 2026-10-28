package dev.blooking.backend.events;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * Persisted interaction record (migration V7). Append-only audit log and the
 * source data for recommendations.
 */
@Entity
@Table(name = "interactions")
public class Interaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, unique = true)
    private UUID eventId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "book_id")
    private Long bookId;

    private String detail;

    @Column(name = "occurred_at", nullable = false)
    private OffsetDateTime occurredAt;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private OffsetDateTime recordedAt;

    protected Interaction() {
        // Required by JPA.
    }

    public Interaction(UUID eventId, String eventType, Long userId, Long bookId,
                       String detail, OffsetDateTime occurredAt) {
        this.eventId = eventId;
        this.eventType = eventType;
        this.userId = userId;
        this.bookId = bookId;
        this.detail = detail;
        this.occurredAt = occurredAt;
    }

    @PrePersist
    void onCreate() {
        this.recordedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public UUID getEventId() {
        return eventId;
    }

    public String getEventType() {
        return eventType;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getBookId() {
        return bookId;
    }

    public String getDetail() {
        return detail;
    }

    public OffsetDateTime getOccurredAt() {
        return occurredAt;
    }
}
