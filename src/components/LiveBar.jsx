import { useEffect, useRef, useState } from "react";
import { money } from "../format.js";

const ANNOUNCE_DELAY = 900;

// Compact fixed bar with the headline amount, shown while the company-data
// section is on screen and neither the page title nor the result headline is, so the amount is
// visible while the climate changes. Not rendered when inputs are invalid
// (the result block then asks to fix the fields) and hidden in print.
// Purely visual (aria-hidden); a separate polite live region announces the
// settled amount once a drag or typing pauses.
export default function LiveBar({ total, safety }) {
  const [show, setShow] = useState(false);
  const [spoken, setSpoken] = useState("");
  const first = useRef(true);
  const valid = Boolean(total);

  useEffect(() => {
    const targets = { form: document.getElementById("dane"), title: document.querySelector("h1"), headline: document.getElementById("wynik-kwota") };
    if (!targets.form || typeof IntersectionObserver === "undefined") return undefined;
    const seen = { form: false, title: true, headline: false };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const key = Object.keys(targets).find((name) => targets[name] === entry.target);
        seen[key] = entry.isIntersecting;
      }
      setShow(seen.form && !seen.title && !seen.headline);
    });
    for (const element of Object.values(targets)) if (element) observer.observe(element);
    return () => observer.disconnect();
  }, [valid]);

  const message = total
    ? `Roczny scenariusz kosztów: ${money(total.base)}, zakres od ${money(total.low)} do ${money(total.high)}.`
    : "Uzupełnij lub popraw oznaczone pola, aby zobaczyć wynik.";
  useEffect(() => {
    // The amount on load is already on the page; announce only changes.
    if (first.current) { first.current = false; return undefined; }
    const timer = setTimeout(() => setSpoken(message), ANNOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{spoken}</p>
      {total && (
        <div className={`live-bar${show ? " on" : ""}`} aria-hidden="true" data-testid="live-bar">
          <span className="micro live-bar-label">Rocznie przy {safety}/100</span>
          <span className="live-bar-amount">{money(total.base)}</span>
          <span className="live-bar-range">od {money(total.low)} do {money(total.high)}</span>
        </div>
      )}
    </>
  );
}
