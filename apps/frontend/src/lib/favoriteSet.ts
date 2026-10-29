/**
 * Pure helpers for the client-side set of favorited book IDs. Kept separate from
 * the React Query hooks so the add/remove logic can be unit-tested.
 *
 * The set is stored as a readonly array in the query cache (React Query does
 * structural sharing on arrays, and a Set is awkward to serialize). Toggling
 * returns a NEW array, never mutating the input.
 */

export function hasFavorite(ids: readonly number[] | undefined, bookId: number): boolean {
  return ids?.includes(bookId) ?? false;
}

export function addId(ids: readonly number[], bookId: number): number[] {
  return ids.includes(bookId) ? [...ids] : [...ids, bookId];
}

export function removeId(ids: readonly number[], bookId: number): number[] {
  return ids.filter((id) => id !== bookId);
}

export function toggleId(ids: readonly number[], bookId: number): number[] {
  return ids.includes(bookId) ? removeId(ids, bookId) : addId(ids, bookId);
}
