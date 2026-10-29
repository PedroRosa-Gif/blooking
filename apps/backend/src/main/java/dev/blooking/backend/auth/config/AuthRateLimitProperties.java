package dev.blooking.backend.auth.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Tunable limits for the authentication rate limiter, bound from
 * {@code blooking.auth.rate-limit.*}. Protects {@code /api/auth/login} and
 * {@code /api/auth/register} from brute-force / credential-stuffing by capping
 * requests per client IP in a fixed time window.
 *
 * @param enabled    master switch (disable in tests that hammer the endpoints)
 * @param maxAttempts allowed requests per window per IP (per endpoint)
 * @param window     the fixed window length
 */
@ConfigurationProperties(prefix = "blooking.auth.rate-limit")
public record AuthRateLimitProperties(
        boolean enabled,
        int maxAttempts,
        Duration window
) {

    public AuthRateLimitProperties {
        if (maxAttempts < 1) {
            maxAttempts = 5;
        }
        if (window == null || window.isZero() || window.isNegative()) {
            window = Duration.ofMinutes(1);
        }
    }
}
