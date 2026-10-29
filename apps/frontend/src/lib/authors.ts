/**
 * Author-field helpers.
 *
 * The dataset's author field lists everyone credited, with roles in
 * parentheses and a "Goodreads Author" tag, e.g.
 *   "J.K. Rowling, Mary GrandPré (Illustrator)"
 *   "Kathy Reichs (Goodreads Author), Brendan Reichs (Goodreads Author)"
 * The first name is the primary author.
 */

/** Primary author without role tags. "" when the field is empty. */
export function primaryAuthor(field: string | null | undefined): string {
  if (!field) return '';
  const first = field.split(',')[0] ?? '';
  return first
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Same person? Compare primary authors ignoring case and surrounding whitespace. */
export function samePrimaryAuthor(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const pa = primaryAuthor(a).toLowerCase();
  const pb = primaryAuthor(b).toLowerCase();
  return pa !== '' && pa === pb;
}

/**
 * Credits for display: the author line without the "Goodreads Author" tag,
 * which is platform noise to readers. Other roles (Translator, Illustrator...)
 * are kept since they are real credits.
 */
export function displayAuthors(field: string | null | undefined): string {
  if (!field) return '';
  return field
    .replace(/\s*\(goodreads author\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .trim();
}
