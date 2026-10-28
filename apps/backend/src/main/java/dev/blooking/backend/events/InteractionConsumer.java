package dev.blooking.backend.events;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import dev.blooking.backend.events.config.RabbitConfig;
import dev.blooking.backend.recommendation.UserProfileService;

/**
 * Consumes interaction events from the {@code book.events} queue and persists
 * them to the {@code interactions} table. This is the <b>recommendation
 * worker</b>: beyond logging the interaction, it keeps each user's preference
 * embedding up to date.
 *
 * <p><b>Idempotency:</b> RabbitMQ delivers at-least-once, so a message may be
 * redelivered (e.g. after a consumer crash before ack). We skip events whose
 * {@code eventId} is already recorded, so reprocessing is harmless. The profile
 * recompute is itself idempotent (it fully recomputes from the live favorites),
 * so a redelivery would be harmless even if it reached that step.
 *
 * <p><b>Failure handling:</b> an unexpected exception propagates, the message is
 * nacked and — because the queue is configured with a dead-letter exchange —
 * ends up in the DLQ instead of being retried forever.
 */
@Component
public class InteractionConsumer {

    private static final Logger log = LoggerFactory.getLogger(InteractionConsumer.class);

    private final InteractionRepository interactionRepository;
    private final UserProfileService userProfileService;

    public InteractionConsumer(InteractionRepository interactionRepository,
                               UserProfileService userProfileService) {
        this.interactionRepository = interactionRepository;
        this.userProfileService = userProfileService;
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

        updatePreferenceProfile(event);
    }

    /**
     * Keeps the user's preference embedding in sync with their interactions.
     * Favorite/unfavorite (strong signal) and view (weaker signal) events by a
     * logged-in user change the preference profile; search events and anonymous
     * interactions (which carry no user) are ignored here.
     *
     * <p>The recompute reads the whole live state (favorites + view history), so
     * it is idempotent: this runs AFTER the current event was persisted to
     * {@code interactions}, so a just-recorded view is already reflected.
     */
    private void updatePreferenceProfile(InteractionEvent event) {
        if (event.userId() == null) {
            return;
        }
        if (event.type() == InteractionEventType.FAVORITED
                || event.type() == InteractionEventType.UNFAVORITED
                || event.type() == InteractionEventType.VIEWED) {
            userProfileService.refreshProfile(event.userId());
        }
    }
}
