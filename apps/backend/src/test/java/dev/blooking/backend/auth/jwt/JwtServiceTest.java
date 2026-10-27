package dev.blooking.backend.auth.jwt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import dev.blooking.backend.auth.Role;
import dev.blooking.backend.auth.User;
import io.jsonwebtoken.JwtException;

class JwtServiceTest {

    private static final String SECRET = "test-secret-that-is-at-least-32-bytes-long!!";

    private JwtService service(long accessMs) {
        return new JwtService(new JwtProperties(SECRET, accessMs, 604800000L, "blooking"));
    }

    private User user() {
        // id stays null (normally DB-generated); the claims under test here do
        // not depend on it.
        return new User("alice", "hash", "Alice", Role.USER);
    }

    @Test
    void generatedToken_containsExpectedClaims_andValidates() {
        JwtService jwt = service(900000L);
        String token = jwt.generateAccessToken(user());

        var claims = jwt.parse(token);
        assertThat(claims.get("username", String.class)).isEqualTo("alice");
        assertThat(claims.get("role", String.class)).isEqualTo("USER");
        assertThat(claims.getIssuer()).isEqualTo("blooking");
        assertThat(claims.getExpiration()).isAfter(claims.getIssuedAt());
    }

    @Test
    void tamperedToken_isRejected() {
        JwtService jwt = service(900000L);
        String token = jwt.generateAccessToken(user());
        String tampered = token.substring(0, token.length() - 2) + "xx";

        assertThatThrownBy(() -> jwt.parse(tampered)).isInstanceOf(JwtException.class);
    }

    @Test
    void expiredToken_isRejected() throws InterruptedException {
        JwtService jwt = service(1L); // expires almost immediately
        String token = jwt.generateAccessToken(user());
        Thread.sleep(50);

        assertThatThrownBy(() -> jwt.parse(token)).isInstanceOf(JwtException.class);
    }

    @Test
    void tokenSignedWithDifferentSecret_isRejected() {
        JwtService signer = service(900000L);
        JwtService other = new JwtService(
                new JwtProperties("a-completely-different-secret-32bytes-xx", 900000L, 1L, "blooking"));
        String token = signer.generateAccessToken(user());

        assertThatThrownBy(() -> other.parse(token)).isInstanceOf(JwtException.class);
    }
}
