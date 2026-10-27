package dev.blooking.backend.book;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import dev.blooking.backend.support.PostgresTestContainer;

/**
 * End-to-end seeder test: boots the application against a real PostgreSQL
 * container and verifies that the bundled {@code books_sample.csv} is parsed
 * and loaded. This exercises the CSV parsing, JSON array handling and batch
 * insert path for real.
 *
 * <p>Requires Docker to be running. RabbitMQ/Ollama are not contacted at
 * startup (no listeners / no embedding calls happen here).
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = {
                // Disable embedding generation so this test does not require a
                // running Ollama; it only verifies the CSV import path.
                "blooking.seed.embeddings.enabled=false",
                // Do not start the RabbitMQ listener (no broker in this test).
                "spring.rabbitmq.listener.simple.auto-startup=false"
        })
class BookSeederIT extends PostgresTestContainer {

    @Autowired
    private BookRepository bookRepository;

    @Test
    void seederLoadsTheFullSample() {
        // The seeder runs on startup (blooking.seed.enabled defaults to true).
        assertThat(bookRepository.count()).isEqualTo(3000L);

        // Spot-check that array columns were parsed from the JSON in the CSV.
        Book book = bookRepository.findAll().stream()
                .filter(b -> "The Hunger Games".equals(b.getTitle()))
                .findFirst()
                .orElseThrow();
        assertThat(book.getGenres()).contains("Fiction", "Dystopia");
        assertThat(book.getAuthor()).isEqualTo("Suzanne Collins");
    }
}
