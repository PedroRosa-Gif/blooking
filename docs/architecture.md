# Project Overview

A book search and recommendation platform that leverages hybrid search (semantic + keyword search) over a knowledge base. The system delivers relevant book results via vector embeddings and provides personalized recommendations based on user interaction events through an event-driven architecture.

# Architecture Diagram

<img src="./imgs/architecture.png" alt="Architecture Diagram" width="600"/>

# Tech Stack

* **Frontend:** React, TypeScript, Axios / React Query.
* **Backend:** Java, Spring Boot (Spring Data JPA, Spring AI / REST APIs).
* **Database:** PostgreSQL with `pgvector` extension (for Relational Data, Full-Text Search, and Vector Embeddings).
* **Event Broker:** AWS EventBridge (or Amazon SQS) for async recommendation events.
* **Embedding Model:** Local `nomic-embed-text` via Ollama (or Hugging Face Inference API).
* **Containerization:** Docker & Docker Compose.

# Core Architectural Concepts & Data Flow

### Hybrid Search Engine (Retriever)
When a user submits a prompt via the Frontend:
1. **Embedding Generation:** The Backend converts the input query into a vector embedding (`Embedded prompt`).
2. **Parallel Retrieval:**
   * **Semantic Search:** Queries vector embeddings stored in PostgreSQL using `pgvector` (cosine similarity / L2 distance).
   * **Keyword Search:** Queries standard text using PostgreSQL Full-Text Search (`tsvector`).
3. **Ranking & Merging:** The Retriever component combines and re-ranks results from both strategies before sending the `Retrieved Documents` back to the Frontend.

### Event-Driven Recommendations
* User actions (e.g., viewing, searching, or saving books) publish events to the Event Broker.
* A background consumer processes these preference events asynchronously to update user profile embeddings and generate personalized recommendations without blocking main search requests.

## Data Source & Pipeline

* **Dataset:** [Best Books Ever Dataset (Kaggle)](https://www.kaggle.com/datasets/pooriamst/best-books-ever-dataset/data)
* **Dataset Scope:** **Sampled to ~3,000 top records** (out of 52,000) for fast local development, low memory footprint, and quick vector embedding generation.
* **Key Fields Utilized:**
  * `title`, `author`, `genres` — Used for Full-Text Search and categorical filtering.
  * `description` — Primary textual source for generating dense vector embeddings.
  * `coverImg` — Used by the frontend interface for book cards and details.
  * `rating`, `numRatings` — Used as factors in the candidate re-ranking step.

### Multilingual Embedding Strategy
To support Portuguese queries over an English dataset without manual translation, the backend relies on a multilingual embedding model (e.g., `bge-m3` via Ollama/Spring AI). 

When indexing, a structured context string is created per book:
```text
Title: {title} | Author: {author} | Genres: {genres} | Description: {description}
```
# Infrastructure & Deployment

* **Environments:** Development (Docker Compose) / Production (AWS ECS / Kubernetes).
* **CI/CD:** GitHub Actions pipeline running unit, integration tests, and container image builds.

# Security & Authentication

* **Authentication:** Stateless authentication using JWT (JSON Web Tokens).
* **API Security:** CORS policies configured for Frontend origin, rate limiting on search endpoints.