/**
 * Turns a raw dataset description into readable paragraphs.
 *
 * The descriptions come from Goodreads with the line breaks stripped, so they
 * arrive as one block with sentences glued together ("DEATH.THE HUNGER GAMES"),
 * broken ellipses (". . . ."), and sometimes a boilerplate note about the edition.
 * We repair what can be repaired safely and group sentences into short
 * paragraphs. Nothing is invented or reworded: only whitespace is added.
 */

export interface ParsedDescription {
  /** Edition boilerplate ("Librarian's note…"), shown apart and muted. */
  note: string | null;
  paragraphs: string[];
  /** Characters of real description (without the note). */
  length: number;
}

const ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'sr',
  'jr',
  'st',
  'mt',
  'vs',
  'etc',
  'inc',
  'ltd',
  'co',
  'no',
  'vol',
  'ed',
  'gen',
  'col',
  'capt',
  'lt',
  'sgt',
  'rev',
  'hon',
  'fr',
  'ca',
  'cf',
]);

/**
 * Leading edition boilerplate ("Librarian's note: ...", "Alternate cover
 * edition ISBN: ... (ISBN13: ...)", "...can be found here", "...ASIN B004...").
 * The dataset has many spellings, so instead of one regex per spelling we do two
 * simple, checkable steps:
 *
 *   1. START: the text opens with "librarian note" or "alternate cover".
 *   2. END:   the note stops at the earliest boundary inside a short window:
 *             - the word "here", the usual link text, optionally repeated
 *               ("here, here and here"), when it is a whole word or is glued
 *               to a capital ("hereThis");
 *             - an ISBN/ASIN identifier, plus an optional "(ISBN13: ...)";
 *             - or a full stop.
 *
 * A note is boilerplate, so it is short (MAX_NOTE_LENGTH) and the description
 * must continue after it. If either fails we leave the text alone: showing a
 * stray note is better than hiding the synopsis.
 */
