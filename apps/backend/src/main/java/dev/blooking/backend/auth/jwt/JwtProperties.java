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

    /**
     * Insecure development fallback used only when no secret is configured.
     * MUST be overridden via {@code JWT_SECRET} in any real environment. At
     * least 32 bytes (256 bits), as required by HS256.
     */
    private static final String DEV_FALLBACK_SECRET =
            "dev-only-insecure-secret-change-me-min-32-bytes!!";

    public JwtProperties {
        // A blank secret can happen when JWT_SECRET is *defined but empty* in the
        // environment (e.g. an empty line in .env): the `${JWT_SECRET:default}`
        // placeholder only falls back to the default when the var is ABSENT, not
        // when it is empty. Treat blank as absent so the app still starts in dev
        // instead of failing with an NPE while building the signing key.
        if (secret == null || secret.isBlank()) {
            secret = DEV_FALLBACK_SECRET;
        }
    }
}
