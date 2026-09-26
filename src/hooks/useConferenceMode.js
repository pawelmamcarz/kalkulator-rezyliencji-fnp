import { useSyncExternalStore } from "react";

export const CONFERENCE_PARAM = "konferencja";
// `?konferencja=0` and similar switch the mode off instead of on.
const OFF_VALUES = new Set(["0", "false", "nie", "off"]);

function subscribe(onChange) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function getSnapshot() {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.has(CONFERENCE_PARAM)) return false;
    return !OFF_VALUES.has(params.get(CONFERENCE_PARAM).trim().toLowerCase());
  } catch {
    return false;
  }
}

const getServerSnapshot = () => false;

/**
 * useConferenceMode - true, gdy adres zawiera parametr `?konferencja`
 * (sama obecność wystarcza; wartości 0, false, nie, off wyłączają tryb). SSR-safe: prerender i pierwsze renderowanie
 * przy hydratacji zwracają false, potem hook odczytuje adres w przeglądarce.
 *
 * @returns {boolean}
 */
export default function useConferenceMode() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
