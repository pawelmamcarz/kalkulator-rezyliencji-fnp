import { useEffect } from "react";

// Open every <details> that contains (or is) the element with this id,
// plus a <details> that is a direct child of it.
// Returns the element when something had to be opened, otherwise null.
export function openDetailsFor(hash, doc = document) {
  if (!hash || hash.length < 2) return null;
  let id;
  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }
  const target = doc.getElementById(id);
  if (!target) return null;
  let opened = false;
  // A section whose own content is collapsed (e.g. #jak-liczymy) opens too.
  const own = target.querySelector(":scope > details");
  if (own && !own.open) {
    own.open = true;
    opened = true;
  }
  for (let node = target; node; node = node.parentElement) {
    if (node.tagName === "DETAILS" && !node.open) {
      node.open = true;
      opened = true;
    }
  }
  return opened ? target : null;
}

/**
 * useOpenDetailsOnHash - opens collapsed sections when the address or an
 * in-page link points inside them. Runs only on load, on hashchange and on
 * clicks of same-page anchor links, so it never reopens a section the
 * visitor has just closed. SSR-safe: all DOM access happens in the effect.
 */
export default function useOpenDetailsOnHash() {
  useEffect(() => {
    const scrollTo = (target) => {
      if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    };
    const onHashChange = () => scrollTo(openDetailsFor(window.location.hash));
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      const link = event.target instanceof Element ? event.target.closest("a[href*='#']") : null;
      if (!link || link.origin !== window.location.origin || link.pathname !== window.location.pathname) return;
      // Opening before the default action lets the browser scroll to a now visible target.
      // Repeated clicks on the same hash do not fire hashchange, so scroll here too.
      const target = openDetailsFor(link.hash);
      if (target && link.hash === window.location.hash) scrollTo(target);
    };
    onHashChange();
    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick, true);
    };
  }, []);
}
