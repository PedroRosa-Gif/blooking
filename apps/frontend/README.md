# Blooking — Frontend

Web UI for book discovery, hybrid search and personalized recommendations.
Talks to the [Blooking backend](../backend) REST API.

> **Status:** Phase 1 — **scaffold**. This sets up the toolchain, design system,
> typed API layer, auth skeleton, i18n (EN/PT) and a Home page. The Home grid
> currently renders **sample data** derived from the backend dataset so the app
> runs without the backend. Feature screens (US01–US11) land in later phases.

## Tech Stack

- **React 18** + **TypeScript** + **Vite 5**
- **Tailwind CSS v4** (via `@tailwindcss/vite`, design tokens in `src/styles/index.css`)
- **React Router 6** — routing
- **TanStack Query v5** (React Query) — server state / caching
- **Axios** — HTTP client

## Prerequisites

- Node.js **20+** (the repo is developed on Node 22)
- The backend running on `http://localhost:8080` for live data (see
  [`apps/backend/README.md`](../backend/README.md)). Not required to start the
  UI in Phase 1 — the Home page uses sample data.

## Running locally

```bash
cd apps/frontend
cp .env.example .env     # defaults to the backend on :8080
npm install
npm run dev              # http://localhost:5173
```

The dev server runs on **`http://localhost:5173`**, which is the origin the
backend's CORS allow-list permits by default (`CORS_ALLOWED_ORIGINS`).

### Scripts

| Script             | What it does                                   |
| :----------------- | :--------------------------------------------- |
| `npm run dev`       | Start the Vite dev server (HMR) on `:5173`     |
| `npm run build`     | Type-check (`tsc -b`) and build for production |
| `npm run preview`   | Preview the production build locally           |
| `npm run typecheck` | Type-check only (`tsc --noEmit`)               |
| `npm run lint`      | ESLint (flat config)                           |
| `npm run format`    | Prettier write                                 |

### Environment variables

| Variable            | Default                 | Purpose                        |
| :------------------ | :---------------------- | :----------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Base URL of the backend REST API |

## Project layout

```
apps/frontend/
├── index.html
├── vite.config.ts          # React + Tailwind v4 plugins, "@/" alias, port 5173
├── tsconfig*.json
├── eslint.config.js / .prettierrc.json
├── .env.example            # VITE_API_BASE_URL
├── design.md               # "Portrait" design system reference (source of the tokens)
└── src/
    ├── main.tsx            # providers: QueryClient → I18n → Auth → Router
    ├── App.tsx             # route table
    ├── styles/index.css    # Tailwind v4 @theme — design tokens from design.md
    ├── types/api.ts        # TS mirror of the backend contract (Page<T>, BookSummary, …)
    ├── lib/
    │   ├── axios.ts        # Axios instance (withCredentials, Bearer interceptor)
    │   ├── apiError.ts     # normalize the backend's error shapes
    │   └── queryClient.ts
    ├── api/                # endpoint fns + React Query hooks + query keys
    ├── auth/               # tokenStore + AuthContext (skeleton; wired in Phase 3)
    ├── i18n/               # lightweight EN/PT translations + provider
    ├── mocks/books.ts      # sample books extracted from books_sample.csv
    ├── components/
    │   ├── ui/             # BrandMark, Button, Pill, BookCard
    │   └── layout/         # PillNav, AppLayout, LanguageSwitcher
    └── pages/              # HomePage, NotFoundPage
```

## Design system

The visual language follows [`design.md`](./design.md) (the "Portrait" system):
a near-white canvas, a single deep-navy ink (`#08304c`) for text and structural
lines, and a **reserved** rainbow gradient used only as the Sign-up CTA border,
one italicized word per headline, and the small brand swatch. Two type voices —
**Inter** (body/UI, substituting Switzer) and **Plus Jakarta Sans** (display,
substituting Basier Circle). Tokens live as Tailwind v4 `@theme` custom
properties in `src/styles/index.css`.

Substitutions (vs. the commercial fonts named in `design.md`) and domain
adaptations (Blooking wordmark, product announcement, book-search hero) are
intentional; the doc is used as a design *base*, not followed literally.

## API contract

`src/types/api.ts` is a hand-written mirror of the backend DTOs. Key points the
UI relies on:

- `GET /api/books` and `GET /api/favorites` return a **Spring `Page<T>`**
  envelope (`content`, `totalElements`, `totalPages`, `number` is **0-based**, …).
- `GET /api/search` and `GET /api/recommendations` return a **bare array** of
  `BookSummary`, not a `Page`.
- Auth returns `{ accessToken, refreshToken, tokenType: "Bearer", expiresInSeconds }`.
- Errors may arrive in three shapes (custom `{ timestamp, status, error, message }`,
  an empty 401 body from the security layer, or Spring's default body);
  `lib/apiError.ts` normalizes all three.

## Authentication (current vs. planned)

Phase 1 ships only the auth **skeleton**. The token transport is deliberately
funnelled through `src/auth/tokenStore.ts`:

- **Now:** the access token is kept **in memory**; the refresh token is stored in
  `localStorage` and sent in the request body (matching the current backend).
- **Planned:** move the refresh token to an **HttpOnly + Secure + SameSite
  cookie** (set/read by the backend) and add CSRF protection. The Axios client
  already sets `withCredentials: true` and the backend already allows
  credentials, so that migration is localized to `tokenStore.ts` + the Axios
  interceptor.

## Internationalization

Lightweight, dependency-free EN/PT support (`src/i18n/`). English is the
default; a language toggle lives in the nav. Missing keys fall back to English,
then to the raw key.

## Roadmap

- **Phase 1 (this):** scaffold, design system, API layer, Home with sample data.
- **Phase 2:** US01–US04 — search, catalog list, filters, book detail (live API).
- **Phase 3:** US05–US11 — recommendations, auth, favorites.
- **Phase 4 (optional):** refresh-token → HttpOnly cookie + CSRF (backend + frontend).
