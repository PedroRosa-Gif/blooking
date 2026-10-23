package dev.blooking.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Blooking backend.
 *
 * <p>Boots the Spring context, which wires up the REST API, JPA/Flyway,
 * RabbitMQ (Spring AMQP), and the Ollama embedding client (Spring AI).
 */
@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
