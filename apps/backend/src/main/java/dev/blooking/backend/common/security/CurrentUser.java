package dev.blooking.backend.common.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Helper to read the authenticated user id from the security context.
 *
 * <p>Returns {@code null} for anonymous requests — used by public endpoints
 * (book view, search) that still want to attribute an interaction event to a
 * user when one happens to be logged in.
 */
public final class CurrentUser {

    private CurrentUser() {
    }

    /** The current user's id, or {@code null} if the request is anonymous. */
    public static Long idOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof Long userId)) {
            return null;
        }
        return userId;
    }
}
