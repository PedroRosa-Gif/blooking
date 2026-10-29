package dev.blooking.backend.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for the refresh-token cookie, bound from
 * {@code blooking.auth.refresh-cookie.*}.
 *
 * <p>The refresh token is delivered as an {@code HttpOnly} cookie (invisible to
 * JavaScript, so it survives an XSS far better than {@code localStorage}),
 * scoped to the auth endpoints via {@code path}.
 *
 * <p><b>Environment notes:</b>
 * <ul>
 *   <li>{@code secure} must be {@code true} in production (cookie only sent over
 *       HTTPS) but {@code false} for local dev over plain HTTP, otherwise the
 *       browser silently drops the cookie.</li>
 *   <li>{@code sameSite} defaults to {@code Lax} (works when the SPA and API are
 *       same-site). A cross-site production deployment (different registrable
 *       domains) needs {@code None}, which the browser only honours together
 *       with {@code secure=true}.</li>
 * </ul>
 *
 * @param name     cookie name
 * @param path     cookie path (scopes it to the auth endpoints)
 * @param secure   whether to mark the cookie {@code Secure} (HTTPS only)
 * @param sameSite SameSite attribute: {@code Lax}, {@code Strict} or {@code None}
 */
@ConfigurationProperties(prefix = "blooking.auth.refresh-cookie")
public record RefreshCookieProperties(
        String name,
        String path,
        boolean secure,
        String sameSite
) {

    public RefreshCookieProperties {
        if (name == null || name.isBlank()) {
            name = "refresh_token";
        }
        if (path == null || path.isBlank()) {
            path = "/api/auth";
        }
        if (sameSite == null || sameSite.isBlank()) {
            sameSite = "Lax";
        }
    }
}
