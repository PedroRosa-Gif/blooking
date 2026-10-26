# Blooking — Backend

Core REST API for book search and recommendation.

## Tech Stack

- **Java 21**, **Spring Boot 3.5.x**
- **Spring Data JPA** (PostgreSQL) + **Flyway** migrations
- **pgvector** for semantic search / recommendation embeddings
- **Spring AMQP** (RabbitMQ) for interaction/recommendation events
- **Spring AI** (Ollama, `bge-m3`) for multilingual embeddings
- **Spring Boot Actuator** for operational endpoints

## Prerequisites

- Java 21 (`java -version`)
- Docker & Docker Compose (for Postgres, RabbitMQ, Ollama)

## Running locally

From the repository root, start the infrastructure:

```bash
cp .env.example .env        # adjust values if needed
docker compose up -d        # Postgres + pgvector, RabbitMQ, Ollama (+ model pull)
```

Then run the backend (from `apps/backend`):

```bash
./mvnw spring-boot:run
```

The app starts on `http://localhost:8080`.

### Environment variables

The backend reads connection settings from environment variables (sensible
localhost defaults are baked in, matching `docker-compose.yml`):

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `DB_HOST` / `DB_PORT` | `localhost` / `5432` | PostgreSQL host/port |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | `blooking` | PostgreSQL database/credentials |
| `RABBITMQ_HOST` / `RABBITMQ_PORT` | `localhost` / `5672` | RabbitMQ |
| `RABBITMQ_USER` / `RABBITMQ_PASSWORD` | `blooking` | RabbitMQ credentials |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama endpoint |
| `EMBEDDING_MODEL` | `bge-m3` | Embedding model name |
| `SERVER_PORT` | `8080` | HTTP port |

## Endpoints (current)

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Simple application liveness check |
| `GET` | `/api/books` | List books (paginated); filters: `q`, `author`, `genre` |
| `GET` | `/api/books/{id}` | Book detail |
| `GET` | `/actuator/health` | Deep health (DB, RabbitMQ, disk, ...) |
| `GET` | `/actuator/info` | Build/app info |
| `GET` | `/actuator/metrics` | Metrics |

Examples:

```bash
curl http://localhost:8080/api/health
# {"status":"UP","service":"blooking-backend","timestamp":"..."}

# First page, 20 books, sorted by num_ratings desc (default)
curl "http://localhost:8080/api/books"

# Filter by genre + free-text, page 2 of 10
curl "http://localhost:8080/api/books?genre=Fantasy&q=harry&page=1&size=10"

# Sort by rating descending
curl "http://localhost:8080/api/books?sort=rating,desc"

# Book detail
curl "http://localhost:8080/api/books/1"
```

### Catalog seeding

On first startup, `BookSeeder` loads `src/main/resources/data/books_sample.csv`
(~3,000 books) into the `books` table. It is **idempotent**: if the table
already has rows, seeding is skipped. To re-seed from scratch, drop the data
(e.g. `docker compose down -v` to reset the Postgres volume) and restart.

## Tests

Two layers:

- **Unit / web tests** (`*Test`) — fast, no external services. Run with:
  ```bash
  ./mvnw test
  ```
- **Integration tests** (`*IT`) — run against a real PostgreSQL (+pgvector)
  started by **Testcontainers**. Run (includes the unit tests too) with:
  ```bash
  ./mvnw verify
  ```
  If no Docker daemon is reachable, these tests are **skipped** (not failed),
  so `mvn verify` still succeeds on machines/CI without Docker.

The integration DB is ephemeral and isolated from your dev database; it does
not touch the `docker-compose` Postgres. The first run downloads the pgvector
image (~150 MB) once.

> **Docker Engine 29+ note:** Testcontainers is pinned to `1.21.4` (overriding
> the Spring Boot BOM). Earlier versions fail against Docker Engine 29+
> (Docker Desktop 4.52+) with a `400 Bad Request` / "Could not find a valid
> Docker environment", even when Docker is running.

## Database migrations (Flyway)

Schema changes are managed by Flyway. Migration scripts live in
`src/main/resources/db/migration` and are applied automatically on startup.
See the repository docs for the full convention; the short version:

- Files are named `V<number>__<description>.sql` (e.g. `V1__enable_extensions.sql`).
- They run in version order, exactly once each, and are recorded in the
  `flyway_schema_history` table.
- Never edit a migration that has already been applied — add a new one instead.

## Project layout

```
apps/backend/
├── pom.xml
├── mvnw / mvnw.cmd / .mvn/
└── src/
    ├── main/
    │   ├── java/dev/blooking/backend/
    │   │   ├── BackendApplication.java
    │   │   └── common/web/HealthController.java
    │   └── resources/
    │       ├── application.yml
    │       └── db/migration/
    │           └── V1__enable_extensions.sql
    └── test/
        └── java/dev/blooking/backend/
            └── BackendApplicationTests.java
```
