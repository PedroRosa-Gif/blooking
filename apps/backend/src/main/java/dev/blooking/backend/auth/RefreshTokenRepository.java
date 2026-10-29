package dev.blooking.backend.auth;

import java.time.OffsetDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /** Revokes all active tokens for a user (e.g. defensive logout-all). */
    @Modifying
    @Query("UPDATE RefreshToken t SET t.revoked = true WHERE t.userId = :userId AND t.revoked = false")
    int revokeAllForUser(@Param("userId") Long userId);

    /**
     * Hard-deletes refresh tokens that can no longer be used, reclaiming rows
     * that only ever become inactive today (never deleted):
     * <ul>
     *   <li>any token whose {@code expiresAt} is before {@code now} (expired —
     *       already rejected by {@link RefreshToken#isActive()});</li>
     *   <li>any <b>revoked</b> token older than {@code revokedCutoff} — rotation
     *       and logout revoke tokens, and once a grace period has passed there
     *       is no reason to keep the row.</li>
     * </ul>
     * Returns the number of rows deleted. Used by the scheduled cleanup job.
     */
    @Modifying
    @Query("""
            DELETE FROM RefreshToken t
            WHERE t.expiresAt < :now
               OR (t.revoked = true AND t.createdAt < :revokedCutoff)
            """)
    int deleteExpiredOrStaleRevoked(@Param("now") OffsetDateTime now,
                                    @Param("revokedCutoff") OffsetDateTime revokedCutoff);
}