const MAX_NOTE_LENGTH = 110;
const NOTE_START = /^(?:librarian'?s?\s+note|alternate[- ]cover)/i;
// Identifiers have exact shapes, which is what stops them from swallowing the
// first letters of a glued synopsis ("...9780679783268Since its success"):
//   ISBN-10: 9 digits + digit or X     ISBN-13: 13 digits (hyphens allowed)
//   ASIN:    "B" + 9 letters/digits
const ISBN_VALUE = String.raw`(?:\d[\d-]{8,15}[\dXx]|\d{9}[\dXx])`;
const ASIN_VALUE = String.raw`B[0-9A-Z]{9}`;
const ID = String.raw`(?:isbn\s*:?\s*${ISBN_VALUE}(?:\s*[/&]\s*${ISBN_VALUE})?(?:\s*\(isbn13:?\s*${ISBN_VALUE}\))?|asin\s*:?\s*${ASIN_VALUE})`;
// A bare number after "edition:" / "edition for" ("Alternate cover edition: 9780439709101").
const BARE_ISBN = String.raw`(?:edition|cover)s?\s*(?:of|for)?\s*:?\s*${ISBN_VALUE}`;
// "here" as a whole word, or glued to a capital/quote/digit that starts the body.
const HERE = String.raw`here(?:,?\s*here)*(?:\s+and\s+here)?`;

function findNoteEnd(text: string): number {
  const window = text.slice(0, MAX_NOTE_LENGTH + 40);
  const candidates: number[] = [];

  const id = new RegExp(ID, 'i').exec(window);
  if (id) candidates.push(id.index + id[0].length);
  const bare = new RegExp(BARE_ISBN, 'i').exec(window);
  if (bare) candidates.push(bare.index + bare[0].length);

  // "here" must be a whole word OR be followed by a capital/digit/quote (glued body).
  const hereRe = new RegExp(HERE, 'ig');
  let h: RegExpExecArray | null;
  while ((h = hereRe.exec(window))) {
    // Not the tail of a longer word: "There", "where", "adhere" are not link text.
    if (h.index > 0 && /[A-Za-z]/.test(window.charAt(h.index - 1))) continue;
    const after = window.charAt(h.index + h[0].length);
    const wholeWord = !/[A-Za-z]/.test(after);
    const gluedCapital = /[A-Z0-9"'\u201c(]/.test(after);
    if (wholeWord || gluedCapital) {
      candidates.push(h.index + h[0].length);
      break;
    }
  }

  const stop = window.indexOf('.');
  if (stop > 0) candidates.push(stop + 1);

  // A bare "here" with no other boundary: ignore it. Take the earliest real one.
  return candidates.length ? Math.min(...candidates) : -1;
}

function splitNote(text: string): { note: string | null; body: string } {
  if (!NOTE_START.test(text)) return { note: null, body: text };

  const end = findNoteEnd(text);
  if (end <= 0 || end > MAX_NOTE_LENGTH) return { note: null, body: text };

  // Swallow a trailing "(ISBN13: ...)" or ": 31-Jul-2007." tail that belongs to the note.
  let cut = end;
  const tail =
    /^\s*(?:\(isbn13:?\s*[\d-]+\)|(?:for this book\b[^.]{0,60}\.)|here\b\.?|:\s*[\w-]+\.?|[./,]\s*(?=[A-Z]))/i.exec(
      text.slice(cut),
    );
  if (tail && cut + tail[0].length <= MAX_NOTE_LENGTH) cut += tail[0].length;

  const note = text
    .slice(0, cut)
    .trim()
    .replace(/[\s:]+$/, '');
  const body = text
    .slice(cut)
    .replace(/^[\s.:,]+/, '')
    .trim();
  // The description must continue after the note.
  if (body.length < 40) return { note: null, body: text };
  return { note, body };
}

/** Add the spaces the source lost. Conservative: only after sentence punctuation. */
export function repairSpacing(text: string): string {
  return (
    text
      // ". . . ." / ". . ." -> a single ellipsis
      .replace(/(?:\s*\.\s){2,}\.?/g, '… ')
      // "end.Next" / "end!Next" / "end?Next". The word before the mark must have
      // 2+ letters (so initials like "J.R.R.Tolkien" and "U.S.A" are left alone)
      // and the word after must start a real word (capital + a lowercase or a
      // 2+ letter CAPS word such as "THE"), not a lone initial.
      .replace(
        /([A-Za-z\u00c0-\u00ff]{2,}|[0-9)\u201d"'])([.!?])(?=[A-Z\u00c0-\u00de][a-z\u00e0-\u00ff]|[A-Z\u00c0-\u00de]{2,})/g,
        '$1$2 ',
      )
      // closing quote then capital: He left.”She ... -> keep the quote, add the space
      .replace(/([.!?])([\u201d"])([A-Z\u00c0-\u00de])/g, '$1$2 $3')
      // ellipsis glued to the next word
      .replace(/…(?=[A-Za-z\u00c0-\u00ff])/g, '… ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** True when the period at `index` ends a sentence rather than an abbreviation or initial. */
function endsSentence(text: string, index: number): boolean {
  // Token just before the period.
  const before = text.slice(0, index);
  const token = before.match(/([A-Za-z\u00c0-\u00ff.]+)$/)?.[1] ?? '';
  const bare = token.replace(/\./g, '').toLowerCase();
  if (ABBREVIATIONS.has(bare)) return false;
  // Initials: "J.", "J.R.R.", "C. S." (one capital letter per segment).
  if (/^(?:[A-Z]\.)*[A-Z]$/.test(token)) return false;
  return true;
}

/** Split into sentences, keeping the terminal punctuation. */
export function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let start = 0;
  const re = /[.!?\u2026]+["\u201d')\]]*\s+(?=["\u201c'(\[]?[A-Z\u00c0-\u00de0-9])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const mark = m[0].search(/[.!?\u2026]/);
    const periodIndex =
      m.index + mark + (m[0].slice(mark).match(/^[.!?\u2026]+/)?.[0].length ?? 1) - 1;
    const isPeriod = text[periodIndex] === '.';
    if (isPeriod && !endsSentence(text, periodIndex)) continue;
    const end = m.index + m[0].length;
    sentences.push(text.slice(start, end).trim());
    start = end;
  }
  const tail = text.slice(start).trim();
  if (tail) sentences.push(tail);
  return sentences;
}

/**
 * Break a block that has no sentence punctuation (a table of contents or a
 * track list: "A -- B -- C", "X ; Y ; Z") at its separators, so it becomes
 * several short lines instead of one wall of text.
 */
export function splitListLike(block: string, target = 340): string[] {
  if (block.length <= target * 1.6) return [block];
  // Split AFTER each separator and keep it, so no character is changed or lost.
  // (No lookbehind: older Safari throws a SyntaxError on it, which would break
  // the whole module at load time.)
  const parts: string[] = [];
  const re = /(?:\s--|\s;|\s\u2014)\s+/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    const end = m.index + m[0].trimEnd().length;
    parts.push(block.slice(last, end));
    last = m.index + m[0].length;
  }
  parts.push(block.slice(last));
  if (parts.filter(Boolean).length < 4) return [block];
  const lines: string[] = [];
  let current = '';
  for (const part of parts) {
    if (current && (current + ' ' + part).length > target) {
      lines.push(current);
      current = part;
    } else {
      current = current ? `${current} ${part}` : part;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Group sentences into paragraphs of roughly `target` characters. */
export function groupParagraphs(sentences: string[], target = 340): string[] {
  const paragraphs: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (current && (current + ' ' + sentence).length > target) {
      paragraphs.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) paragraphs.push(current);
  return paragraphs;
}

/**
 * Last resort for a block that is still very long (text with no capital letters
 * to detect sentence starts, such as Arabic): cut it at spaces so no paragraph
 * exceeds ~`max` characters. Only whitespace positions are used, so no
 * character changes.
 */
export function capLength(block: string, max = 700): string[] {
  if (block.length <= max) return [block];
  const out: string[] = [];
  let rest = block;
  while (rest.length > max) {
    // Prefer the last sentence-ish break (. ! ? ، ؟) before the limit, else any space.
    const window = rest.slice(0, max);
    let cut = Math.max(
      window.lastIndexOf('. '),
      window.lastIndexOf('! '),
      window.lastIndexOf('? '),
      window.lastIndexOf('\u060c '),
      window.lastIndexOf('\u061f '),
    );
    if (cut < max * 0.5) cut = window.lastIndexOf(' ');
    if (cut <= 0) break; // one giant unbroken word: leave it
    out.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) out.push(rest);
  return out;
}

export function parseDescription(raw: string | null | undefined): ParsedDescription {
  const text = (raw ?? '').trim();
  if (!text) return { note: null, paragraphs: [], length: 0 };

  const { note, body } = splitNote(text);
  const repaired = repairSpacing(body);
  const paragraphs = groupParagraphs(splitSentences(repaired))
    .flatMap((p) => splitListLike(p))
    .flatMap((p) => capLength(p));
  return { note: note ? repairSpacing(note) : null, paragraphs, length: repaired.length };
}

/** First paragraph's first sentence, for a short lead line. */
export function leadSentence(parsed: ParsedDescription): string | null {
  const first = parsed.paragraphs[0];
  if (!first) return null;
  return splitSentences(first)[0] ?? null;
}

/** Rough reading time in whole minutes (~200 wpm), at least 1. */
export function readingMinutes(length: number): number {
  const words = length / 5.5;
  return Math.max(1, Math.round(words / 200));
}
