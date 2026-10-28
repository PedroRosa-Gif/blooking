/**
 * Recent searches, kept in localStorage so the empty search page can offer them.
 * Stored data is untrusted (users, extensions and old versions can all write
 * there), so reads are validated and never throw.
 */

const KEY = 'blooking.recentSearches';
const MAX = 8;
const MAX_LENGTH = 120;

function clean(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > 0 && text.length <= MAX_LENGTH ? text : null;
}

export function readRecent(storage: Pick<Storage, 'getItem'> = localStorage): string[] {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of parsed) {
      const text = clean(item);
      if (text && !seen.has(text.toLowerCase())) {
        seen.add(text.toLowerCase());
        out.push(text);
      }
      if (out.length >= MAX) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** New list with `query` first; case-insensitive duplicates removed, capped at MAX. */
export function withQuery(list: string[], query: string): string[] {
  const text = clean(query);
  if (!text) return list;
  return [text, ...list.filter((q) => q.toLowerCase() !== text.toLowerCase())].slice(0, MAX);
}

export function saveRecent(
  query: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): string[] {
  const next = withQuery(readRecent(storage), query);
  try {
    storage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or unavailable: the list just won't persist */
  }
  return next;
}

export function clearRecent(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  try {
    storage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
