package dev.blooking.backend.recommendation;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Web-layer tests for {@link RecommendationController}. Security filters are
 * disabled; the authenticated principal (user id) is injected directly, as in
 * {@code FavoriteControllerTest}. Verifies the user id is taken from the token
 * and that the {@code limit} parameter is clamped.
 */
@WebMvcTest(RecommendationController.class)
@AutoConfigureMockMvc(addFilters = false)
class RecommendationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RecommendationService recommendationService;

    private void authenticateAs(long userId) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null, java.util.List.of()));
    }

    @Test
    @WithMockUser
    void usesDefaultLimit_andUserIdFromToken() throws Exception {
        authenticateAs(7L);
        when(recommendationService.recommendForUser(eq(7L), eq(12))).thenReturn(List.of());

        mockMvc.perform(get("/api/recommendations"))
                .andExpect(status().isOk());

        verify(recommendationService).recommendForUser(eq(7L), eq(12));
    }

    @Test
    @WithMockUser
    void clampsLimitToMax() throws Exception {
        authenticateAs(7L);
        when(recommendationService.recommendForUser(eq(7L), eq(50))).thenReturn(List.of());

        mockMvc.perform(get("/api/recommendations").param("limit", "999"))
                .andExpect(status().isOk());

        verify(recommendationService).recommendForUser(eq(7L), eq(50));
    }

    @Test
    @WithMockUser
    void nonPositiveLimit_fallsBackToDefault() throws Exception {
        authenticateAs(7L);
        when(recommendationService.recommendForUser(eq(7L), eq(12))).thenReturn(List.of());

        mockMvc.perform(get("/api/recommendations").param("limit", "0"))
                .andExpect(status().isOk());

        verify(recommendationService).recommendForUser(eq(7L), eq(12));
    }
}
