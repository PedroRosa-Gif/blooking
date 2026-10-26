package dev.blooking.backend.support;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Base class for integration tests that need a real PostgreSQL (+pgvector).
 *
 * <p>A single container instance is shared across all IT classes (classic
 * singleton container pattern), so the startup cost is paid once per JVM.
 *
 * <p>{@code @Testcontainers(disabledWithoutDocker = true)} makes these tests
 * <em>skip</em> (rather than fail) when no Docker daemon is reachable — e.g. on
 * a machine or CI runner without Docker. The container field is managed by the
 * Testcontainers JUnit extension, which only starts it when Docker is present.
 *
 * <p>Uses the {@code pgvector/pgvector} image so the {@code vector} extension
 * enabled by migration {@code V1} is available.
 */
@Testcontainers(disabledWithoutDocker = true)
public abstract class PostgresTestContainer {

    private static final DockerImageName IMAGE = DockerImageName
            .parse("pgvector/pgvector:pg16")
            .asCompatibleSubstituteFor("postgres");

    // @Container is intentionally NOT used here: a static field managed manually
    // lets us share ONE container across every IT class. We start it lazily in a
    // static initializer guarded by the extension's Docker check above.
    protected static final PostgreSQLContainer<?> POSTGRES = createContainer();

    private static PostgreSQLContainer<?> createContainer() {
        PostgreSQLContainer<?> container = new PostgreSQLContainer<>(IMAGE)
                .withDatabaseName("blooking_test")
                .withUsername("test")
                .withPassword("test");
        // Only start if Docker is actually available; otherwise the class-level
        // @Testcontainers(disabledWithoutDocker=true) will skip the tests and
        // this container is never touched.
        if (org.testcontainers.DockerClientFactory.instance().isDockerAvailable()) {
            container.start();
        }
        return container;
    }

    @DynamicPropertySource
    static void datasourceProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
}
