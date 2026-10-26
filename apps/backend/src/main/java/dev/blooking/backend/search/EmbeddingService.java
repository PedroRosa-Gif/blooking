package dev.blooking.backend.search;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;

import dev.blooking.backend.book.Book;

/**
 * Generates dense vector embeddings via the configured Spring AI model
 * (Ollama {@code bge-m3}, 1024 dimensions).
 *
 * <p>Centralizes the embedding logic so that indexing (seeding) and querying
 * use the exact same model and the same structured input format. Keeping the
 * document/query text construction here is important: the vectors are only
 * comparable if both sides are embedded consistently.
 */
@Service
public class EmbeddingService {

    private final EmbeddingModel embeddingModel;

    public EmbeddingService(EmbeddingModel embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    /**
     * Structured text used to embed a book during indexing. Mirrors the format
     * documented in docs/architecture.md:
     * {@code Title: ... | Author: ... | Genres: ... | Description: ...}
     */
    public String buildDocumentText(Book book) {
        String genres = book.getGenres() == null ? "" : String.join(", ", book.getGenres());
        return "Title: " + nullToEmpty(book.getTitle())
                + " | Author: " + nullToEmpty(book.getAuthor())
                + " | Genres: " + genres
                + " | Description: " + nullToEmpty(book.getDescription());
    }

    /** Embeds a book's structured document text. */
    public float[] embedBook(Book book) {
        return embed(buildDocumentText(book));
    }

    /** Embeds an arbitrary text (e.g. a user's search query). */
    public float[] embed(String text) {
        return embeddingModel.embed(text == null ? "" : text);
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
