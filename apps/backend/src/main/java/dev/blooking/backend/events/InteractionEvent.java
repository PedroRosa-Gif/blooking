package dev.blooking.backend.events;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Immutable event envelope published to RabbitMQ when a user interacts with the
 * catalog. Serialized to JSON.
 *
 * @param eventId    unique id — used by the consumer for idempotency/dedup.
 * @param type       the interaction type (also the routing key).
 * @param userId     the acting user, or {@code null} for anonymous interactions.
 * @param bookId     the related book, or {@code null} (e.g. for a search).
 * @param detail     optional extra info (e.g. the search query text).
 * @param occurredAt when the interaction happened.
 */
public record InteractionEvent(
        UUID eventId,
        InteractionEventType type,
        Long userId,
        Long bookId,
        String detail,
        OffsetDateTime occurredAt
) {

    public static InteractionEvent of(InteractionEventType type, Long userId, Long bookId, String detail) {
        return new InteractionEvent(UUID.randomUUID(), type, userId, bookId, detail, OffsetDateTime.now());
    }

    public static InteractionEvent of(InteractionEventType type, Long userId, Long bookId) {
        return of(type, userId, bookId, null);
    }
}
