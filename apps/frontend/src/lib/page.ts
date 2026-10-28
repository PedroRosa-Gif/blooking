import type { Page, RawPage } from '@/types/api';

/**
 * Turns whatever page envelope the backend sent into the app's single `Page`
 * shape. Accepts the `via_dto` shape ({ content, page: {...} }) and the legacy
 * flat shape. Missing numbers fall back to safe values, so a surprise in the
 * payload degrades to "no more pages" instead of NaN page requests.
 */
export function normalizePage<T>(raw: RawPage<T>): Page<T> {
  const content = Array.isArray(raw.content) ? raw.content : [];
  const meta = raw.page ?? raw;

  const number = finiteOr(meta.number, 0);
  const size = finiteOr(meta.size, content.length);
  const totalElements = finiteOr(meta.totalElements, content.length);
  const totalPages = finiteOr(
    meta.totalPages,
    size > 0 ? Math.ceil(totalElements / size) : number + 1,
  );

  // Prefer the arithmetic over a `last` flag: it works for both shapes.
  const last = raw.last ?? number + 1 >= totalPages;

  return { content, number, size, totalElements, totalPages, last };
}

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
