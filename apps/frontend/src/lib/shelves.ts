/**
 * Home genre shelves. Each entry maps a stable `id` (used for the DOM id, the
 * i18n keys `shelf.<id>.title`/`.subtitle`, and footer anchors) to the dataset
 * genre name sent to `GET /api/books?genre=`.
 */
export interface ShelfDef {
  id: string;
  genre: string;
}

export const SHELF_DEFS: ShelfDef[] = [
  { id: 'fantasy', genre: 'Fantasy' },
  { id: 'classics', genre: 'Classics' },
  { id: 'romance', genre: 'Romance' },
  { id: 'historical', genre: 'Historical Fiction' },
  { id: 'scifi', genre: 'Science Fiction' },
];
