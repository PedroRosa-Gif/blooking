# Blooking

An event-driven platform for book discovery, offering hybrid search (semantic + keyword) and personalized recommendations based on user interactions.

## Key Features

* **Hybrid Book Search:** Combines semantic (AI-powered) and keyword search to deliver accurate and context-aware results.
* **Personalized Recommendations:** Dynamically suggests new books based on user preferences and reading behavior.
* **Interactive Discovery:** Explore details, filter through collections, and manage user accounts seamlessly.

## Project Structure

This project is built as a **monorepo** containing both the frontend and backend services:

| Directory | Description | Tech Stack |
| :--- | :--- | :--- |
| **[`apps/backend`](./apps/backend)** | Core REST API for search and recommendation processing | Java, Spring Boot, PostgreSQL |
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