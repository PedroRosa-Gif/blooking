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

### 1. Hybrid Search Engine (Retriever)
When a user submits a prompt via the Frontend:
1. **Embedding Generation:** The Backend converts the input query into a vector embedding (`Embedded prompt`).
2. **Parallel Retrieval:**
   * **Semantic Search:** Queries vector embeddings stored in PostgreSQL using `pgvector` (cosine similarity / L2 distance).
   * **Keyword Search:** Queries standard text using PostgreSQL Full-Text Search (`tsvector`).
3. **Ranking & Merging:** The Retriever component combines and re-ranks results from both strategies before sending the `Retrieved Documents` back to the Frontend.

### 2. Event-Driven Recommendations
* User actions (e.g., viewing, searching, or saving books) publish events to the Event Broker.
* A background consumer processes these preference events asynchronously to update user profile embeddings and generate personalized recommendations without blocking main search requests.

# Infrastructure & Deployment

* **Environments:** Development (Docker Compose) / Production (AWS ECS / Kubernetes).
* **CI/CD:** GitHub Actions pipeline running unit, integration tests, and container image builds.

# Security & Authentication

* **Authentication:** Stateless authentication using JWT (JSON Web Tokens).
* **API Security:** CORS policies configured for Frontend origin, rate limiting on search endpoints.