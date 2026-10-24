package dev.blooking.backend.support;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Shared, singleton PostgreSQL (+pgvector) container for integration tests.
 *
 * <p>The container is started once for the whole test JVM (classic singleton
 * container pattern) and reused across test classes, which keeps the overhead
 * to a single startup instead of one-per-class.
 *
 * <p>Uses the {@code pgvector/pgvector} image so the {@code vector} extension
 * enabled by migration {@code V1} is available — the stock {@code postgres}
 * image would fail that migration.
 *
 * <p>Requires a running Docker daemon on the machine executing the tests.
 */
public abstract class PostgresTestContainer {

    // pgvector image advertised as PostgreSQL so Testcontainers' JDBC wait works.
    private static final DockerImageName IMAGE = DockerImageName
            .parse("pgvector/pgvector:pg16")
            .asCompatibleSubstituteFor("postgres");

    protected static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(IMAGE)
            .withDatabaseName("blooking_test")
            .withUsername("test")
            .withPassword("test");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasourceProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        // Flyway shares the same datasource; migrations run against the container.
    }
}
