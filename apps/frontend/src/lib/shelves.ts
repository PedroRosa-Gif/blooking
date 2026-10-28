import type { BookSummary } from '@/types/api';

/**
 * Genre shelves for the Home page.
 *
 * Each shelf matches a book when ANY of its `genres` appears in the book's
 * genre list (names are the dataset's own). Shelf copy lives in the i18n files
 * under `shelf.<id>.title` / `shelf.<id>.subtitle`.
 *
 * Today this groups sample data on the client. In Phase 2 the same shelf
 * definitions can drive one `GET /api/books?genre=` call per shelf.
 */
export interface ShelfDef {
  id: string;
  genres: string[];
}

export const SHELF_DEFS: ShelfDef[] = [
  { id: 'fantasy', genres: ['Fantasy'] },
  { id: 'classics', genres: ['Classics'] },
  { id: 'romance', genres: ['Romance'] },
  { id: 'historical', genres: ['Historical Fiction'] },
  { id: 'scifi', genres: ['Science Fiction', 'Dystopia'] },
];

export interface Shelf {
  def: ShelfDef;
  books: BookSummary[];
}

/** Group books into shelves, most-rated first; hide shelves that are too thin. */
export function buildShelves(books: BookSummary[], minItems = 3): Shelf[] {
  return SHELF_DEFS.map((def) => ({
    def,
    books: books
      .filter((b) => b.genres.some((g) => def.genres.includes(g)))
      .sort((a, b) => (b.numRatings ?? 0) - (a.numRatings ?? 0)),
  })).filter((shelf) => shelf.books.length >= minItems);
}
