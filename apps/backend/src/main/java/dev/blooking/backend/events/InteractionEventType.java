package dev.blooking.backend.events;

/**
 * Types of user interaction events. The {@link #routingKey()} is used both as
 * the AMQP routing key and as the {@code event_type} stored in the database.
 */
public enum InteractionEventType {

    VIEWED("book.viewed"),
    SEARCHED("book.searched"),
    FAVORITED("book.favorited"),
    UNFAVORITED("book.unfavorited");

    private final String routingKey;

    InteractionEventType(String routingKey) {
        this.routingKey = routingKey;
    }

    public String routingKey() {
        return routingKey;
    }
}
