package dev.blooking.backend.recommendation;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import dev.blooking.backend.auth.jwt.JwtService;

/**
 * Web-layer tests for {@link RecommendationController}. Verifies the target user
 * id is taken from the authenticated principal (never a request param) and that
 * the {@code limit} parameter is clamped.
 *
 * <p>The security filter chain is <b>enabled</b> (we do NOT set
 * {@code addFilters = false}): the {@code authentication(...)} request
 * post-processor relies on the Spring Security filter chain to publish the
 * supplied {@link Authentication} into the {@code SecurityContextHolder}, from
 * which the controller's {@code Authentication} method argument is resolved.
 * With filters disabled, nothing would propagate the principal and the argument
 * would arrive {@code null}.
 */
@WebMvcTest(RecommendationController.class)
class RecommendationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RecommendationService recommendationService;

    // The project's SecurityConfig (loaded in the web slice) wires the
    // JwtAuthenticationFilter, which needs a JwtService. The filter never
    // authenticates here (no Bearer header), but the bean must be satisfiable
    // so the application context can start. Mock it.
    @MockitoBean
    private JwtService jwtService;

    /** An Authentication whose principal is the user id, matching the JWT filter. */
    private static Authentication asUser(long userId) {
        return new UsernamePasswordAuthenticationToken(
                userId, null, java.util.List.of());
    }

    @Test
    void usesDefaultLimit_andUserIdFromToken() throws Exception {
        when(recommendationService.recommendForUser(eq(7L), eq(12))).thenReturn(List.of());

        mockMvc.perform(get("/api/recommendations").with(authentication(asUser(7L))))
                .andExpect(status().isOk());

        verify(recommendationService).recommendForUser(eq(7L), eq(12));
    }

    @Test
    void clampsLimitToMax() throws Exception {
        when(recommendationService.recommendForUser(eq(7L), eq(50))).thenReturn(List.of());

        mockMvc.perform(get("/api/recommendations").param("limit", "999")
                        .with(authentication(asUser(7L))))
                .andExpect(status().isOk());

        verify(recommendationService).recommendForUser(eq(7L), eq(50));
    }

    @Test
    void nonPositiveLimit_fallsBackToDefault() throws Exception {
        when(recommendationService.recommendForUser(eq(7L), eq(12))).thenReturn(List.of());

        mockMvc.perform(get("/api/recommendations").param("limit", "0")
                        .with(authentication(asUser(7L))))
                .andExpect(status().isOk());

        verify(recommendationService).recommendForUser(eq(7L), eq(12));
    }

    @Test
    void byFavorites_usesUserIdFromToken() throws Exception {
        when(recommendationService.recommendByFavorites(eq(7L))).thenReturn(List.of());

        mockMvc.perform(get("/api/recommendations/by-favorites")
                        .with(authentication(asUser(7L))))
                .andExpect(status().isOk());

        verify(recommendationService).recommendByFavorites(eq(7L));
    }
}
