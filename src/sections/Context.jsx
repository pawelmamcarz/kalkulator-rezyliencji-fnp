import LedgerSectionHeading from "../components/LedgerSectionHeading.jsx";
import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";

const FACTS = [
  { value: "71%", body: "pracowników polskich zespołów ma obniżone poczucie bezpieczeństwa psychologicznego i w swoich zespołach milczy." },
  { value: "68%", body: "pracowników w bezpiecznym środowisku czuje przestrzeń do wdrażania nowych pomysłów." },
  { value: "73%", body: "osób w bezpiecznym środowisku uważa, że warto proponować coś nowego." },
];

export default function Context() {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  return (
    <section id="kontekst" style={{ padding: "48px 0" }}>
      <LedgerSectionHeading num="KONTEKST" title="Ile kosztuje milczenie?" kicker="Raport Fundacja Nowe Przestrzenie × Ipsos" />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16, marginTop: 28 }}>
        {FACTS.map((fact) => (
          <article key={fact.value} style={{ border: "1px solid var(--l-rule)", background: "#fff", padding: 20 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 36, fontWeight: 700 }}>{fact.value}</div>
            <p style={{ fontFamily: "var(--serif)", lineHeight: 1.5, marginTop: 8 }}>{fact.body}</p>
          </article>
        ))}
      </div>
      <p className="field-hint" style={{ marginTop: 16, maxWidth: 820 }}>
        Źródło: raport Fundacji Nowe Przestrzenie i Ipsos „Ile kosztuje milczenie? Niewidzialny podatek od braku bezpieczeństwa psychologicznego w polskim biznesie” (2026), w brzmieniu z relacji prasowych; brzmienie pytań i metodę badania sprawdzimy w pełnym raporcie. To wyniki badania opinii, pokazane jako polski kontekst. Kalkulator nie przelicza tych odsetków na złote i nie jest na nich skalibrowany.
      </p>
    </section>
  );
}
