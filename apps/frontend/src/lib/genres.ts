/**
 * Genres offered in the catalog filter. The dataset has many free-form genres;
 * this is a curated shortlist of common ones (matching the dataset's own
 * spelling) so the filter stays tidy. Selection is multi (UI), but only the
 * first is sent to the backend for now — see BookFilters / project learning.
 */
export const FILTER_GENRES = [
  'Fantasy',
  'Classics',
  'Romance',
  'Historical Fiction',
  'Science Fiction',
  'Dystopia',
  'Young Adult',
  'Fiction',
  'Nonfiction',
  'Mystery',
  'Thriller',
  'Horror',
  'Poetry',
] as const;

/** Sort options surfaced in the catalog (value is the Spring sort expression). */
export const SORT_OPTIONS = [
  { value: 'num_ratings,desc', labelKey: 'sort.popular' },
  { value: 'rating,desc', labelKey: 'sort.rating' },
  { value: 'publish_year,desc', labelKey: 'sort.newest' },
  { value: 'publish_year,asc', labelKey: 'sort.oldest' },
  { value: 'title,asc', labelKey: 'sort.title' },
] as const;

export const DEFAULT_SORT = SORT_OPTIONS[0].value;

/**
 * Genre labels that describe a format, an audience or a shelf tag rather than
 * the story, so a "more like this" shelf built on them would be too broad to
 * be useful (e.g. "Fiction" is on 88% of the catalog).
 */
const GENERIC_GENRES = new Set([
  'Fiction',
  'Nonfiction',
  'Novels',
  'Novel',
  'Literature',
  'Audiobook',
  'Audio',
  'Adult',
  'Adult Fiction',
  'Contemporary',
  'Classics',
  'Young Adult',
  'Teen',
  'Childrens',
  'Historical',
  'Books',
  'Read For School',
  'School',
  'Own',
  'Owned',
  'Kindle',
  'Ebooks',
  'Favorites',
  'Default',
  'Short Stories',
  'Fantasy',
]);

/**
 * The genre to use for a "more like this" shelf: the first listed genre that is
 * specific enough to be meaningful. Falls back to the first genre, or null.
 */
export function pickRelatedGenre(genres: string[]): string | null {
  const specific = genres.slice(0, 8).find((g) => !GENERIC_GENRES.has(g));
  return specific ?? genres[0] ?? null;
}
