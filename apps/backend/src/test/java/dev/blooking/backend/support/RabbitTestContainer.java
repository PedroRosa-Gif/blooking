package dev.blooking.backend.support;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Base class for integration tests that need both PostgreSQL (+pgvector) and a
 * real RabbitMQ broker. Extends {@link PostgresTestContainer} so both singleton
 * containers are shared across the test JVM.
 *
 * <p>Skipped (not failed) when Docker is unavailable.
 */
@Testcontainers(disabledWithoutDocker = true)
public abstract class RabbitTestContainer extends PostgresTestContainer {

    protected static final RabbitMQContainer RABBITMQ =
            new RabbitMQContainer(DockerImageName.parse("rabbitmq:3-management"));

    static {
        if (org.testcontainers.DockerClientFactory.instance().isDockerAvailable()) {
            RABBITMQ.start();
        }
    }

    @DynamicPropertySource
    static void rabbitProps(DynamicPropertyRegistry registry) {
        registry.add("spring.rabbitmq.host", RABBITMQ::getHost);
        registry.add("spring.rabbitmq.port", RABBITMQ::getAmqpPort);
        registry.add("spring.rabbitmq.username", RABBITMQ::getAdminUsername);
        registry.add("spring.rabbitmq.password", RABBITMQ::getAdminPassword);
    }
}
