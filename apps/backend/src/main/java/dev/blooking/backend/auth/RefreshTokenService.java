package dev.blooking.backend.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.blooking.backend.auth.jwt.JwtProperties;

/**
 * Issues, validates, rotates and revokes opaque refresh tokens.
 *
 * <p>The raw token (a 256-bit random string) is returned to the caller once;
 * only its SHA-256 hash is persisted. Lookups hash the presented token and
 * compare, so a database leak never yields a usable token.
 */
@Service
public class RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final long refreshExpirationMs;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository repository, JwtProperties jwtProperties) {
        this.repository = repository;
        this.refreshExpirationMs = jwtProperties.refreshExpirationMs();
    }

    /** Result of issuing a refresh token: the raw value (returned to client once). */
    public record IssuedToken(String rawToken, OffsetDateTime expiresAt) {
    }

    /** Creates and stores a new refresh token for the given user. */
    @Transactional
    public IssuedToken issue(Long userId) {
        String raw = generateRawToken();
        OffsetDateTime expiresAt = OffsetDateTime.now().plus(Duration.ofMillis(refreshExpirationMs));
        repository.save(new RefreshToken(userId, sha256(raw), expiresAt));
        return new IssuedToken(raw, expiresAt);
    }

    /**
     * Validates a presented raw refresh token. Returns the active record, or
     * empty if unknown, expired or revoked.
     */
    @Transactional(readOnly = true)
    public Optional<RefreshToken> findActive(String rawToken) {
        return repository.findByTokenHash(sha256(rawToken))
                .filter(RefreshToken::isActive);
    }

    /** Rotation: revoke the presented token and issue a fresh one for the user. */
    @Transactional
    public IssuedToken rotate(RefreshToken current) {
        current.setRevoked(true);
        repository.save(current);
        return issue(current.getUserId());
    }

    /** Revokes a single token by its raw value (idempotent). Used on logout. */
    @Transactional
    public void revoke(String rawToken) {
        repository.findByTokenHash(sha256(rawToken)).ifPresent(token -> {
            token.setRevoked(true);
            repository.save(token);
        });
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32]; // 256 bits
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
