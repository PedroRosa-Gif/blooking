/**
 * Parses the free-text award strings of the dataset into something that can be
 * grouped and sorted.
 *
 * Real examples:
 *   "Georgia Peach Book Award (2009)"                       -> won
 *   "Locus Award Nominee for Best Young Adult Book (2009)"  -> nominee
 *   "Library of Virginia Literary Award Nominee for Fiction (finalist) (2012)"
 *   "BTBA Best Translated Book Award Nominee for Fiction shortlist (2008)"
 *   "Premio a la mejor traducción del ruso al Español: ..."  (no year)
 *
 * The dataset only says "Nominee"/"Finalist"/"Shortlist"/"Longlist" when an
 * award was NOT won; an award with no such word is a win. Only three entries
 * in the whole dataset say "Winner" explicitly.
 *
 * Nothing is rewritten for display except removing the status word from the
 * award name (it is shown as a badge instead), so `raw` is always kept.
 */

export type AwardStatus = 'won' | 'nominated';

export interface ParsedAward {
  raw: string;
  /** Award name without the status word, e.g. "Locus Award". */
  name: string;
  /** Category, when the text has one ("... for Best Novel"). */
  category: string | null;
  year: number | null;
  status: AwardStatus;
  /** "Finalist", "Shortlist", ... when more specific than plain nominee. */
  detail: string | null;
}

const NOMINATED_WORDS =
  /\b(nominees?|nominated|finalists?|short-?lists?(?:ed)?|long-?lists?(?:ed)?)\b/i;
/** Same words, global, for removing every occurrence ("Finalist Nominee" has two). */
const NOMINATED_WORDS_ALL = new RegExp(NOMINATED_WORDS.source, 'gi');
const DETAIL_WORDS = /\b(finalist|short-?list(?:ed)?|long-?list(?:ed)?)\b/i;

/** "(2012)" at the very end, with nothing after it. */
const TRAILING_YEAR = /\s*\((\d{4})\)\s*$/;

function titleCaseWord(word: string): string {
  const w = word.toLowerCase().replace('-', '');
  if (w.startsWith('short')) return 'Shortlist';
  if (w.startsWith('long')) return 'Longlist';
  return w.charAt(0).toUpperCase() + w.slice(1);
}

export function parseAward(raw: string): ParsedAward {
  let text = raw.trim();

  let year: number | null = null;
  const y = text.match(TRAILING_YEAR);
  if (y) {
    const parsed = Number(y[1]);
    // Sanity range: guards against "(0000)" or a page count in parentheses.
    if (parsed >= 1400 && parsed <= 2100) {
      year = parsed;
      text = text.slice(0, y.index).trim();
    }
  }

  const status: AwardStatus = NOMINATED_WORDS.test(text) ? 'nominated' : 'won';
  const detailMatch = text.match(DETAIL_WORDS);
  const detail = detailMatch ? titleCaseWord(detailMatch[1]) : null;

  // Split "<award> for <category>" on the first " for ".
  let name = text;
  let category: string | null = null;
  const forIdx = text.search(/\sfor\s/i);
  if (forIdx > 0) {
    name = text.slice(0, forIdx).trim();
    category =
      text
        .slice(forIdx)
        .replace(/^\sfor\s/i, '')
        .trim() || null;
  }

  // Remove the status word from the name (it becomes a badge).
  name = name
    .replace(NOMINATED_WORDS_ALL, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s,;:-]+$/, '')
    .trim();
  if (!name) name = raw.trim();

  // Parenthetical status in the category, e.g. "Fiction (finalist)" -> "Fiction".
  if (category) {
    category =
      category
        .replace(/\s*\((?:nominee|nominated|finalist|short-?list(?:ed)?|long-?list(?:ed)?)\)/gi, '')
        .replace(NOMINATED_WORDS_ALL, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/[\s,;:-]+$/, '')
        .trim() || null;
  }

  return { raw, name, category, year, status, detail };
}

export interface AwardSummary {
  total: number;
  won: number;
  nominated: number;
  firstYear: number | null;
  lastYear: number | null;
}

/** Order: newest first, wins before nominations in the same year, then by name. */
export function sortAwards(awards: ParsedAward[]): ParsedAward[] {
  return [...awards].sort((a, b) => {
    const ya = a.year ?? -Infinity;
    const yb = b.year ?? -Infinity;
    if (ya !== yb) return yb - ya;
    if (a.status !== b.status) return a.status === 'won' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function summarize(awards: ParsedAward[]): AwardSummary {
  const years = awards.map((a) => a.year).filter((y): y is number => y != null);
  return {
    total: awards.length,
    won: awards.filter((a) => a.status === 'won').length,
    nominated: awards.filter((a) => a.status === 'nominated').length,
    firstYear: years.length ? Math.min(...years) : null,
    lastYear: years.length ? Math.max(...years) : null,
  };
}

/** Parse, sort and split a book's raw award list into the two groups the UI shows. */
export function organizeAwards(rawAwards: string[]) {
  const all = sortAwards(rawAwards.filter((a) => a && a.trim()).map(parseAward));
  return {
    all,
    won: all.filter((a) => a.status === 'won'),
    nominated: all.filter((a) => a.status === 'nominated'),
    summary: summarize(all),
  };
}
