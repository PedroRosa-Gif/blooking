package dev.blooking.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
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
 * <p>The refresh token now travels in an {@code HttpOnly} cookie (not the JSON
 * body), and CSRF is enabled, so the test keeps a small cookie jar and echoes
 * the {@code XSRF-TOKEN} cookie back as the {@code X-XSRF-TOKEN} header on
 * mutating requests to the CSRF-protected endpoints ({@code refresh},
 * {@code logout}). {@code login}/{@code register} are CSRF-exempt.
 *
 * <p>Seeding is disabled so the app boots fast and does not need Ollama.
 * Requires Docker (skipped gracefully otherwise).
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "blooking.seed.enabled=false",
                "spring.rabbitmq.listener.simple.auto-startup=false",
                // This IT exercises the auth flow, not rate limiting; it fires
                // several register/login calls from one client, so disable the
                // limiter here to keep it testing what it means to.
                "blooking.auth.rate-limit.enabled=false"
        })
class AuthFlowIT extends PostgresTestContainer {

    private static final String REFRESH_COOKIE = "refresh_token";
    private static final String CSRF_COOKIE = "XSRF-TOKEN";

    @Autowired
    private TestRestTemplate rest;

    /** A tiny cookie jar: name -> value, updated from each response's Set-Cookie. */
    private final Map<String, String> cookies = new HashMap<>();

    @Test
    void fullAuthFlow() {
        // --- register ---
        ResponseEntity<Map> reg = post("/api/auth/register",
                Map.of("username", "alice", "password", "password123", "displayName", "Alice"));
        assertThat(reg.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String accessToken = (String) reg.getBody().get("accessToken");
        assertThat(accessToken).isNotBlank();
        // Refresh token is in the cookie, NOT the body.
        assertThat(reg.getBody()).doesNotContainKey("refreshToken");
        assertThat(cookies.get(REFRESH_COOKIE)).isNotBlank();
        String firstRefresh = cookies.get(REFRESH_COOKIE);

        // --- duplicate username -> 409 ---
        ResponseEntity<Map> dup = post("/api/auth/register",
                Map.of("username", "alice", "password", "password123"));
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
        ResponseEntity<Map> badLogin = post("/api/auth/login",
                Map.of("username", "alice", "password", "wrong"));
        assertThat(badLogin.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        // --- refresh (cookie + CSRF header) -> new refresh cookie (rotation) ---
        ResponseEntity<Map> refreshed = post("/api/auth/refresh", null);
        assertThat(refreshed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(refreshed.getBody().get("accessToken")).asString().isNotBlank();
        String rotatedRefresh = cookies.get(REFRESH_COOKIE);
        assertThat(rotatedRefresh).isNotBlank().isNotEqualTo(firstRefresh);

        // --- the OLD refresh token is now revoked (rotation) -> 401 ---
        cookies.put(REFRESH_COOKIE, firstRefresh); // present the stale token
        ResponseEntity<Map> reuseOld = post("/api/auth/refresh", null);
        assertThat(reuseOld.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        cookies.put(REFRESH_COOKIE, rotatedRefresh); // restore the live token

        // --- logout revokes the current refresh token ---
        ResponseEntity<Void> logout = exchange("/api/auth/logout", null, Void.class);
        assertThat(logout.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // --- refresh after logout -> 401 (token revoked) ---
        cookies.put(REFRESH_COOKIE, rotatedRefresh);
        ResponseEntity<Map> afterLogout = post("/api/auth/refresh", null);
        assertThat(afterLogout.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void publicEndpointsRemainAccessibleWithoutAuth() {
        // Book listing is public (seeding disabled -> empty page, but 200 not 401).
        assertThat(rest.getForEntity("/api/books", Map.class).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    // --- helpers ----------------------------------------------------------

    /** POST JSON, capturing Set-Cookie into the jar and sending CSRF + cookies. */
    private ResponseEntity<Map> post(String path, Map<String, Object> body) {
        return exchange(path, body, Map.class);
    }

    @SuppressWarnings("unchecked")
    private <T> ResponseEntity<T> exchange(String path, Map<String, Object> body, Class<T> type) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        sendCookies(headers);
        // Echo the CSRF token back on mutating requests (ignored where exempt).
        String csrf = cookies.get(CSRF_COOKIE);
        if (csrf != null) {
            headers.set("X-XSRF-TOKEN", csrf);
        }
        ResponseEntity<T> response = rest.exchange(
                path, HttpMethod.POST, new HttpEntity<>(body, headers), type);
        captureCookies(response.getHeaders());
        return response;
    }

    /** Adds the current cookie jar as a single Cookie header. */
    private void sendCookies(HttpHeaders headers) {
        if (cookies.isEmpty()) {
            return;
        }
        StringBuilder sb = new StringBuilder();
        cookies.forEach((k, v) -> sb.append(k).append('=').append(v).append("; "));
        headers.add(HttpHeaders.COOKIE, sb.toString());
    }

    /** Parses Set-Cookie headers (name=value; attrs...) into the jar. */
    private void captureCookies(HttpHeaders headers) {
        List<String> setCookies = headers.get(HttpHeaders.SET_COOKIE);
        if (setCookies == null) {
            return;
        }
        for (String sc : setCookies) {
            String nameValue = sc.split(";", 2)[0];
            int eq = nameValue.indexOf('=');
            if (eq <= 0) {
                continue;
            }
            String name = nameValue.substring(0, eq).trim();
            String value = nameValue.substring(eq + 1).trim();
            if (value.isEmpty()) {
                cookies.remove(name); // a cleared cookie (Max-Age=0, empty value)
            } else {
                cookies.put(name, value);
            }
        }
    }

    private static HttpHeaders bearer(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        return h;
    }
}
