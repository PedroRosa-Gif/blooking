# Blooking — Frontend

Web UI for book discovery, hybrid search and personalized recommendations.
Talks to the [Blooking backend](../backend) REST API.

> **Status:** Phase 4 — **complete**. All user stories (US01–US11) run against
> the live backend: search, catalog and book detail, plus register/login/logout,
> favorites and personalized recommendations. The backend must be running for
> data to appear. The refresh-token → HttpOnly cookie + CSRF migration is done
> (the refresh token is no longer kept in the browser).

## Tech Stack

- **React 18** + **TypeScript** + **Vite 5**
- **Tailwind CSS v4** (via `@tailwindcss/vite`, design tokens in `src/styles/index.css`)
- **React Router 6** — routing
- **TanStack Query v5** (React Query) — server state / caching
- **Axios** — HTTP client

## Prerequisites

- Node.js **20+** (the repo is developed on Node 22)
- The backend running on `http://localhost:8080` for live data (see
  [`apps/backend/README.md`](../backend/README.md)). From Phase 2 on, the UI
  needs it — book data comes from the API, not from sample data.

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
    ├── hooks/              # useReveal, useInfiniteScroll, useCatalogParams,
    │                       # useActiveSection, useSearchShortcut
    ├── i18n/               # lightweight EN/PT translations + provider
    ├── components/
    │   ├── ui/             # LogoMark, BrandMark, Button, Tag, Card, Icon, Spinner,
    │   │                   # BookCard(+Skeleton), BookGrid, BookShelf, StateView, BackLink
    │   ├── book/           # GenreShelf, ConstellationFacts, Description, AwardsSection,
    │   │                   # SectionNav, RelatedShelves, ChipRow
    │   ├── search/         # FiltersPanel, ResultsToolbar, ResultRow
    │   ├── catalog/        # FilterBar
    │   ├── visual/         # SkyCanvas + Starfield (realistic night sky)
    │   └── layout/         # AnnouncementBar, SiteHeader, SiteFooter, Section, AppLayout,
    │                       # ScrollManager, LanguageSwitcher, ThemeToggle
    ├── lib/                # page, navigation, refine, description, awards, authors,
    │                       # recentSearches, bookSections, genres, shelves, cn
    ├── pages/              # Home, Catalog, Search, BookDetail, NotFound
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
- Auth returns `{ accessToken, tokenType: "Bearer", expiresInSeconds }` in the
  body; the **refresh token is set as an `HttpOnly` cookie**, not returned in the
  body. The server also sets a JS-readable `XSRF-TOKEN` cookie whose value must
  be echoed in the `X-XSRF-TOKEN` header on mutating requests (CSRF).
- Errors may arrive in three shapes (custom `{ timestamp, status, error, message }`,
  an empty 401 body from the security layer, or Spring's default body);
  `lib/apiError.ts` normalizes all three.

## Routes & data

| Route        | Screen                | Endpoint                               |
| :----------- | :-------------------- | :------------------------------------- |
| `/`          | Home                  | `GET /api/books?genre=` (one per shelf) + one decorative `GET /api/search` preview per page load |
| `/search?q=` | **Search** (US01)     | `GET /api/search?q=&limit=50`, refined client-side |
| `/books`     | **Browse** (US02/US03)| `GET /api/books` (infinite scroll)     |
| `/books/:id` | Book detail (US04)    | `GET /api/books/{id}` + `GET /api/books` for "more by author / in genre" |

### Search vs. Browse

There used to be two text searches that behaved differently (the catalog's box was
a plain `ILIKE` on title/author, `/search` was the hybrid semantic + keyword
engine). They are now separate on purpose:

- **Search** is the only place to type words. Natural language, English or
  Portuguese. Results can be refined by genre, decade and minimum rating, sorted,
  and shown as a grid or a list. The query and every refinement live in the URL.
- **Browse** is for structured filtering (genre, author, sort) over the whole
  catalog, with infinite scroll. It links to Search for free text, and an old
  `/books?q=` link is redirected to `/search?q=`.

The backend's `/api/search` takes only `q` and `limit` (max 50) and cannot filter,
so refinement runs on the returned results. That keeps every tweak instant and
avoids extra searches (each one costs an embedding and records a `searched`
event). The UI says so ("Showing the 50 best matches"). Server-side filters are a
backend follow-up.

### Things that are easy to get wrong

- **Pagination shape.** The backend serializes pages as `{ content, page: {...} }`
  (`serialization-mode: via_dto`), not the older flat shape. `lib/page.ts`
  normalizes both; read pages only through `normalizePage`.
- **Events.** `GET /api/books/{id}` records a `viewed` event and `GET /api/search`
  a `searched` event. Do not prefetch book details, search as you type, or run
  decorative searches on every visit. Related-book shelves use the list endpoint,
  which records nothing.
- **Going back.** "Back" steps through history and names the page it returns to.
  `ScrollManager` restores each page's scroll position (the browser cannot, because
  it scrolls before React has rendered the previous page). Positions are saved at
  the moment of leaving, not on every scroll event, because the page change itself
  shrinks the document and fires a misleading scroll event.
