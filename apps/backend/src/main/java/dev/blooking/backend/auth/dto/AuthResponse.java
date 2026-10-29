package dev.blooking.backend.auth.dto;

/**
 * Returned on register / login / refresh.
 *
 * <p>Contains only the short-lived access token (a JWT). The long-lived refresh
 * token is <b>not</b> in the body — it is delivered as an {@code HttpOnly}
 * cookie so JavaScript (and therefore any XSS) can never read it.
 */
public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds
) {
    public static AuthResponse of(String accessToken, long expiresInSeconds) {
        return new AuthResponse(accessToken, "Bearer", expiresInSeconds);
    }
}
