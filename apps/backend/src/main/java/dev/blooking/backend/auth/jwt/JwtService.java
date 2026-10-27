package dev.blooking.backend.auth.jwt;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import dev.blooking.backend.auth.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Creates and validates stateless access tokens (JWT, HS256).
 *
 * <p>Only the <em>access</em> token is a JWT. Refresh tokens are opaque random
 * strings tracked in the database (see {@code RefreshTokenService}), so they can
 * be revoked — something a stateless JWT cannot be.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long accessExpirationMs;
    private final String issuer;

    public JwtService(JwtProperties properties) {
        this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
        this.accessExpirationMs = properties.accessExpirationMs();
        this.issuer = properties.issuer();
    }

    /** Issues a signed access token carrying the user id (subject) and role. */
    public String generateAccessToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessExpirationMs);
        return Jwts.builder()
                .issuer(issuer)
                .subject(String.valueOf(user.getId()))
                .claim("username", user.getUsername())
                .claim("role", user.getRole().name())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    /**
     * Parses and validates a token; returns its claims.
     *
     * @throws JwtException if the token is malformed, tampered, or expired.
     */
    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long extractUserId(String token) {
        return Long.valueOf(parse(token).getSubject());
    }
}
