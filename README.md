# Blooking

An event-driven platform for book discovery, offering hybrid search (semantic + keyword) and personalized recommendations based on user interactions.

## Key Features

* **Hybrid Book Search:** Combines semantic (AI-powered) and keyword search to deliver accurate and context-aware results.
* **Multilingual Semantic Search:** Allows users to query in Portuguese or English while searching over book metadata and descriptions.
* **Personalized Recommendations:** Dynamically suggests books based on user preferences and reading behavior using an event-driven architecture (RabbitMQ).
* **Favorites:** Logged-in users can favorite books, which both saves them and strengthens their personalized recommendations.
* **Lightweight Local Seeding:** Seeded with a curated sample of ~3,000 books from Kaggle for fast setup and instant vector embedding generation.
* **Interactive Discovery:** Explore book details, view cover images, filter by genres/authors, and manage user accounts.

## Project Structure

This project is built as a **monorepo** containing both the frontend and backend services:

| Directory | Description | Tech Stack |
| :--- | :--- | :--- |
| **[`apps/backend`](./apps/backend)** | Core REST API for search and recommendation processing | Java 21, Spring Boot, PostgreSQL (pgvector), RabbitMQ |
| **[`apps/frontend`](./apps/frontend)** | Web user interface for book discovery | React, TypeScript |
| **[`docs`](./docs)** | Project documentation (Architecture, API specs, User Stories) | Markdown |

> *Check the `README.md` inside each application folder under `apps/` for detailed setup and usage instructions.*

## Quick Start

### Prerequisites
* [Docker Desktop](https://www.docker.com/) installed and running (for Postgres + pgvector, RabbitMQ and Ollama)
* [Java 21](https://adoptium.net/) & [Node.js 20+](https://nodejs.org/)

### Running the App

1. **Clone the repository and start the infrastructure** (Postgres + pgvector, RabbitMQ, Ollama):
   ```bash
   git clone https://github.com/PedroRosa-Gif/blooking.git
   cd blooking
   cp .env.example .env        # adjust values if needed
   docker compose up -d
   ```

2. **Run the backend** (from `apps/backend`):
   ```bash
   cd apps/backend
   ./mvnw spring-boot:run       # starts on http://localhost:8080
   ```
   > ⚠️ The first startup seeds ~3,000 books and generates an embedding for each
   > via Ollama (`bge-m3`), which can take several minutes. It runs once and is
   > idempotent on restart. See [`apps/backend/README.md`](./apps/backend/README.md).

3. **Run the frontend** (from `apps/frontend`, in a second terminal):
   ```bash
   cd apps/frontend
   cp .env.example .env         # defaults to the backend on :8080
   npm install
   npm run dev                  # http://localhost:5173
   ```

Open **http://localhost:5173** to use the app. For details (environment
variables, endpoints, auth, tests) see the per-app READMEs linked in the table
above.
