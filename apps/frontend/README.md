# Blooking — Frontend
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
├── styles_plans/           # design reference docs (design_v1, design_v2 — see below)
└── src/
    ├── main.tsx            # providers: Theme → QueryClient → I18n → Auth → Router
    ├── App.tsx             # route table
    ├── styles/index.css    # Tailwind v4 @theme + semantic theme tokens (dark/light)
    ├── types/api.ts        # TS mirror of the backend contract (Page<T>, BookSummary, …)
    ├── lib/
    │   ├── axios.ts        # Axios instance (withCredentials, Bearer interceptor)
    │   ├── apiError.ts     # normalize the backend's error shapes
    │   └── queryClient.ts
    ├── api/                # endpoint fns + React Query hooks + query keys
    ├── auth/               # tokenStore + AuthContext (skeleton; wired in Phase 3)
    ├── theme/              # ThemeProvider (dark default) + useTheme
    ├── hooks/useReveal.ts  # reveal-on-scroll (IntersectionObserver)
    ├── i18n/               # lightweight EN/PT translations + provider
    ├── mocks/books.ts      # sample books extracted from books_sample.csv
    ├── components/
    │   ├── ui/             # OwlLogo, BrandMark, Button, Tag, Card, Icon, BookCard, BookShelf
    │   ├── visual/         # SkyCanvas + Starfield (realistic night sky)
    │   └── layout/         # AnnouncementBar, SiteHeader, SiteFooter, Section, AppLayout,
    │                       # LanguageSwitcher, ThemeToggle
    ├── lib/shelves.ts      # genre shelf definitions + grouping
    └── pages/              # HomePage, NotFoundPage
```

## Design system — "Nightjar"

A **dark-first, nocturnal** theme built around the Blooking brand: a night owl
with a magnifier (search). The default canvas is a **night sky**: near-black at
the zenith, a deep blue at the horizon, with a realistic star field (tiny
sub-pixel stars in spectral colors, a Milky Way band, a few bright stars with
diffraction spikes, an occasional shooting star). The single accent is a warm
**amber** (`#e8b059`), like an owl's eyes under a reading lamp.

**Type:** one family, two cuts. **Geist** for all UI and headlines, **Geist
Mono** for eyebrows, counts, stats and code. Sizes come from a fixed scale
(`text-caption` 12, `text-body-sm` 14, `text-body` 16, `text-lead` 18,
`text-title` 24, `text-headline` 48, `text-display` 72). Icons are one set:
outlined, 1.5px stroke, 16px (20px only in large controls).

**Layout language:** full-bleed bands that alternate between open sky and flat
tonal bands whose edges dissolve into the sky (the Apple pattern), cover-first
book shelves that scroll horizontally, a bento grid for the product story, and
a console-style header and footer.

The reference docs in [`styles_plans/`](./styles_plans) inform it (lower version
number = higher priority): `design_v1` for the quiet-frame structure and card
language, `design_v2` for the sky-as-canvas scroll narrative, `design_v3` for
the header (announcement strip, bar darker than the page, hairline, pill
buttons), mono labels and recessed code fields. None is used literally; the
project's own direction (owl brand, amber accent, night palette) takes
precedence.

> **Tailwind v4 gotcha:** do not write `text-[var(--x)]` for a font size. It is
> ambiguous with text color and resolves as color, so the size is silently
> ignored. Use the named utilities above, or `text-[length:var(--x)]`.

## Theming (dark / light)

- **Dark is the default.** `ThemeProvider` resolves the initial theme from a
  stored choice, else the OS preference (falling back to dark), and sets
  `data-theme` on `<html>`. An inline script in `index.html` applies it before
  first paint to avoid a flash.
- A **moon/sun toggle** (header and footer) switches themes; the choice persists
  in `localStorage`. Stars are shown in the dark theme only.
- Semantic tokens (`--canvas`, `--band`, `--card`, `--fg`, `--accent`, …) live in
  `src/styles/index.css` and are exposed as Tailwind utilities (`bg-canvas`,
  `text-fg`, `border-line`, `text-accent`). Flipping themes only swaps that
  variable block.
- Motion (star twinkle, parallax, shooting stars, scroll reveals) is disabled
  under `prefers-reduced-motion`.

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
