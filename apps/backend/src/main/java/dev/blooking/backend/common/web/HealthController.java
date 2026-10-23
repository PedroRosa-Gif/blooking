package dev.blooking.backend.common.web;

import java.time.Instant;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Lightweight application-level health/info endpoint.
 *
 * <p>This is intentionally simple and always available. For deep health
 * (database, RabbitMQ, disk, etc.) use Spring Boot Actuator at
 * {@code /actuator/health}, which inspects each downstream dependency.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "service", "blooking-backend",
                "timestamp", Instant.now().toString()
        );
    }
}
