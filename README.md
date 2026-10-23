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

<!-- ## Quick Start

### Prerequisites
* [Docker Desktop](https://www.docker.com/) installed and running
* [Java 21](https://adoptium.net/) & [Node.js (v18+)](https://nodejs.org/)

### Running the App
1. Clone the repository and navigate to the root folder:
   ```bash
   git clone [https://github.com/your-username/blooking.git](https://github.com/your-username/blooking.git)
   cd blooking -->