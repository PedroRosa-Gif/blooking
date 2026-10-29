package dev.blooking.backend.auth;

import java.time.Duration;
import java.time.OffsetDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scheduled housekeeping for the {@code refresh_tokens} table.
 *
 * <p>Refresh tokens only ever become <em>inactive</em> during normal operation
 * (expiry, rotation, logout) — they are never deleted — so the table would grow
 * without bound. This job periodically hard-deletes rows that can no longer be
 * used: expired tokens and tokens that have been revoked for longer than a
 * grace period. The grace period keeps very recently revoked tokens around
 * briefly, which is harmless and simplifies any post-mortem debugging.
 */
@Service
public class RefreshTokenCleanupService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenCleanupService.class);

    /** How long a revoked (but not yet expired) token is kept before deletion. */
    private static final Duration REVOKED_GRACE = Duration.ofDays(7);

    private final RefreshTokenRepository repository;

    public RefreshTokenCleanupService(RefreshTokenRepository repository) {
        this.repository = repository;
    }

    /**
     * Runs daily at 03:00 (server time). Deletes expired tokens and tokens
     * revoked more than {@link #REVOKED_GRACE} ago.
     */
    @Scheduled(cron = "${blooking.auth.refresh-cleanup-cron:0 0 3 * * *}")
    @Transactional
    public void purgeExpiredTokens() {
        OffsetDateTime now = OffsetDateTime.now();
        int deleted = repository.deleteExpiredOrStaleRevoked(now, now.minus(REVOKED_GRACE));
        if (deleted > 0) {
            log.info("Refresh-token cleanup deleted {} expired/stale-revoked token(s)", deleted);
        }
    }
}
