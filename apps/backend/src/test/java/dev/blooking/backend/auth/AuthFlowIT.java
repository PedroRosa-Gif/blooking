package dev.blooking.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import dev.blooking.backend.support.PostgresTestContainer;

/**
 * End-to-end authentication flow against a real PostgreSQL container and the
 * full security stack: register → access protected endpoint → refresh → logout.
 *
 * <p>Seeding is disabled so the app boots fast and does not need Ollama.
 * Requires Docker (skipped gracefully otherwise).
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "blooking.seed.enabled=false")
class AuthFlowIT extends PostgresTestContainer {

    @Autowired
    private TestRestTemplate rest;

    @Test
    void fullAuthFlow() {
        // --- register ---
        ResponseEntity<Map> reg = rest.postForEntity("/api/auth/register",
                json(Map.of("username", "alice", "password", "password123", "displayName", "Alice")),
                Map.class);
        assertThat(reg.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String accessToken = (String) reg.getBody().get("accessToken");
        String refreshToken = (String) reg.getBody().get("refreshToken");
        assertThat(accessToken).isNotBlank();
        assertThat(refreshToken).isNotBlank();

        // --- duplicate username -> 409 ---
        ResponseEntity<Map> dup = rest.postForEntity("/api/auth/register",
                json(Map.of("username", "alice", "password", "password123")), Map.class);
        assertThat(dup.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        // --- /me without token -> 401 ---
        assertThat(rest.getForEntity("/api/auth/me", Map.class).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);

        // --- /me with token -> 200 ---
        ResponseEntity<Map> me = rest.exchange("/api/auth/me", HttpMethod.GET,
                new HttpEntity<>(bearer(accessToken)), Map.class);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(me.getBody().get("username")).isEqualTo("alice");
        assertThat(me.getBody()).doesNotContainKey("passwordHash");

        // --- login with wrong password -> 401 ---
        ResponseEntity<Map> badLogin = rest.postForEntity("/api/auth/login",
                json(Map.of("username", "alice", "password", "wrong")), Map.class);
        assertThat(badLogin.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        // --- refresh -> new tokens ---
        ResponseEntity<Map> refreshed = rest.postForEntity("/api/auth/refresh",
                json(Map.of("refreshToken", refreshToken)), Map.class);
        assertThat(refreshed.getStatusCode()).isEqualTo(HttpStatus.OK);
        String newRefresh = (String) refreshed.getBody().get("refreshToken");
        assertThat(newRefresh).isNotBlank().isNotEqualTo(refreshToken);

        // --- old refresh token is now revoked (rotation) -> 401 ---
        ResponseEntity<Map> reuseOld = rest.postForEntity("/api/auth/refresh",
                json(Map.of("refreshToken", refreshToken)), Map.class);
        assertThat(reuseOld.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        // --- logout revokes the current refresh token ---
        ResponseEntity<Void> logout = rest.postForEntity("/api/auth/logout",
                json(Map.of("refreshToken", newRefresh)), Void.class);
        assertThat(logout.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<Map> afterLogout = rest.postForEntity("/api/auth/refresh",
                json(Map.of("refreshToken", newRefresh)), Map.class);
        assertThat(afterLogout.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void publicEndpointsRemainAccessibleWithoutAuth() {
        // Book listing is public (seeding disabled -> empty page, but 200 not 401).
        assertThat(rest.getForEntity("/api/books", Map.class).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    private static HttpHeaders jsonHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        return h;
    }

    private static HttpEntity<Map<String, Object>> json(Map<String, Object> body) {
        return new HttpEntity<>(body, jsonHeaders());
    }

    private static HttpHeaders bearer(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        return h;
    }
}
