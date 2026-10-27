package dev.blooking.backend.recommendation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Maintains each user's preference embedding — the heart of the recommendation
 * worker.
 *
 * <p>Whenever a user favorites/unfavorites or views a book, their profile
 * embedding is recomputed as a <em>weighted centroid</em> of the books they
 * have interacted with (see
 * {@link UserProfileRepository#recomputeProfile(long, double, double, int)}):
 * favorites are the strong signal, views a weaker one (scaled by a capped view
 * count). Because the recompute reads the <em>live</em> favorites and the
 * interaction log each time, a favorite/view adds to the mean and an unfavorite
 * removes it — the profile always reflects the current state, with no
 * incremental drift.
 *
 * <p>This is invoked by the interaction consumer, i.e. asynchronously off the
 * RabbitMQ queue, so it never blocks the user's request.
 */
@Service
public class UserProfileService {

    private static final Logger log = LoggerFactory.getLogger(UserProfileService.class);

    private final UserProfileRepository userProfileRepository;
    private final RecommendationProperties properties;

    public UserProfileService(UserProfileRepository userProfileRepository,
                              RecommendationProperties properties) {
        this.userProfileRepository = userProfileRepository;
        this.properties = properties;
    }

    /**
     * Recomputes the preference embedding for the given user from their current
     * favorites and view history, applying the configured signal weights. Safe
     * to call repeatedly (it fully recomputes each time), which keeps it
     * idempotent under RabbitMQ's at-least-once redelivery.
     */
    public void refreshProfile(long userId) {
        userProfileRepository.recomputeProfile(
                userId,
                properties.favoriteWeight(),
                properties.viewWeight(),
                properties.viewCap());
        log.debug("Recomputed preference embedding for user {}", userId);
    }
}
