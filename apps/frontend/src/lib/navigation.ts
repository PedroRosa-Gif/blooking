/**
 * Navigation helpers: where did the user come from, and what should "back"
 * say and do? Pure functions, so they can be tested without a router.
 */

/** Router `state` we attach to links that open a book, so the book page knows its origin. */
export interface FromState {
  /** Path + query of the page the user was on, e.g. "/search?q=dragons". */
  from?: string;
}

export type OriginKind = 'search' | 'catalog' | 'home' | 'book' | 'other';

/** Classify an origin path so the back button can name it. */
export function originKind(from: string | undefined): OriginKind {
  if (!from) return 'other';
  const path = from.split(/[?#]/)[0];
  if (path === '/search') return 'search';
  if (path === '/books') return 'catalog';
  if (/^\/books\/\d+/.test(path)) return 'book';
  if (path === '/') return 'home';
  return 'other';
}

/** i18n key for the back button label, given where the user came from. */
export function backLabelKey(kind: OriginKind): string {
  switch (kind) {
    case 'search':
      return 'back.search';
    case 'catalog':
      return 'back.catalog';
    case 'home':
      return 'back.home';
    case 'book':
      return 'back.book';
    default:
      return 'back.generic';
  }
}

/**
 * True when the app has an earlier history entry of its own to go back to.
 * React Router gives the very first entry of a session the key "default";
 * any later entry means the user navigated inside the app.
 */
export function hasInAppHistory(locationKey: string): boolean {
  return locationKey !== 'default';
}

/** Value to put in a Link's `state` so the destination knows where we came from. */
export function fromState(pathname: string, search: string): FromState {
  return { from: `${pathname}${search}` };
}

/** Narrow unknown router state to FromState without trusting its shape. */
export function readFromState(state: unknown): FromState {
  if (state && typeof state === 'object' && 'from' in state) {
    const from = (state as { from?: unknown }).from;
    if (typeof from === 'string' && from.startsWith('/')) return { from };
  }
  return {};
}
