package dev.blooking.backend.auth.config;

import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import dev.blooking.backend.auth.jwt.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;

/**
 * Stateless JWT security configuration.
 *
 * <ul>
 *   <li>Public: book discovery ({@code /api/books/**}, {@code /api/search}),
 *       auth entry points, and health.</li>
 *   <li>Everything else requires a valid access token.</li>
 *   <li>No server-side session; CSRF disabled because the API is token-based
 *       (not cookie-based) — this is safe for a Bearer-token API and will be
 *       revisited if/when refresh tokens move to an HttpOnly cookie.</li>
 * </ul>
 *
 * <p>{@code @ConditionalOnWebApplication}: the {@code SecurityFilterChain}
 * depends on {@code HttpSecurity}, which only exists in a servlet web context.
 * Non-web integration tests ({@code @SpringBootTest(webEnvironment = NONE)},
 * e.g. the seeder and event pipeline tests) therefore skip this configuration
 * instead of failing to build the filter chain.
 */
@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthRateLimitFilter authRateLimitFilter;

    @Value("${blooking.cors.allowed-origins:http://localhost:5173}")
    private List<String> allowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          AuthRateLimitFilter authRateLimitFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authRateLimitFilter = authRateLimitFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        CsrfTokenRequestAttributeHandler csrfRequestHandler = new CsrfTokenRequestAttributeHandler();
        // Opt out of Spring Security 6's deferred CSRF token loading so the
        // XSRF-TOKEN cookie is written eagerly and the plain token value (not a
        // BREACH-masked one) is compared against the X-XSRF-TOKEN header — the
        // setup a cookie-based SPA expects.
        csrfRequestHandler.setCsrfRequestAttributeName(null);

        http
                // CSRF protection for a cookie-based SPA: the token lives in a
                // JS-readable XSRF-TOKEN cookie (no server session needed, so this
                // stays stateless) and must be echoed in the X-XSRF-TOKEN header on
                // mutating requests. Login/register are exempt: they run before any
                // session cookie exists and don't rely on an ambient cookie, so CSRF
                // adds nothing there. GET/HEAD/OPTIONS are never checked.
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(csrfRequestHandler)
                        .ignoringRequestMatchers("/api/auth/login", "/api/auth/register"))
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public auth endpoints. Logout and refresh are public
                        // because they authenticate via the refresh-token cookie,
                        // not the access token, so they must work even after the
                        // short-lived access token has expired. (They are still
                        // CSRF-protected — only login/register are exempt above.)
                        .requestMatchers("/api/auth/register", "/api/auth/login",
                                "/api/auth/refresh", "/api/auth/logout").permitAll()
                        // Public discovery (US01–US04)
                        .requestMatchers(HttpMethod.GET, "/api/books/**", "/api/search").permitAll()
                        // Health
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        // Everything else requires authentication
                        .anyRequest().authenticated())
                // Return 401 (not a redirect) for unauthenticated access to protected endpoints.
                .exceptionHandling(ex -> ex.authenticationEntryPoint(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                // Rate-limit the public auth endpoints before the JWT filter, so a
                // flood is rejected with 429 before touching authentication logic.
                .addFilterBefore(authRateLimitFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Prevents Spring Boot from auto-registering {@link AuthRateLimitFilter} as a
     * plain servlet filter in addition to its place in the security chain. Unlike
     * the JWT filter (idempotent), the rate limiter counts hits, so running twice
     * per request would halve the effective limit. The filter runs only via the
     * {@code addFilterBefore(...)} registration above.
     */
    @Bean
    public FilterRegistrationBean<AuthRateLimitFilter> disableAuthRateLimitAutoRegistration(
            AuthRateLimitFilter filter) {
        FilterRegistrationBean<AuthRateLimitFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // X-XSRF-TOKEN carries the CSRF token the SPA reads from the XSRF-TOKEN
        // cookie and echoes back on mutating requests.
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-XSRF-TOKEN"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
