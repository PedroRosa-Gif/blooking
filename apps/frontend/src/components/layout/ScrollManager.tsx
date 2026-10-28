import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const STORAGE_KEY = 'blooking.scroll';
const MAX_ENTRIES = 80;
const RESTORE_TIMEOUT_MS = 1500;

/** Scroll positions by history entry key, mirrored to sessionStorage so a reload keeps them. */
const positions = new Map<string, number>(readStored());

function readStored(): Array<[string, number]> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Array<[string, number]>) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    const entries = [...positions.entries()].slice(-MAX_ENTRIES);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* storage unavailable: positions simply won't survive a reload */
  }
}

/**
 * Scroll behaviour for a client-routed app, matching what users expect:
 *  - new page (link click):   start at the top
 *  - back / forward:          return to where you were on that page
 *  - same-page hash (#id):    leave it to the browser
 *  - filter changes (replace): stay put
 *
 * The browser's own restoration cannot do this: on back it scrolls before React
 * has rendered the previous page, so it clamps to a short document. We take over
 * (`scrollRestoration = 'manual'`), remember each entry's position, and restore
 * it once the page is tall enough.
 *
 * Positions are saved on click and on popstate, i.e. at the moment of leaving,
 * not on every scroll event: the page change itself shrinks the document and
 * makes the browser fire a scroll event with a clamped, wrong value.
 */
export function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType();
  const keyRef = useRef(location.key);
  const lastPath = useRef(location.pathname);

  useEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';

    const save = () => {
      positions.set(keyRef.current, window.scrollY);
      persist();
    };
    // Capture phase: runs before the router handles the click and changes page.
    document.addEventListener('click', save, true);
    window.addEventListener('popstate', save, true);
    window.addEventListener('pagehide', save);
    return () => {
      document.removeEventListener('click', save, true);
      window.removeEventListener('popstate', save, true);
      window.removeEventListener('pagehide', save);
      history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    keyRef.current = location.key;
    const pathChanged = lastPath.current !== location.pathname;
    lastPath.current = location.pathname;

    // In-page anchor: let the browser jump to the element.
    if (location.hash) return;

    if (navType === 'POP') {
      const target = positions.get(location.key);
      if (target != null && target > 0) return restoreWhenTall(target);
      window.scrollTo(0, 0);
      return;
    }

    // PUSH to another page starts at the top. REPLACE (filters, ?q=) stays put.
    if (navType === 'PUSH' || pathChanged) window.scrollTo(0, 0);
  }, [location.key, location.pathname, location.hash, navType]);

  return null;
}

/**
 * Scroll to `target` as soon as the document is tall enough to reach it.
 * Content (cached list, images) may take a few frames to lay out, so we retry
 * until the timeout, then settle for the furthest reachable point. Any user
 * scroll input cancels it, so we never fight the user.
 */
function restoreWhenTall(target: number): () => void {
  let frame = 0;
  let cancelled = false;
  const start = performance.now();

  const stop = () => {
    cancelled = true;
    cancelAnimationFrame(frame);
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('keydown', stop);
  };
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('keydown', stop);

  const tick = () => {
    if (cancelled) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll >= target - 1 || performance.now() - start > RESTORE_TIMEOUT_MS) {
      window.scrollTo(0, Math.min(target, Math.max(0, maxScroll)));
      stop();
      return;
    }
    frame = requestAnimationFrame(tick);
  };
  tick();
  return stop;
}
