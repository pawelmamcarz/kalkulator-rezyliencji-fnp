import LedgerSectionHeading from "../components/LedgerSectionHeading.jsx";
import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";

const STEPS = [
  {
    n: "01",
    title: "Kalkulator",
    body: "Porównanie scenariuszy przy jawnych założeniach. Pomaga określić pytania do dalszego badania.",
  },
  {
    n: "02",
    title: "Diagnoza FNP",
    body: "Badanie doświadczeń pracowników i warunków zabierania głosu. Sprawdzenie różnic między zespołami oraz danych organizacji.",
  },
  {
    n: "03",
    title: "Interwencje",
    body: "Działania dobrane po diagnozie, z ustalonym sposobem oceny zmiany. Sam wynik kalkulatora nie określa ich rodzaju ani skuteczności.",
  },
];

export default function Triangle({ ready }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  return (
    <section id="dalej" style={{ padding: "48px 0" }}>
      <LedgerSectionHeading
        num="KROK 3"
        title="Od liczby do planu"
        kicker="Kalkulator nie zastępuje diagnozy"
      />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16, marginTop: 28 }}>
        {STEPS.map((step) => (
          <article key={step.n} style={{ border: "1px solid var(--l-rule)", background: "#fff", padding: 20 }}>
            <div className="micro">{step.n}</div>
            <h3 style={{ fontFamily: "var(--mono)", fontSize: 18, textTransform: "uppercase", margin: "8px 0 10px" }}>{step.title}</h3>
            <p style={{ fontFamily: "var(--serif)", lineHeight: 1.5 }}>{step.body}</p>
          </article>
        ))}
      </div>
      <p style={{ fontFamily: "var(--serif)", marginTop: 20, maxWidth: 760, lineHeight: 1.55 }}>
        Napisz, jeśli chcesz omówić założenia lub zakres diagnozy FNP. Link otwiera Twój program pocztowy, bez automatycznego dołączania danych z kalkulatora.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
        <a className="fnp-btn" href="mailto:pawel@mamcarz.com?subject=Diagnoza%20FNP">
          Napisz w sprawie diagnozy FNP
        </a>
        <button type="button" className="fnp-btn ghost" disabled={!ready} onClick={() => window.print()}>
          Drukuj wynik / zapisz PDF
        </button>
      </div>
    </section>
  );
}
