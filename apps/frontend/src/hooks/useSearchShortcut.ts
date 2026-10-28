import { useEffect } from 'react';

/**
 * Should a "/" keypress open search? Not when the user is typing somewhere,
 * when a modifier is held (Ctrl/Cmd+/ belongs to the browser or other tools),
 * or when another handler already used the key.
 *
 * Pure, so it can be tested without a DOM.
 */
export function shouldOpenSearch(e: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
  targetTag: string | null;
  targetEditable: boolean;
}): boolean {
  if (e.key !== '/') return false;
  if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return false;
  const tag = (e.targetTag ?? '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false;
  if (e.targetEditable) return false;
  return true;
}

/** Calls `onOpen` when the user presses "/" outside of a text field. */
export function useSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      const ok = shouldOpenSearch({
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
        defaultPrevented: e.defaultPrevented,
        targetTag: target?.tagName ?? null,
        targetEditable: Boolean(target?.isContentEditable),
      });
      if (!ok) return;
      e.preventDefault(); // do not type the "/" into the field we are about to focus
      onOpen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpen]);
}
