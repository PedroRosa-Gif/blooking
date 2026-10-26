package dev.blooking.backend.book.ingest;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import dev.blooking.backend.book.Book;
import dev.blooking.backend.book.BookRepository;
import dev.blooking.backend.search.EmbeddingService;
import dev.blooking.backend.search.SearchRepository;

/**
 * Seeds the {@code books} table from the bundled sample CSV on startup and
 * generates a semantic embedding for each book.
 *
 * <p>Idempotent in two independent steps:
 * <ul>
 *   <li><b>Rows:</b> the CSV is imported only when the table is empty.</li>
 *   <li><b>Embeddings:</b> embeddings are generated only for books that do not
 *       have one yet, so a restart backfills any that are missing (e.g. if a
 *       previous run was interrupted or Ollama was down).</li>
 * </ul>
 *
 * <p>Embedding generation calls Ollama ({@code bge-m3}) once per book, so the
 * first full run takes a while. It can be disabled with
 * {@code blooking.seed.embeddings.enabled=false} (e.g. in tests).
 */
@Component
@ConditionalOnProperty(name = "blooking.seed.enabled", havingValue = "true", matchIfMissing = true)
public class BookSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BookSeeder.class);

    private static final String CSV_PATH = "data/books_sample.csv";
    private static final int BATCH_SIZE = 500;

    private final BookRepository bookRepository;
    private final SearchRepository searchRepository;
    private final EmbeddingService embeddingService;
    private final ObjectMapper objectMapper;

    @Value("${blooking.seed.embeddings.enabled:true}")
    private boolean embeddingsEnabled;

    public BookSeeder(BookRepository bookRepository,
                      SearchRepository searchRepository,
                      EmbeddingService embeddingService,
                      ObjectMapper objectMapper) {
        this.bookRepository = bookRepository;
        this.searchRepository = searchRepository;
        this.embeddingService = embeddingService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(ApplicationArguments args) {
        importRowsIfEmpty();
        if (embeddingsEnabled) {
            generateMissingEmbeddings();
        } else {
            log.info("Embedding generation disabled (blooking.seed.embeddings.enabled=false).");
        }
    }

    // --- Step 1: import rows ------------------------------------------------

    // Not @Transactional: each bookRepository.saveAll(batch) runs in its own
    // transaction (Spring Data default), which is what we want for large batched
    // imports. (A @Transactional here would be ineffective anyway — it is called
    // via self-invocation from run(), which bypasses the Spring proxy.)
    protected void importRowsIfEmpty() {
        long existing = bookRepository.count();
        if (existing > 0) {
            log.info("Book catalog already populated ({} books); skipping CSV import.", existing);
            return;
        }

        ClassPathResource resource = new ClassPathResource(CSV_PATH);
        if (!resource.exists()) {
            log.warn("Seed file '{}' not found on classpath; starting with an empty catalog.", CSV_PATH);
            return;
        }

        log.info("Seeding book catalog from '{}' ...", CSV_PATH);
        int imported = 0;

        // NOTE: Commons CSV 1.12 uses Builder.build(); .get() only exists in 1.13+.
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .build();

        try (InputStream in = resource.getInputStream();
             BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
             CSVParser csv = format.parse(reader)) {

            List<Book> batch = new ArrayList<>(BATCH_SIZE);
            for (CSVRecord record : csv) {
                Book book = toBook(record);
                if (book == null) {
                    continue;
                }
                batch.add(book);
                if (batch.size() >= BATCH_SIZE) {
                    bookRepository.saveAll(batch);
                    imported += batch.size();
                    batch.clear();
                }
            }
            if (!batch.isEmpty()) {
                bookRepository.saveAll(batch);
                imported += batch.size();
            }
        } catch (IOException e) {
            log.error("Failed to read seed file '{}': {}", CSV_PATH, e.getMessage(), e);
            return;
        }

        log.info("Book catalog seeding complete: {} books imported.", imported);
    }

    // --- Step 2: generate embeddings ---------------------------------------

    /**
     * Generates embeddings for every book that does not yet have one. Each book
     * is embedded and persisted individually (its own transaction via the JDBC
     * update) so partial progress survives an interruption and a restart only
     * processes the remainder. A single failing book is logged and skipped.
     */
    protected void generateMissingEmbeddings() {
        long total = bookRepository.count();
        long already = searchRepository.countEmbedded();
        if (total == 0 || already >= total) {
            log.info("Embeddings already present for all {} books; skipping generation.", total);
            return;
        }

        log.info("Generating embeddings: {} of {} books still need one. This may take a while...",
                total - already, total);

        List<Book> books = bookRepository.findAll();
        int done = 0;
        int failed = 0;
        for (Book book : books) {
            try {
                float[] vector = embeddingService.embedBook(book);
                searchRepository.updateEmbedding(book.getId(), vector);
                done++;
                if (done % 250 == 0) {
                    log.info("Embedded {} books so far...", done);
                }
            } catch (RuntimeException e) {
                failed++;
                log.warn("Failed to embed book id={} ('{}'): {}",
                        book.getId(), book.getTitle(), e.getMessage());
            }
        }
        log.info("Embedding generation complete: {} embedded, {} failed.", done, failed);
    }

    // --- CSV mapping (unchanged) -------------------------------------------

    private Book toBook(CSVRecord r) {
        String title = get(r, "title");
        if (title == null || title.isBlank()) {
            return null; // a book without a title is not useful
        }

        Book book = new Book();
        book.setSourceId(get(r, "source_id"));
        book.setTitle(title);
        book.setSeries(get(r, "series"));
        book.setAuthor(get(r, "author"));
        book.setDescription(get(r, "description"));
        book.setLanguage(get(r, "language"));
        book.setIsbn(get(r, "isbn"));
        book.setGenres(parseArray(get(r, "genres")));
        book.setCharacters(parseArray(get(r, "characters")));
        book.setAwards(parseArray(get(r, "awards")));
        book.setBookFormat(get(r, "book_format"));
        book.setPages(parseInt(get(r, "pages")));
        book.setPublisher(get(r, "publisher"));
        book.setPublishYear(parseInt(get(r, "publish_year")));
        book.setRating(parseDecimal(get(r, "rating")));
        book.setNumRatings(parseLong(get(r, "num_ratings")));
        book.setLikedPercent(parseInt(get(r, "liked_percent")));
        book.setCoverImg(get(r, "cover_img"));
        book.setPrice(parseDecimal(get(r, "price")));
        return book;
    }

    /** Returns the trimmed column value, or {@code null} when absent/blank. */
    private static String get(CSVRecord r, String column) {
        if (!r.isMapped(column)) {
            return null;
        }
        String value = r.get(column);
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String[] parseArray(String json) {
        if (json == null || json.isBlank()) {
            return new String[0];
        }
        try {
            List<String> list = objectMapper.readValue(json, new TypeReference<List<String>>() {});
            return list.toArray(new String[0]);
        } catch (Exception e) {
            log.debug("Could not parse array value '{}': {}", json, e.getMessage());
            return new String[0];
        }
    }

    private static Integer parseInt(String value) {
        if (value == null) {
            return null;
        }
        try {
            return (int) Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Long parseLong(String value) {
        if (value == null) {
            return null;
        }
        try {
            return (long) Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static BigDecimal parseDecimal(String value) {
        if (value == null) {
            return null;
        }
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
