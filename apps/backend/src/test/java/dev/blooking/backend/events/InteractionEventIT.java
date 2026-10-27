package dev.blooking.backend.events;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import java.time.Duration;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import dev.blooking.backend.support.RabbitTestContainer;

/**
 * End-to-end event pipeline test against real PostgreSQL + RabbitMQ containers:
 * publish an event, let the consumer process it, and assert it was persisted to
 * the {@code interactions} table — including idempotency on redelivery.
 *
 * <p>Seeding disabled (no Ollama needed). Requires Docker (skipped otherwise).
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = "blooking.seed.enabled=false")
class InteractionEventIT extends RabbitTestContainer {

    @Autowired
    private EventPublisher eventPublisher;

    @Autowired
    private InteractionRepository interactionRepository;

    @Test
    void publishedEvent_isConsumedAndPersisted() {
        InteractionEvent event = InteractionEvent.of(
                InteractionEventType.SEARCHED, null, null, "young wizard");

        eventPublisher.publish(event);

        await().atMost(Duration.ofSeconds(10))
                .untilAsserted(() -> assertThat(interactionRepository.existsByEventId(event.eventId())).isTrue());

        Interaction saved = interactionRepository.findAll().stream()
                .filter(i -> i.getEventId().equals(event.eventId()))
                .findFirst()
                .orElseThrow();
        assertThat(saved.getEventType()).isEqualTo("book.searched");
        assertThat(saved.getDetail()).isEqualTo("young wizard");
    }

    @Test
    void redeliveredEvent_isRecordedOnlyOnce() {
        UUID id = UUID.randomUUID();
        InteractionEvent event = new InteractionEvent(
                id, InteractionEventType.FAVORITED, null, null, null,
                java.time.OffsetDateTime.now());

        // Publish the same event twice (simulating at-least-once redelivery).
        eventPublisher.publish(event);
        eventPublisher.publish(event);

        await().atMost(Duration.ofSeconds(10))
                .untilAsserted(() -> assertThat(interactionRepository.existsByEventId(id)).isTrue());

        long count = interactionRepository.findAll().stream()
                .filter(i -> i.getEventId().equals(id))
                .count();
        assertThat(count).isEqualTo(1);
    }
}
