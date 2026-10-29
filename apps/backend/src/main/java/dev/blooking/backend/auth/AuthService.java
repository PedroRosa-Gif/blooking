package dev.blooking.backend.auth;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.blooking.backend.auth.RefreshTokenService.IssuedToken;
import dev.blooking.backend.auth.dto.AuthResponse;
import dev.blooking.backend.auth.jwt.JwtProperties;
import dev.blooking.backend.auth.jwt.JwtService;
import dev.blooking.backend.common.exception.ConflictException;

/**
 * Registration, login, token refresh and logout.
 *
 * <p>Security notes:
 * <ul>
 *   <li>Passwords are hashed with BCrypt (via {@link PasswordEncoder}); the
 *       plaintext is never stored or logged.</li>
 *   <li>Login failures throw {@link BadCredentialsException} with a generic
 *       message to avoid leaking whether a username exists (user enumeration).</li>
 * </ul>
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final long accessExpirationSeconds;

    public AuthService(UserRepository userRepository,
                       RefreshTokenService refreshTokenService,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.refreshTokenService = refreshTokenService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.accessExpirationSeconds = jwtProperties.accessExpirationMs() / 1000;
    }

    /**
     * The outcome of an auth operation: the JSON {@link AuthResponse} body (which
     * carries only the access token) plus the raw refresh token, which the web
     * layer puts into an HttpOnly cookie rather than the body.
     */
    public record AuthResult(AuthResponse body, String rawRefreshToken) {
    }

    @Transactional
    public AuthResult register(String username, String password, String displayName) {
        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Username already taken");
        }
        User user = new User(username, passwordEncoder.encode(password), displayName, Role.USER);
        user = userRepository.save(user);
        return issueTokens(user);
    }

    @Transactional
    public AuthResult login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username or password");
        }
        return issueTokens(user);
    }

    @Transactional
    public AuthResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new BadCredentialsException("Missing refresh token");
        }
        RefreshToken current = refreshTokenService.findActive(rawRefreshToken)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired refresh token"));
        User user = userRepository.findById(current.getUserId())
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));
        IssuedToken rotated = refreshTokenService.rotate(current);
        String access = jwtService.generateAccessToken(user);
        return new AuthResult(
                AuthResponse.of(access, accessExpirationSeconds), rotated.rawToken());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            refreshTokenService.revoke(rawRefreshToken);
        }
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    private AuthResult issueTokens(User user) {
        String access = jwtService.generateAccessToken(user);
        IssuedToken refresh = refreshTokenService.issue(user.getId());
        return new AuthResult(
                AuthResponse.of(access, accessExpirationSeconds), refresh.rawToken());
    }

    /** Raised on invalid credentials or invalid/expired refresh token (→ 401). */
    public static class BadCredentialsException extends RuntimeException {
        public BadCredentialsException(String message) {
            super(message);
        }
    }
}
