package dev.blooking.backend.favorite;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.blooking.backend.book.dto.BookSummaryResponse;

/**
 * Favorites endpoints (US09–US11). All require authentication; the acting user
 * is taken from the JWT (never from the request body).
 */
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping("/{bookId}")
    public ResponseEntity<Void> favorite(Authentication authentication, @PathVariable Long bookId) {
        favoriteService.favorite(currentUserId(authentication), bookId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{bookId}")
    public ResponseEntity<Void> unfavorite(Authentication authentication, @PathVariable Long bookId) {
        favoriteService.unfavorite(currentUserId(authentication), bookId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public Page<BookSummaryResponse> list(
            Authentication authentication,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return favoriteService.listFavorites(currentUserId(authentication), pageable);
    }

    private static Long currentUserId(Authentication authentication) {
        return (Long) authentication.getPrincipal();
    }
}
