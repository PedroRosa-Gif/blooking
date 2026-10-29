package dev.blooking.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point for the Blooking backend.
 *
 * <p>Boots the Spring context, which wires up the REST API, JPA/Flyway,
 * RabbitMQ (Spring AMQP), and the Ollama embedding client (Spring AI).
 *
 * <p>{@code @EnableScheduling} turns on the {@code @Scheduled} support used by
 * the refresh-token cleanup job.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
