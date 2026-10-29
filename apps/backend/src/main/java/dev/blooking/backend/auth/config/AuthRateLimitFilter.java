package dev.blooking.backend.auth.config;

import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * A lightweight in-memory, fixed-window rate limiter for the public auth
 * endpoints ({@code POST /api/auth/login} and {@code /api/auth/register}),
 * guarding against brute-force and credential-stuffing.
 *
 * <p>Each client IP gets an independent counter per endpoint. When more than
 * {@code maxAttempts} requests arrive within a {@code window}, further requests
 * in that window get {@code 429 Too Many Requests} (with a {@code Retry-After}
 * header) <b>before</b> they reach the authentication logic.
 *
 * <p>Deliberately dependency-free (no Bucket4j/Redis): a single-node in-memory
 * limiter is enough for this app and keeps the offline build simple. The two
 * trade-offs this implies:
 * <ul>
 *   <li><b>Per-node</b> — counts are not shared across instances. Fine for a
 *       single backend; a distributed deployment would want a shared store.</li>
 *   <li><b>Fixed window</b> — simpler than a sliding window; a burst straddling
 *       a window boundary can briefly allow up to 2× the limit. Acceptable for
 *       coarse brute-force protection.</li>
 * </ul>
 * Stale counters are pruned opportunistically so memory stays bounded.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AuthRateLimitFilter.class);

    private static final String LOGIN_PATH = "/api/auth/login";
    private static final String REGISTER_PATH = "/api/auth/register";

    /** Prune the counter map once it exceeds this many entries. */
    private static final int PRUNE_THRESHOLD = 10_000;

    private final AuthRateLimitProperties properties;
    private final ConcurrentHashMap<String, Window> counters = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(AuthRateLimitProperties properties) {
        this.properties = properties;
    }

    /** A fixed window: the epoch-milli start of the window and the hit count. */
    private static final class Window {
        final long startMillis;
        final AtomicInteger count;

        Window(long startMillis) {
            this.startMillis = startMillis;
            this.count = new AtomicInteger(0);
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!properties.enabled()) {
            return true;
        }
        // Only rate-limit the two state-changing public auth endpoints.
        if (!HttpMethod.POST.matches(request.getMethod())) {
            return true;
        }
        String path = request.getServletPath();
        return !(LOGIN_PATH.equals(path) || REGISTER_PATH.equals(path));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String key = clientIp(request) + ":" + request.getServletPath();
        long nowMillis = System.currentTimeMillis();
        long windowMillis = properties.window().toMillis();

        // Atomically fetch-or-reset the window for this key, then increment.
        Window window = counters.compute(key, (k, existing) -> {
            if (existing == null || nowMillis - existing.startMillis >= windowMillis) {
                return new Window(nowMillis);
            }
            return existing;
        });
        int hits = window.count.incrementAndGet();

        if (counters.size() > PRUNE_THRESHOLD) {
            pruneStale(nowMillis, windowMillis);
        }

        if (hits > properties.maxAttempts()) {
            long retryAfterSec = Math.max(1,
                    (windowMillis - (nowMillis - window.startMillis) + 999) / 1000);
            log.warn("Rate limit exceeded for {} on {}", clientIp(request), request.getServletPath());
            writeTooManyRequests(response, retryAfterSec);
            return;
        }

        filterChain.doFilter(request, response);
    }

    /** Removes windows that have fully elapsed, to keep the map bounded. */
    private void pruneStale(long nowMillis, long windowMillis) {
        counters.values().removeIf(w -> nowMillis - w.startMillis >= windowMillis);
    }

    /**
     * Resolves the client IP, honouring the first hop of {@code X-Forwarded-For}
     * when present (the app may sit behind a reverse proxy), else the socket
     * address.
     */
    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            int comma = forwarded.indexOf(',');
            return (comma > 0 ? forwarded.substring(0, comma) : forwarded).trim();
        }
        return request.getRemoteAddr();
    }

    /** Writes a 429 response whose JSON body matches GlobalExceptionHandler's shape. */
    private static void writeTooManyRequests(HttpServletResponse response, long retryAfterSec)
            throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader(HttpHeaders.RETRY_AFTER, Long.toString(retryAfterSec));
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        String body = """
                {"timestamp":"%s","status":429,"error":"Too Many Requests",\
                "message":"Too many attempts. Please try again later."}""".formatted(
                Instant.now().toString());
        response.getWriter().write(body);
    }
}
