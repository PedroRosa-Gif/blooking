package dev.blooking.backend.favorite;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    boolean existsByUserIdAndBookId(Long userId, Long bookId);

    Optional<Favorite> findByUserIdAndBookId(Long userId, Long bookId);

    Page<Favorite> findByUserId(Long userId, Pageable pageable);
}
