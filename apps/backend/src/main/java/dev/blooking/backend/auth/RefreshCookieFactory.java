package dev.blooking.backend.auth;

import java.time.Duration;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import dev.blooking.backend.auth.config.RefreshCookieProperties;
import dev.blooking.backend.auth.jwt.JwtProperties;

/**
 * Builds the {@code Set-Cookie} values that carry the refresh token.
 *
 * <p>The cookie is always {@code HttpOnly} (never readable by JavaScript) and is
 * scoped to the auth path; {@code Secure} and {@code SameSite} come from
 * configuration so dev (HTTP, Lax) and production (HTTPS, possibly None) can
 * differ. The cookie's {@code Max-Age} matches the refresh-token lifetime.
 */
@Component
public class RefreshCookieFactory {

    private final RefreshCookieProperties properties;
    private final Duration refreshTtl;

    public RefreshCookieFactory(RefreshCookieProperties properties, JwtProperties jwtProperties) {
        this.properties = properties;
        this.refreshTtl = Duration.ofMillis(jwtProperties.refreshExpirationMs());
    }

    /** The configured cookie name (used by the controller to read it back). */
    public String cookieName() {
        return properties.name();
    }

    /** A {@code Set-Cookie} that stores the refresh token for its full lifetime. */
    public ResponseCookie create(String rawToken) {
        return base(rawToken).maxAge(refreshTtl).build();
    }

    /**
     * A {@code Set-Cookie} that clears the refresh cookie (empty value, zero
     * max-age). Must carry the same name/path/attributes so the browser matches
     * and removes it.
     */
    public ResponseCookie clear() {
        return base("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(properties.name(), value)
                .httpOnly(true)
                .secure(properties.secure())
                .path(properties.path())
                .sameSite(properties.sameSite());
    }
}