- **Regex portability.** Avoid lookbehind and inline modifiers (`(?-i:...)`) in
  frontend code: older Safari throws at module load, which would take down the
  whole page that imports the module.

### Book detail

The page has a sticky in-page navigation (About, Awards, Characters, More by
author, Similar) that highlights the section being read and only lists sections
the book actually has. Dataset text is cleaned up for reading, without ever
rewriting it:

- **Description** (`lib/description.ts`): descriptions arrive with line breaks
  stripped ("DEATH.THE HUNGER GAMES"). Spacing is repaired, sentences are grouped
  into short paragraphs, the first sentence is a lead, long text collapses behind
  "Read more", and edition boilerplate ("Librarian's note...") is set apart.
  Checked against all 2,984 descriptions: no characters lost or changed.
- **Awards** (`lib/awards.ts`): grouped into Won and Nominated, newest first,
  collapsed after six rows (one book has 41). Checked against all 5,169 award
  strings.
- **Authors** (`lib/authors.ts`): the "(Goodreads Author)" tag is hidden; real
  credits (Translator, Illustrator) are kept.

- Genre filter is multi-select in the UI, but the backend accepts a single
  `genre`, so only the first is sent (see `toBookParams` in `api/books.ts`).
  A backend change to accept several genres is tracked.

## Authentication & account (Phase 3)

Real auth now (US06–US08): `AuthContext` calls `/api/auth/*`, keeps the access
token in memory only, and on load restores a session via the `HttpOnly` refresh
cookie (a spinner guards protected routes until that resolves). Login/register
redirect back to a validated `?from=` (open redirects rejected). The nav shows
Login/Sign up when signed out and a user menu (Favorites, For you, Log out) when
signed in.

- **Token transport is cookie-based for the refresh token** (`HttpOnly` +
  `Secure` + `SameSite` cookie, set by the backend and invisible to JS); only
  the short-lived access token is held in memory. The Axios client sends
  `withCredentials` and echoes the `XSRF-TOKEN` cookie in the `X-XSRF-TOKEN`
  header on mutating requests (CSRF double-submit).
- **401 → single-flight refresh.** A 401 on a protected call triggers one
  `/api/auth/refresh`; concurrent 401s share that single refresh (the backend
  rotates the refresh token, so parallel refreshes would invalidate each other),
  then the original requests replay. `/refresh` and `/logout` opt out via
  `skipAuthRefresh`. If refresh fails, the session is cleared.

## Favorites & recommendations (Phase 3)

- **Favorites (US09–US11):** a heart toggle on cards and the book page, with an
  optimistic update of a cached set of favorited IDs (rolled back on error). The
  backend endpoints are idempotent, so a double click is harmless. `/favorites`
  lists saved books (infinite scroll). Signed out, the heart routes to login.
- **Recommendations (US05):** a "For you" shelf on the Home page (signed-in only)
  and a full `/recommendations` page. The backend never returns an empty list
  (popularity cold-start).

> **Backend follow-up (tracked):** no response says whether a book is favorited,
> so the client fetches the favorite IDs after login and caches them. An
> `isFavorited` flag on book responses, or a `GET /api/favorites/ids` endpoint,
> would remove that. Also: `/api/search` can't filter server-side (refinement is
> client-side on the top 50), and the genre filter is multi-select in the UI but
> only the first genre reaches the backend.

## Internationalization

Lightweight, dependency-free EN/PT support (`src/i18n/`, 242 keys each, kept at
parity). English is the default; a language toggle lives in the nav. Missing keys
fall back to English, then to the raw key.

## Roadmap

- **Phase 1:** scaffold, design system, API layer.
- **Phase 2:** US01–US04 — search, catalog + filters, book detail.
- **Phase 3:** US05–US11 — auth, favorites, recommendations.
- **Phase 4:** refresh-token → HttpOnly cookie + CSRF (backend + frontend).
