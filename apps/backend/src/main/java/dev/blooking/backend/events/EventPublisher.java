package dev.blooking.backend.events;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import dev.blooking.backend.events.config.RabbitConfig;

/**
 * Publishes {@link InteractionEvent}s to the topic exchange, using the event
 * type as the routing key.
 *
 * <p><b>Resilience:</b> publishing is best-effort — if the broker is
 * unavailable, we log and swallow the error so the user-facing action (e.g.
 * favoriting a book) still succeeds. A stronger guarantee (transactional outbox)
 * is noted as a future improvement.
 */
@Component
public class EventPublisher {

    private static final Logger log = LoggerFactory.getLogger(EventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public EventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publish(InteractionEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitConfig.EXCHANGE,
                    event.type().routingKey(),
                    event);
            log.debug("Published event {} ({})", event.type().routingKey(), event.eventId());
        } catch (AmqpException e) {
            log.warn("Failed to publish event {} ({}): {}",
                    event.type().routingKey(), event.eventId(), e.getMessage());
        }
    }
}
