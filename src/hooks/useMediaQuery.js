import { useCallback, useSyncExternalStore } from "react";

// Shared mobile breakpoint for the whole app. Import this constant instead of
// retyping the literal so the cutoff can be changed in one place.
export const MOBILE_QUERY = "(max-width: 720px)";

/**
 * useMediaQuery - reactive media-query hook.
 *
 * Replaces the one-shot `window.innerWidth >= N` checks that were captured at
 * module load and never updated on resize. Uses `matchMedia` + `change` event
 * so it reacts to resize, orientation change, and DevTools device emulation.
 *
 * SSR-safe: returns `false` on the server (first render) and updates once the
 * browser is available.
 *
 * @param {string} query - a media query string, e.g. "(min-width: 900px)"
 * @returns {boolean}
 */
export default function useMediaQuery(query) {
  const subscribe = useCallback((onChange) => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return () => {};
    }
    const mql = window.matchMedia(query);
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    // Safari < 14 fallback
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [query]);

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
