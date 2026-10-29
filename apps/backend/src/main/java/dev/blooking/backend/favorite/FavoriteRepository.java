package dev.blooking.backend.favorite;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    boolean existsByUserIdAndBookId(Long userId, Long bookId);

    Optional<Favorite> findByUserIdAndBookId(Long userId, Long bookId);

    Page<Favorite> findByUserId(Long userId, Pageable pageable);

    /**
     * The user's favorites, most recent first. Used by the "because you liked X"
     * recommendations to pick the few newest favorites to build carousels from;
     * cap the count with a {@code Pageable} (e.g. {@code PageRequest.of(0, 8)}).
     */
    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
