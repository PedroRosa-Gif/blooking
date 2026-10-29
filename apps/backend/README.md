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
| `RECO_FAVORITE_WEIGHT` | `1.0` | Weight of a favorite in the preference embedding |
| `RECO_VIEW_WEIGHT` | `0.25` | Weight of a view in the preference embedding |
| `RECO_VIEW_CAP` | `3` | Max views per book counted toward the profile |
| `SERVER_PORT` | `8080` | HTTP port |

## Endpoints (current)

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Simple application liveness check |
| `GET` | `/api/books` | List books (paginated); filters: `q`, `author`, `genre` (repeatable) + `genreMatch` |
| `GET` | `/api/books/{id}` | Book detail |
| `GET` | `/api/search?q=&limit=` | Hybrid search (semantic + keyword, RRF-fused) |
| `POST` | `/api/auth/register` | Create account → access + refresh token |
| `POST` | `/api/auth/login` | Log in → access + refresh token |
| `POST` | `/api/auth/refresh` | Exchange refresh token for a new access token (rotates refresh) |
| `POST` | `/api/auth/logout` | Revoke the given refresh token (public; auth is the refresh token itself) |
| `GET` | `/api/auth/me` | Current user (requires `Authorization: Bearer <access>`) |
| `POST` | `/api/favorites/{bookId}` | Favorite a book (auth) |
| `DELETE` | `/api/favorites/{bookId}` | Remove a favorite (auth) |
| `GET` | `/api/favorites` | List my favorite books, paginated (auth) |
| `GET` | `/api/recommendations?limit=` | Personalized book recommendations (auth) |
| `GET` | `/api/recommendations/by-favorites` | "Because you liked X" carousels, one per recent favorite (auth) |
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

# Multiple genres. genreMatch=all (default) -> books with EVERY genre;
# genreMatch=any -> books with at least one.
curl "http://localhost:8080/api/books?genre=Fantasy&genre=Dystopia"            # all (default)
curl "http://localhost:8080/api/books?genre=Fantasy&genre=Romance&genreMatch=any"

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

Public endpoints: `/api/books/**`, `/api/search`, `/api/auth/{register,login,refresh,logout}`,
`/actuator/health`. Everything else requires a valid access token.

> **Token transport (current vs. planned):** both tokens are returned in the
> JSON body and sent via the `Authorization: Bearer` header. When the frontend
> is built, the **refresh token will move to an `HttpOnly` + `Secure` +
> `SameSite` cookie** (protects it from XSS theft), keeping the short-lived
> access token in the header. CSRF handling will be added at that point.

## Favorites & interaction events

Logged-in users can favorite/unfavorite books (`/api/favorites`). Every
interaction — **view, search, favorite, unfavorite** — publishes an event to
**RabbitMQ**, and a consumer records it in the append-only `interactions` table
(audit log + source data for recommendations — see
[Recommendations](#recommendations-us05)).

**Watch it work:**
- **RabbitMQ Management UI** → http://localhost:15672 (user/pass from `.env`,
  default `blooking`/`blooking`). See the `blooking.events` exchange, the
  `book.events` queue, the dead-letter queue, and message rates in real time.
- **DBeaver / SQL** → `SELECT * FROM interactions ORDER BY recorded_at DESC;`
  shows the events after they were consumed.

Flow: favorite a book → the message appears and is consumed in the RabbitMQ UI →
a new row lands in `interactions`.

Event types / routing keys: `book.viewed`, `book.searched`, `book.favorited`,
`book.unfavorited` (topic exchange, bound with `book.*`).

## Recommendations (US05)

`GET /api/recommendations?limit=` (auth) returns a personalized list of books.

The consumer doubles as a **recommendation worker**: when a user favorites,
unfavorites, or views a book, it recomputes that user's **preference embedding**
and stores it in `user_profiles` (migration `V8`).

The preference embedding is a **weighted centroid** of the embeddings of the
books the user interacted with:

- **favorites** are the strong signal (weight `1.0`);
- **views** are a weaker signal (weight `0.25` per view, capped at `3` views per
  book) — so repeatedly viewing a book counts as stronger interest, but a burst
  of page refreshes can't drown out the user's other interests;
- views of a book the user has already favorited are ignored (no double count).

The weights are configurable under `blooking.recommendation.*` (see
`application.yml`). Because the recompute reads the live favorites + view history
each time, unfavoriting removes a book's influence and the profile never drifts.

Recommendations are then served in two modes:

- **Content-based** — when the user has a preference embedding, return the books
  whose embeddings are nearest to it by cosine distance (pgvector `<=>`),
  excluding books they already favorite.
- **Cold-start fallback** — a user with no favorites yet gets the most popular
  books (by `num_ratings`, then `rating`), so the section is never empty.

```bash
# After logging in and favoriting a few books:
curl -H "Authorization: Bearer <access>" "http://localhost:8080/api/recommendations?limit=12"
```

### "Because you liked X" (`GET /api/recommendations/by-favorites`)

A Netflix-style view built from the user's favorites: one carousel per favorite,
each listing the books most similar to that favorite by **book-to-book** cosine
distance (pgvector `b.embedding <=> src.embedding`). Unlike
`/api/recommendations` (which ranks against a single centroid profile), each
carousel is anchored on one specific book, so the result is directly
attributable ("because you liked _this_").

- At most the **8 most-recent favorites** become carousels, each with up to
  **12** similar books.
- Every carousel excludes the source book and all of the user's favorites;
  a book may appear in more than one carousel (each is independent).
- Carousels whose source book has no embedding are dropped (no empty sections).
  Returns `[]` when the user has no favorites with usable embeddings.

```bash
curl -H "Authorization: Bearer <access>" "http://localhost:8080/api/recommendations/by-favorites"
# -> [ { "source": { ...BookSummary... }, "similar": [ { ...BookSummary... }, ... ] }, ... ]
```

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
