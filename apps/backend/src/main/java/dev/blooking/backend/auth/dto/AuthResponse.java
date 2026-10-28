package dev.blooking.backend.auth.dto;

/**
 * Returned on register / login / refresh.
 *
 * <p>The access token is a short-lived JWT; the refresh token is a long-lived
 * opaque string. (When the frontend exists, the refresh token will move to an
 * HttpOnly cookie instead of the response body — see docs.)
 */
public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds
) {
    public static AuthResponse of(String accessToken, String refreshToken, long expiresInSeconds) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", expiresInSeconds);
    }
}
