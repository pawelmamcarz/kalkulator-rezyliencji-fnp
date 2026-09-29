import { useState } from "react";
import LedgerSectionHeading from "../components/LedgerSectionHeading.jsx";
import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";

const IMAGE = "/images/safe-space-matrix.webp";

export default function SafeSpaceMatrix() {
  const [zoomed, setZoomed] = useState(false);
  const isMobile = useMediaQuery(MOBILE_QUERY);

  return (
    <section id="safe-space" style={{ padding: "48px 0" }}>
      <LedgerSectionHeading
        num="PROGRAM FNP"
        title="Macierz interwencji Safe Space"
        kicker="Działania dobierane po diagnozie"
      />
      <p style={{ maxWidth: 800, marginTop: 20, lineHeight: 1.6 }}>
        Macierz pokazuje dwa kroki programu: edukację dla całej organizacji oraz interwencje dopasowane do deficytów rozpoznanych w diagnozie. Są to przykłady działań, nie zalecenia wyliczone przez kalkulator.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "20px 0 14px" }}>
        <button
          type="button"
          className="fnp-btn"
          aria-controls="safe-space-image-frame"
          aria-expanded={zoomed}
          onClick={() => setZoomed((value) => !value)}
        >
          {zoomed ? "Dopasuj do strony" : "Powiększ macierz"}
        </button>
        <a className="fnp-btn ghost" href={IMAGE} target="_blank" rel="noopener noreferrer">
          Otwórz obraz osobno
        </a>
        <a className="fnp-btn ghost" href={IMAGE} download="macierz-safe-space.webp">
          Pobierz obraz
        </a>
      </div>
      <figure>
        <div
          id="safe-space-image-frame"
          tabIndex={0}
          role="region"
          aria-label="Macierz interwencji Safe Space, przewijany obraz"
          style={{
            overflow: "auto",
            maxHeight: zoomed ? "78vh" : "none",
            border: "1px solid var(--l-rule)",
            background: "#252525",
          }}
        >
          <img
            src={IMAGE}
            alt="Macierz interwencji programu Safe Space: pięć obszarów działania na poziomie kultury organizacyjnej, lidera i zespołu, z edukacją oraz interwencją po diagnozie."
            width="3078"
            height="1852"
            loading="lazy"
            decoding="async"
            style={{ display: "block", width: zoomed ? (isMobile ? 1800 : 2400) : "100%", maxWidth: "none", height: "auto" }}
          />
        </div>
        <figcaption style={{ color: "var(--l-mute)", fontSize: 14, marginTop: 10 }}>
          {zoomed ? "Przesuwaj obraz, aby przeczytać kolejne kolumny i wiersze." : "Powiększ obraz, aby przeczytać szczegóły macierzy."}
        </figcaption>
      </figure>
    </section>
  );
}
