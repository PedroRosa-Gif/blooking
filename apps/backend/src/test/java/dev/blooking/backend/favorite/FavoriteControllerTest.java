package dev.blooking.backend.favorite;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Web-layer tests for {@link FavoriteController}. Security filters are disabled;
 * the authenticated principal (user id) is injected directly into the context.
 */
@WebMvcTest(FavoriteController.class)
@AutoConfigureMockMvc(addFilters = false)
class FavoriteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FavoriteService favoriteService;

    // SecurityConfig is loaded in the web slice and wires JwtAuthenticationFilter,
    // which needs a JwtService; the filter never runs here (addFilters = false),
    // but the bean must be satisfiable for the context to start.
    @MockitoBean
    private dev.blooking.backend.auth.jwt.JwtService jwtService;

    private void authenticateAs(long userId) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null, java.util.List.of()));
    }

    @Test
    @WithMockUser
    void favorite_returns201_andDelegatesWithUserIdFromToken() throws Exception {
        authenticateAs(7L);

        mockMvc.perform(post("/api/favorites/42"))
                .andExpect(status().isCreated());

        verify(favoriteService).favorite(eq(7L), eq(42L));
    }

    @Test
    @WithMockUser
    void unfavorite_returns204() throws Exception {
        authenticateAs(7L);

        mockMvc.perform(delete("/api/favorites/42"))
                .andExpect(status().isNoContent());

        verify(favoriteService).unfavorite(eq(7L), eq(42L));
    }
}
