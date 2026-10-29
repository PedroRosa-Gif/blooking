package dev.blooking.backend.auth;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.blooking.backend.auth.AuthService.AuthResult;
import dev.blooking.backend.auth.dto.AuthResponse;
import dev.blooking.backend.auth.dto.LoginRequest;
import dev.blooking.backend.auth.dto.RegisterRequest;
import dev.blooking.backend.auth.dto.UserResponse;
import dev.blooking.backend.common.exception.ResourceNotFoundException;
import jakarta.validation.Valid;

/**
 * Authentication endpoints (US06 register, US07 login, US08 logout) plus token
 * refresh and the current-user lookup.
 *
 * <p>The refresh token is never in the JSON body: register/login/refresh set it
 * as an {@code HttpOnly} cookie, and refresh/logout read it back from that
 * cookie ({@link CookieValue}). Only the short-lived access token travels in the
 * body, to be used as a {@code Bearer} header.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshCookieFactory refreshCookieFactory;

    public AuthController(AuthService authService, RefreshCookieFactory refreshCookieFactory) {
        this.authService = authService;
        this.refreshCookieFactory = refreshCookieFactory;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResult result = authService.register(
                request.username(), request.password(), request.displayName());
        return withRefreshCookie(HttpStatus.CREATED, result);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResult result = authService.login(request.username(), request.password());
        return withRefreshCookie(HttpStatus.OK, result);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE_PLACEHOLDER, required = false) String refreshToken) {
        AuthResult result = authService.refresh(refreshToken);
        return withRefreshCookie(HttpStatus.OK, result);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_COOKIE_PLACEHOLDER, required = false) String refreshToken) {
        authService.logout(refreshToken);
        // Clear the cookie regardless, so the browser drops it even if it was
        // already invalid.
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, refreshCookieFactory.clear().toString())
                .build();
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        User user = authService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserResponse.from(user);
    }

    /**
     * {@code @CookieValue} needs a compile-time constant name, but the cookie
     * name is configurable. We bind the property into this placeholder via a
     * SpEL default so the configured value wins while keeping the annotation
     * legal. See {@code blooking.auth.refresh-cookie.name}.
     */
    private static final String REFRESH_COOKIE_PLACEHOLDER =
            "${blooking.auth.refresh-cookie.name:refresh_token}";

    /** Attaches the rotated/issued refresh token as a Set-Cookie header. */
    private ResponseEntity<AuthResponse> withRefreshCookie(HttpStatus status, AuthResult result) {
        ResponseCookie cookie = refreshCookieFactory.create(result.rawRefreshToken());
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(result.body());
    }
}
