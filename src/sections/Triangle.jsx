import LedgerSectionHeading from "../components/LedgerSectionHeading.jsx";
import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";

const STEPS = [
  {
    n: "01",
    title: "Kalkulator",
    body: "Prolog. Scenariusz: ile może wyciekać. Otwiera rozmowę liczbą.",
  },
  {
    n: "02",
    title: "Diagnoza FNP",
    body: "Badanie. Realny pomiar Twojej organizacji zamiast średniej krajowej. Diagnoza zawsze poprzedza działania.",
  },
  {
    n: "03",
    title: "Interwencje",
    body: "Terapia. Warsztaty komunikacyjne, informacyjne i behawioralne, dobrane do wyniku diagnozy.",
  },
];

export default function Triangle() {
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
        Ankieta Light (suwak) kwalifikuje do rozmowy, nie zastępuje pełnego badania.
        Firmom będącym już na etapie interwencji nie sprzedajemy kalkulatora.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
        <a className="fnp-btn" href="mailto:pawel@mamcarz.com?subject=Diagnoza%20FNP">
          Umów diagnozę FNP
        </a>
        <button type="button" className="fnp-btn ghost" onClick={() => window.print()}>
          Drukuj zaproszenie
        </button>
      </div>
    </section>
  );
}
