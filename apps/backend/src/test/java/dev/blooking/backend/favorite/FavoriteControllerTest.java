package dev.blooking.backend.favorite;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Web-layer tests for {@link FavoriteController}.
 *
 * <p>The security filter chain is <b>enabled</b> (no {@code addFilters = false})
 * so the {@code authentication(...)} request post-processor publishes the
 * principal into the context, exactly as the real JWT filter would. The
 * controller reads the acting user id from {@code Authentication.getPrincipal()}
 * (a {@code Long}), so the test principal is that id — mirroring the filter.
 */
@WebMvcTest(FavoriteController.class)
class FavoriteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FavoriteService favoriteService;

    // SecurityConfig is loaded in the web slice and wires JwtAuthenticationFilter,
    // which needs a JwtService; the filter never authenticates here (no Bearer
    // header — the principal comes from the post-processor), but the bean must be
    // satisfiable for the context to start.
    @MockitoBean
    private dev.blooking.backend.auth.jwt.JwtService jwtService;

    /** An Authentication whose principal is the user id, matching the JWT filter. */
    private static Authentication asUser(long userId) {
        return new UsernamePasswordAuthenticationToken(userId, null, java.util.List.of());
    }

    @Test
    void favorite_returns201_andDelegatesWithUserIdFromToken() throws Exception {
        mockMvc.perform(post("/api/favorites/42").with(authentication(asUser(7L))).with(csrf()))
                .andExpect(status().isCreated());

        verify(favoriteService).favorite(eq(7L), eq(42L));
    }

    @Test
    void unfavorite_returns204() throws Exception {
        mockMvc.perform(delete("/api/favorites/42").with(authentication(asUser(7L))).with(csrf()))
                .andExpect(status().isNoContent());

        verify(favoriteService).unfavorite(eq(7L), eq(42L));
    }
}
