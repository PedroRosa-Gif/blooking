package dev.blooking.backend.recommendation;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Tunable weights for building a user's preference embedding, bound from
 * {@code blooking.recommendation.*} in configuration. Exposed as properties so
 * the signal weighting can be tuned without recompiling.
 *
 * <p>The profile is a weighted centroid of the books a user interacted with:
 * favorites are the strong signal; views are a weaker signal whose per-book
 * contribution grows with how many times the book was viewed, up to a cap (so
 * repeated views count as stronger interest without a burst of refreshes
 * drowning out the user's other interests).
 *
 * @param favoriteWeight per-book weight for a favorited book (strongest signal)
 * @param viewWeight     per-view weight for a viewed book (weaker signal)
 * @param viewCap        max views per book counted toward the weight
 */
@ConfigurationProperties(prefix = "blooking.recommendation")
public record RecommendationProperties(
        double favoriteWeight,
        double viewWeight,
        int viewCap
) {

    public RecommendationProperties {
        if (favoriteWeight <= 0) {
            favoriteWeight = 1.0;
        }
        if (viewWeight <= 0) {
            viewWeight = 0.25;
        }
        if (viewCap < 1) {
            viewCap = 3;
        }
    }
}
