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
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import dev.blooking.backend.book.Book;
import dev.blooking.backend.book.BookRepository;

/**
 * Seeds the {@code books} table from the bundled sample CSV on startup.
 *
 * <p>Idempotent: it only runs when the table is empty, so restarting the app
 * does not duplicate data. The CSV is produced by {@code scripts/extract_books.py}
 * and lives on the classpath at {@code data/books_sample.csv}.
 *
 * <p>The {@code genres}, {@code characters} and {@code awards} columns are JSON
 * arrays in the CSV and are parsed with Jackson. All other parsing is defensive:
 * a malformed value becomes {@code null}/empty rather than aborting the import.
 */
@Component
public class BookSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BookSeeder.class);

    private static final String CSV_PATH = "data/books_sample.csv";
    private static final int BATCH_SIZE = 500;

    private final BookRepository bookRepository;
    private final ObjectMapper objectMapper;

    public BookSeeder(BookRepository bookRepository, ObjectMapper objectMapper) {
        this.bookRepository = bookRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        long existing = bookRepository.count();
        if (existing > 0) {
            log.info("Book catalog already populated ({} books); skipping seed.", existing);
            return;
        }

        ClassPathResource resource = new ClassPathResource(CSV_PATH);
        if (!resource.exists()) {
            log.warn("Seed file '{}' not found on classpath; starting with an empty catalog.", CSV_PATH);
            return;
        }

        log.info("Seeding book catalog from '{}' ...", CSV_PATH);
        int imported = 0;

        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .get();

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
