# Project Overview

A book search and recommendation platform that leverages hybrid search (semantic + keyword search) over a knowledge base. The system delivers relevant book results via vector embeddings and provides personalized recommendations based on user interaction events through an event-driven architecture.

# Architecture Diagram

<img src="./imgs/architecture.png" alt="Architecture Diagram" width="600"/>

```mermaid
flowchart LR
    User(("User"))

    subgraph FE["Website (Frontend)"]
        UI["React UI"]
    end

    subgraph BE["Backend (Spring Boot — modular monolith)"]
        API["REST API"]
        subgraph RET["Retriever"]
            SEM["Semantic Search"]
            KW["Keyword Search (FTS)"]
            RANK["Ranking / RRF merge"]
            SEM --> RANK
            KW --> RANK
        end
        AUTH["Auth Service (JWT)"]
        RECW["Recommendation Worker (consumer)"]
        PROF["User Profile / Preference Embedding"]
    end

    OLLAMA["Ollama\n(bge-m3 embeddings)"]
    MQ["RabbitMQ\n(interaction events)"]

    subgraph DB["PostgreSQL + pgvector"]
        REL["Relational Data"]
        FTS["Full-Text Search (tsvector)"]
        VEC["Vector Embeddings (vector(1024))"]
    end

    User -->|Access / Prompt| UI
    UI -->|User's Prompt| API
    API -->|Retrieved Documents| UI

    API --> RET
    API -->|embed query / books| OLLAMA
    OLLAMA -->|vector| API
    RET -->|cosine / L2 search| VEC
    RET -->|keyword match| FTS
    RET -->|metadata| REL

    API -->|publish interaction events| MQ
    MQ -->|consume| RECW
    RECW --> PROF
    PROF --> VEC

    AUTH --> REL
```

# Tech Stack

* **Frontend:** React, TypeScript, Axios / React Query.
* **Backend:** Java 21, Spring Boot (Spring Data JPA, Spring AI, Spring AMQP / REST APIs).
* **Database:** PostgreSQL with `pgvector` extension (for Relational Data, Full-Text Search, and Vector Embeddings).
* **Event Broker:** **RabbitMQ** — self-hostable and free, running as a container in the local `docker-compose`. Provides a real message broker with durable queues, retries, and dead-letter queues (DLQ) for asynchronous interaction/recommendation events.
* **Embedding Model:** **`bge-m3` via Ollama** — multilingual (100+ languages, firm support for **English and Portuguese**), 8K context, outputs **1024-dimensional** vectors.
* **Database Migrations:** **Flyway** (versioned SQL migrations).
* **Containerization:** Docker & Docker Compose.

# Core Architectural Concepts & Data Flow

### Hybrid Search Engine (Retriever)
When a user submits a prompt via the Frontend:
1. **Embedding Generation:** The **Backend** calls Ollama (`bge-m3`) to convert the input query into a 1024-dimensional vector embedding. The database only stores and compares vectors — embedding generation is a backend responsibility.
2. **Parallel Retrieval:**
   * **Semantic Search:** Queries vector embeddings stored in PostgreSQL using `pgvector` (cosine similarity / L2 distance).
   * **Keyword Search:** Queries standard text using PostgreSQL Full-Text Search (`tsvector`).
3. **Ranking & Merging:** The Retriever combines and re-ranks results from both strategies using **Reciprocal Rank Fusion (RRF)** before sending the `Retrieved Documents` back to the Frontend.
   * RRF is chosen as the baseline because it fuses two ranked lists without needing to normalize scores of different natures (cosine distance vs. text-match relevance).
   * `rating` / `numRatings` are used as a light tie-breaker / boosting factor in the re-ranking step.
   * **Field weighting (title vs. author vs. genres vs. description) for the keyword/FTS ranking is intentionally deferred and will be defined during implementation.**

### Multilingual Embedding Strategy
To support Portuguese and English queries over an English dataset without manual translation, the backend relies on the multilingual embedding model **`bge-m3`** (via Ollama / Spring AI). Other languages are not required.

When indexing, a structured context string is created per book and embedded:
```text
Title: {title} | Author: {author} | Genres: {genres} | Description: {description}
```

### Embedding Runtime (Ollama) — local execution strategy
`bge-m3` is a multilingual model and is heavier than English-only alternatives (quantized Ollama build ~1.2–1.7 GB in memory; the full build is ~3 GB). English-only lightweight models (e.g. `nomic-embed-text`, `all-MiniLM-L6-v2`) were **rejected** because they do not meet the firm Portuguese requirement. The workload is light in practice: the ~3,000 books are embedded once at ingestion, and at query time only short user prompts are embedded.

To keep the project easy to run on modest machines:
* By default, Ollama runs as a **container service** in `docker-compose` (single `docker-compose up` brings up everything).
* The backend reaches Ollama via an `OLLAMA_BASE_URL` environment variable, so on low-memory machines it can instead point to a **native Ollama install on the host** (e.g. Ollama for Windows/macOS) without any code change. The native packager does not make the model smaller — the model size is identical — but running on the host can use better CPU/GPU acceleration.

### Event-Driven Recommendations
User actions publish events to **RabbitMQ**. A background consumer (**Recommendation Worker**) processes these preference events asynchronously to update the user's profile embedding and generate personalized recommendations without blocking main search requests.

**Interaction events (initial contract):**

| Event | Trigger | Requires login? |
| :--- | :--- | :--- |
| `book.viewed` | User opens a book detail page (US04) | No |
| `book.searched` | User submits a search query | No |
| `book.favorited` | Logged-in user favorites a book | Yes |
| `book.unfavorited` | Logged-in user removes a favorite | Yes |

The Recommendation Worker aggregates the embeddings of the books a user has favorited/viewed into a **user profile embedding** (e.g. a weighted average), which is then used to retrieve similar books via `pgvector`.

## Data Source & Pipeline

* **Dataset:** [Best Books Ever Dataset (Kaggle)](https://www.kaggle.com/datasets/pooriamst/best-books-ever-dataset/data)
* **Dataset Scope:** **Sampled to ~3,000 top records** (out of 52,000) for fast local development, low memory footprint, and quick vector embedding generation.
* **Key Fields Utilized:**
  * `title`, `author`, `genres` — Used for Full-Text Search and categorical filtering.
  * `description` — Primary textual source for generating dense vector embeddings.
  * `coverImg` — Used by the frontend interface for book cards and details.
  * `rating`, `numRatings` — Used as factors in the candidate re-ranking step.

# Infrastructure & Deployment

* **Environments:** Development (Docker Compose, including PostgreSQL+pgvector, RabbitMQ, and Ollama) / Production (AWS ECS / Kubernetes — future).
* **CI/CD:** GitHub Actions pipeline running unit, integration tests, and container image builds.

# Security & Authentication

* **Authentication:** Stateless authentication using JWT (JSON Web Tokens).
* **API Security:** CORS policies configured for Frontend origin, rate limiting on search endpoints.
* **Gated actions:** favoriting/unfavoriting books requires an authenticated user.
