package dev.blooking.backend.auth.jwt;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * JWT configuration, bound from {@code blooking.jwt.*}.
 *
 * @param secret               HMAC signing secret (Base64 or plain). MUST be
 *                             provided via env var in any real environment and
 *                             be at least 256 bits for HS256.
 * @param accessExpirationMs   access-token lifetime in milliseconds (short).
 * @param refreshExpirationMs  refresh-token lifetime in milliseconds (long).
 * @param issuer               token issuer claim.
 */
@ConfigurationProperties(prefix = "blooking.jwt")
public record JwtProperties(
        String secret,
        long accessExpirationMs,
        long refreshExpirationMs,
        String issuer
) {
}
