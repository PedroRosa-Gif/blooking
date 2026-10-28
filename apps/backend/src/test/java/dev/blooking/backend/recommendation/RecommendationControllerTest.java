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
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
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
 * <p>Security filters are disabled ({@code addFilters = false}); the
 * authenticated principal is attached to each request with the
 * {@code authentication(...)} request post-processor. (Setting the
 * {@code SecurityContextHolder} directly does not work here, because without the
 * security filter chain nothing propagates that context onto the request
 * thread.)
 */
@WebMvcTest(RecommendationController.class)
@AutoConfigureMockMvc(addFilters = false)
class RecommendationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RecommendationService recommendationService;

    // The project's SecurityConfig (loaded in the web slice) wires the
    // JwtAuthenticationFilter, which needs a JwtService. Security filters are
    // disabled for these tests, but the bean must still be satisfiable so the
    // application context can start. Mock it.
    @MockitoBean
    private JwtService jwtService;

    /** An Authentication whose principal is the user id, matching the JWT filter. */
    private static Authentication asUser(long userId) {
        return new UsernamePasswordAuthenticationToken(userId, null, java.util.List.of());
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
}
