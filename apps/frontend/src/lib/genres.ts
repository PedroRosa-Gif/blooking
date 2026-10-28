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
