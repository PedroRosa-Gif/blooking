package dev.blooking.backend.auth.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

/**
 * Unit tests for {@link AuthRateLimitFilter}, exercised directly with mock
 * servlet objects (no Spring context needed).
 */
class AuthRateLimitFilterTest {

    private AuthRateLimitFilter filter;

    @BeforeEach
    void setUp() {
        // 3 attempts per (long) window so the test is deterministic and fast.
        filter = new AuthRateLimitFilter(
                new AuthRateLimitProperties(true, 3, Duration.ofMinutes(10)));
    }

    private MockHttpServletResponse invoke(String ip, String path) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setServletPath(path);
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    @Test
    void allowsUpToLimitThenReturns429() throws Exception {
        for (int i = 0; i < 3; i++) {
            assertThat(invoke("10.0.0.1", "/api/auth/login").getStatus())
                    .as("attempt %d within limit", i + 1)
                    .isEqualTo(HttpStatus.OK.value());
        }

        MockHttpServletResponse blocked = invoke("10.0.0.1", "/api/auth/login");
        assertThat(blocked.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
        assertThat(blocked.getHeader("Retry-After")).isNotNull();
        assertThat(blocked.getContentAsString()).contains("Too Many Requests");
    }

    @Test
    void countsPerIpIndependently() throws Exception {
        for (int i = 0; i < 3; i++) {
            invoke("10.0.0.1", "/api/auth/login");
        }
        // A different IP still has its full allowance.
        assertThat(invoke("10.0.0.2", "/api/auth/login").getStatus())
                .isEqualTo(HttpStatus.OK.value());
    }

    @Test
    void countsPerEndpointIndependently() throws Exception {
        for (int i = 0; i < 3; i++) {
            invoke("10.0.0.1", "/api/auth/login");
        }
        // Same IP, different auth endpoint -> separate counter.
        assertThat(invoke("10.0.0.1", "/api/auth/register").getStatus())
                .isEqualTo(HttpStatus.OK.value());
    }

    @Test
    void ignoresUnrelatedPaths() throws Exception {
        // Not a rate-limited endpoint: never blocked regardless of volume.
        for (int i = 0; i < 10; i++) {
            assertThat(invoke("10.0.0.1", "/api/books").getStatus())
                    .isEqualTo(HttpStatus.OK.value());
        }
    }

    @Test
    void disabledPassesEverythingThrough() throws Exception {
        AuthRateLimitFilter disabled = new AuthRateLimitFilter(
                new AuthRateLimitProperties(false, 3, Duration.ofMinutes(10)));
        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setServletPath("/api/auth/login");
            request.setRemoteAddr("10.0.0.1");
            MockHttpServletResponse response = new MockHttpServletResponse();
            disabled.doFilter(request, response, new MockFilterChain());
            assertThat(response.getStatus()).isEqualTo(HttpStatus.OK.value());
        }
    }
}
