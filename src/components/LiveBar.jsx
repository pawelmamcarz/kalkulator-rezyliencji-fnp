import { useEffect, useRef, useState } from "react";
import Disc from "./Disc.jsx";
import { discShare } from "../disc.js";
import { money, moneyRange } from "../format.js";

const ANNOUNCE_DELAY = 900;

// Compact form of the disc, pinned to the top while the climate question or
// the firm data is on screen and the full disc is not, so the amount stays
// visible while the visitor chooses. Not rendered when inputs are invalid
// (the result then asks to fix the fields); hidden in print. Purely visual
// (aria-hidden); a separate polite live region announces the settled amount
// once a drag or typing pauses.
export default function LiveBar({ total, worst }) {
  const [show, setShow] = useState(false);
  const [spoken, setSpoken] = useState("");
  const first = useRef(true);
  const valid = Boolean(total);

  useEffect(() => {
    const targets = { climate: document.getElementById("klimat"), form: document.getElementById("dane"), headline: document.querySelector("#wynik-kwota .disc-amount") };
    if (!targets.climate || typeof IntersectionObserver === "undefined") return undefined;
    const seen = { climate: false, form: false, headline: true };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const key = Object.keys(targets).find((name) => targets[name] === entry.target);
        seen[key] = entry.isIntersecting;
      }
      setShow((seen.climate || seen.form) && !seen.headline);
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
          <Disc share={discShare(total.base, worst)} />
          <span className="live-bar-amount num">{money(total.base)}</span>
          <span className="live-bar-range num">{moneyRange(total.low, total.high)}</span>
        </div>
      )}
    </>
  );
}
