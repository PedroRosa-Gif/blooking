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
| `GET` | `/api/search?q=&limit=` | Hybrid search (semantic + keyword, RRF-fused) |
| `POST` | `/api/auth/register` | Create account → access + refresh token |
| `POST` | `/api/auth/login` | Log in → access + refresh token |
| `POST` | `/api/auth/refresh` | Exchange refresh token for a new access token (rotates refresh) |
| `POST` | `/api/auth/logout` | Revoke the given refresh token |
| `GET` | `/api/auth/me` | Current user (requires `Authorization: Bearer <access>`) |
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

### Catalog seeding & embeddings

On first startup, `BookSeeder` loads `src/main/resources/data/books_sample.csv`
(~3,000 books) into the `books` table, then generates a **semantic embedding**
for each book by calling Ollama (`bge-m3`).

Both steps are **idempotent**:
- rows are imported only when the table is empty;
- embeddings are generated only for books that don't have one yet, so a restart
  backfills any missing (e.g. if a previous run was interrupted or Ollama was
  down).

> ⚠️ The first run generates ~3,000 embeddings and **can take several minutes**
> (one Ollama call per book). It runs once; later startups skip already-embedded
> books. To re-seed from scratch, reset the volume: `docker compose down -v`.

Disable embedding generation (e.g. for a fast dev startup or tests) with:

```properties
blooking.seed.embeddings.enabled=false
```

Examples:

```bash
curl "http://localhost:8080/api/search?q=young wizard at a magic school&limit=5"
curl "http://localhost:8080/api/search?q=distopia jovens&limit=5"   # Portuguese query
```

## Authentication (JWT)

Stateless auth with a **short-lived access token** (JWT, 15 min) and a
**long-lived, revocable refresh token** (opaque, 7 days, stored hashed in the
`refresh_tokens` table). Login is by **username**.

```bash
# register (or login) -> { accessToken, refreshToken, tokenType, expiresInSeconds }
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"password123","displayName":"Alice"}'

# call a protected endpoint
curl http://localhost:8080/api/auth/me -H "Authorization: Bearer <accessToken>"

# refresh (rotates the refresh token: the old one is revoked)
curl -X POST http://localhost:8080/api/auth/refresh \
  -H 'Content-Type: application/json' -d '{"refreshToken":"<refreshToken>"}'

# logout (revokes the refresh token)
curl -X POST http://localhost:8080/api/auth/logout \
  -H 'Content-Type: application/json' -d '{"refreshToken":"<refreshToken>"}'
```

Config via env vars: `JWT_SECRET` (set a long random value in real
environments), `JWT_ACCESS_EXPIRATION_MS`, `JWT_REFRESH_EXPIRATION_MS`,
`CORS_ALLOWED_ORIGINS`.

Public endpoints: `/api/books/**`, `/api/search`, `/api/auth/{register,login,refresh}`,
`/actuator/health`. Everything else requires a valid access token.

> **Token transport (current vs. planned):** both tokens are returned in the
> JSON body and sent via the `Authorization: Bearer` header. When the frontend
> is built, the **refresh token will move to an `HttpOnly` + `Secure` +
> `SameSite` cookie** (protects it from XSS theft), keeping the short-lived
> access token in the header. CSRF handling will be added at that point.

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
