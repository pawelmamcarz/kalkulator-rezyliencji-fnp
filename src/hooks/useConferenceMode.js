import { useSyncExternalStore } from "react";

export const CONFERENCE_PARAM = "konferencja";

function subscribe(onChange) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function getSnapshot() {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).has(CONFERENCE_PARAM);
  } catch {
    return false;
  }
}

const getServerSnapshot = () => false;

/**
 * useConferenceMode - true, gdy adres zawiera parametr `?konferencja`
 * (sama obecność wystarcza). SSR-safe: prerender i pierwsze renderowanie
 * przy hydratacji zwracają false, potem hook odczytuje adres w przeglądarce.
 *
 * @returns {boolean}
 */
export default function useConferenceMode() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
