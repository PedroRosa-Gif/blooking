package dev.blooking.backend.events;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import dev.blooking.backend.events.config.RabbitConfig;

/**
 * Consumes interaction events from the {@code book.events} queue and persists
 * them to the {@code interactions} table.
 *
 * <p><b>Idempotency:</b> RabbitMQ delivers at-least-once, so a message may be
 * redelivered (e.g. after a consumer crash before ack). We skip events whose
 * {@code eventId} is already recorded, so reprocessing is harmless.
 *
 * <p><b>Failure handling:</b> an unexpected exception propagates, the message is
 * nacked and — because the queue is configured with a dead-letter exchange —
 * ends up in the DLQ instead of being retried forever.
 */
@Component
public class InteractionConsumer {

    private static final Logger log = LoggerFactory.getLogger(InteractionConsumer.class);

    private final InteractionRepository interactionRepository;

    public InteractionConsumer(InteractionRepository interactionRepository) {
        this.interactionRepository = interactionRepository;
    }

    @RabbitListener(queues = RabbitConfig.QUEUE)
    @Transactional
    public void onEvent(InteractionEvent event) {
        if (event.eventId() != null && interactionRepository.existsByEventId(event.eventId())) {
            log.debug("Duplicate event {} ignored.", event.eventId());
            return;
        }

        Interaction interaction = new Interaction(
                event.eventId(),
                event.type().routingKey(),
                event.userId(),
                event.bookId(),
                event.detail(),
                event.occurredAt());
        interactionRepository.save(interaction);
        log.debug("Recorded interaction {} ({})", event.type().routingKey(), event.eventId());
    }
}
