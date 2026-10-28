import type { BookDetail } from '@/types/api';

export interface BookSectionDef {
  id: string;
  labelKey: string;
}

/**
 * Which in-page sections a book has, in page order. The "More by author" and
 * "More in genre" shelves are included only once their data has loaded and is
 * non-empty (`hasMoreByAuthor` / `hasMoreInGenre`), so the nav never points at
 * a section that is not rendered.
 */
export function bookSections(
  book: Pick<BookDetail, 'description' | 'awards' | 'characters'>,
  extra: { hasMoreByAuthor: boolean; hasMoreInGenre: boolean },
): BookSectionDef[] {
  const sections: BookSectionDef[] = [{ id: 'about', labelKey: 'detail.nav.about' }];
  if (book.awards.length > 0) sections.push({ id: 'awards', labelKey: 'detail.nav.awards' });
  if (book.characters.length > 0) {
    sections.push({ id: 'characters', labelKey: 'detail.nav.characters' });
  }
  if (extra.hasMoreByAuthor) sections.push({ id: 'more-author', labelKey: 'detail.nav.author' });
  if (extra.hasMoreInGenre) sections.push({ id: 'more-genre', labelKey: 'detail.nav.similar' });
  return sections;
}
