package dev.blooking.backend.recommendation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Maintains each user's preference embedding — the heart of the recommendation
 * worker.
 *
 * <p>Whenever a user favorites or unfavorites a book, their profile embedding
 * is recomputed as the centroid of the embeddings of the books they currently
 * favorite (see {@link UserProfileRepository#recomputeProfile(long)}). Because
 * the recompute reads the <em>live</em> favorites table, a favorite adds that
 * book's vector to the mean and an unfavorite removes it — the profile always
 * reflects the current set of favorites, with no incremental drift.
 *
 * <p>This is invoked by the interaction consumer, i.e. asynchronously off the
 * RabbitMQ queue, so it never blocks the user's favorite/unfavorite request.
 */
@Service
public class UserProfileService {

    private static final Logger log = LoggerFactory.getLogger(UserProfileService.class);

    private final UserProfileRepository userProfileRepository;

    public UserProfileService(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    /**
     * Recomputes the preference embedding for the given user from their current
     * favorites. Safe to call repeatedly (it fully recomputes each time), which
     * keeps it idempotent under RabbitMQ's at-least-once redelivery.
     */
    public void refreshProfile(long userId) {
        userProfileRepository.recomputeProfile(userId);
        log.debug("Recomputed preference embedding for user {}", userId);
    }
}
