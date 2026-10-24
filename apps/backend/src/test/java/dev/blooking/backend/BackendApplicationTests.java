package dev.blooking.backend;

import org.junit.jupiter.api.Test;

/**
 * Placeholder test.
 *
 * <p>Intentionally does NOT use {@code @SpringBootTest}: a full context load
 * requires PostgreSQL, RabbitMQ, and Ollama to be reachable. A proper
 * context/integration test (likely with Testcontainers) will be added once
 * those slices exist.
 */
class BackendApplicationTests {

    @Test
    void sanity() {
        // Structural placeholder so the module has a compilable test source set.
        assert 1 + 1 == 2;
    }
}
