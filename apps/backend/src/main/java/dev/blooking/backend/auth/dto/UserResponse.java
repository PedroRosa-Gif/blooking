package dev.blooking.backend.auth.dto;

import dev.blooking.backend.auth.User;

/** Safe representation of a user — never includes the password hash. */
public record UserResponse(
        Long id,
        String username,
        String displayName,
        String role
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getRole().name());
    }
}
