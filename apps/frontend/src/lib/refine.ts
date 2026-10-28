import type { BookSummary } from '@/types/api';

/**
 * Client-side refinement of search results (filter, sort, facets).
 *
 * `/api/search` takes only a query and a limit, so the refinement UI works on
 * the results already returned. That keeps every tweak instant and avoids extra
 * search calls (each one costs an embedding and emits a `searched` event).
 */

export type SortKey = 'relevance' | 'rating' | 'popular' | 'newest' | 'oldest' | 'title';

export const SORT_KEYS: SortKey[] = ['relevance', 'rating', 'popular', 'newest', 'oldest', 'title'];

export interface Refinement {
  /** Match books having ANY of these genres. Empty = no genre filter. */
  genres: string[];
  /** Decade starts, e.g. 1990 means 1990-1999. Empty = any year. */
  decades: number[];
  /** Minimum rating (0 = any). */
  minRating: number;
  sort: SortKey;
}

export const EMPTY_REFINEMENT: Refinement = {
  genres: [],
  decades: [],
  minRating: 0,
  sort: 'relevance',
};

export const RATING_STEPS = [0, 3.5, 4, 4.5] as const;

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

/** Number of refinements currently applied (sort does not count as a filter). */
export function activeCount(r: Refinement): number {
  return r.genres.length + r.decades.length + (r.minRating > 0 ? 1 : 0);
}

export function isRefined(r: Refinement): boolean {
  return activeCount(r) > 0 || r.sort !== 'relevance';
}

function matches(book: BookSummary, r: Refinement): boolean {
  if (r.genres.length > 0 && !book.genres.some((g) => r.genres.includes(g))) return false;
  if (r.decades.length > 0) {
    if (book.publishYear == null) return false;
    if (!r.decades.includes(decadeOf(book.publishYear))) return false;
  }
  if (r.minRating > 0 && (book.rating == null || book.rating < r.minRating)) return false;
  return true;
}

const byNumberDesc =
  (pick: (b: BookSummary) => number | null) => (a: BookSummary, b: BookSummary) =>
    (pick(b) ?? -Infinity) - (pick(a) ?? -Infinity);

/**
 * Filter then sort. `relevance` keeps the server's order (the RRF ranking), so
 * it never reorders. Sorts are stable and put books with a missing value last.
 */
export function refine(books: BookSummary[], r: Refinement): BookSummary[] {
  const kept = books.filter((b) => matches(b, r));
  switch (r.sort) {
    case 'rating':
      return [...kept].sort(byNumberDesc((b) => b.rating));
    case 'popular':
      return [...kept].sort(byNumberDesc((b) => b.numRatings));
    case 'newest':
      return [...kept].sort(byNumberDesc((b) => b.publishYear));
    case 'oldest':
      return [...kept].sort((a, b) => (a.publishYear ?? Infinity) - (b.publishYear ?? Infinity));
    case 'title':
      return [...kept].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
      );
    default:
      return kept;
  }
}

export interface Facet<T> {
  value: T;
  count: number;
}

/**
 * Facet counts for a filter group, computed with every OTHER group applied but
 * not this one. That is what people expect: the number next to "Fantasy" is how
 * many books you would have if you added it, not how many you already have.
 */
export function genreFacets(books: BookSummary[], r: Refinement, limit = 12): Facet<string>[] {
  const pool = books.filter((b) => matches(b, { ...r, genres: [] }));
  const counts = new Map<string, number>();
  for (const b of pool) for (const g of b.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
  const byCount = (a: Facet<string>, b: Facet<string>) =>
    b.count - a.count || a.value.localeCompare(b.value);
  const all = [...counts.entries()].map(([value, count]) => ({ value, count })).sort(byCount);

  // Selected genres are always shown, even when they would drop to zero, so the
  // user can always unselect them. Only the unselected ones are cut to `limit`.
  const selected = r.genres.map((value) => ({ value, count: counts.get(value) ?? 0 }));
  const rest = all.filter((f) => !r.genres.includes(f.value));
  return [...selected, ...rest.slice(0, Math.max(0, limit - selected.length))].sort(byCount);
}

export function decadeFacets(books: BookSummary[], r: Refinement): Facet<number>[] {
  const pool = books.filter((b) => matches(b, { ...r, decades: [] }));
  const counts = new Map<number, number>();
  for (const b of pool) {
    if (b.publishYear == null) continue;
    const d = decadeOf(b.publishYear);
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  for (const d of r.decades) if (!counts.has(d)) counts.set(d, 0);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.value - a.value);
}

/** Toggle a value in an array without mutating it. */
export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/* ---- URL (de)serialization, so refinements survive back/forward and sharing ---- */

export function toSearchParams(r: Refinement, into: URLSearchParams): URLSearchParams {
  for (const key of ['genre', 'decade', 'rating', 'sort']) into.delete(key);
  r.genres.forEach((g) => into.append('genre', g));
  r.decades.forEach((d) => into.append('decade', String(d)));
  if (r.minRating > 0) into.set('rating', String(r.minRating));
  if (r.sort !== 'relevance') into.set('sort', r.sort);
  return into;
}

export function fromSearchParams(p: URLSearchParams): Refinement {
  const decades = p
    .getAll('decade')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 1000 && n <= 2999 && n % 10 === 0);
  const rating = Number(p.get('rating'));
  const sort = p.get('sort') as SortKey | null;
  return {
    genres: p.getAll('genre').filter(Boolean),
    decades,
    minRating: (RATING_STEPS as readonly number[]).includes(rating) ? rating : 0,
    sort: sort && SORT_KEYS.includes(sort) ? sort : 'relevance',
  };
}

/**
 * Facets worth showing. A value that applies to EVERY result cannot narrow
 * anything (in practice "Fiction" is on ~90% of books), so it is hidden unless
 * the user already selected it. With only one result there is nothing to
 * refine at all.
 */
export function usefulFacets<T>(
  facets: Facet<T>[],
  total: number,
  selected: readonly T[],
): Facet<T>[] {
  if (total <= 1) return facets.filter((f) => selected.includes(f.value));
  return facets.filter((f) => selected.includes(f.value) || f.count < total);
}
