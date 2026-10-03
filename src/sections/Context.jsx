import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";

const FACTS = [
  { value: "71%", body: "pracowników polskich zespołów nie czuje pełnego bezpieczeństwa psychologicznego." },
  { value: "42%", body: "mówi, że błędy bywają wykorzystywane przeciwko pracownikowi." },
  { value: "85% / 59%", body: "osób deklaruje stabilność zespołu, gdy bezpieczeństwo jest wysokie; gdy panuje strach, 59%." },
];

export default function Context() {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  return (
    <section id="kontekst" aria-labelledby="kontekst-title">
      <h3 id="kontekst-title">Polski kontekst: raport „Ile kosztuje milczenie?” (Fundacja Nowe Przestrzenie × Ipsos)</h3>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16, marginTop: 16 }}>
        {FACTS.map((fact) => (
          <article key={fact.value} style={{ border: "1px solid var(--l-rule)", background: "#fff", padding: 20 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 32, fontWeight: 700 }}>{fact.value}</div>
            <p style={{ fontFamily: "var(--serif)", lineHeight: 1.5, marginTop: 8 }}>{fact.body}</p>
          </article>
        ))}
      </div>
      <p className="field-hint" style={{ marginTop: 16, maxWidth: 820 }}>
        Źródło: raport Fundacji Nowe Przestrzenie i Ipsos „Ile kosztuje milczenie? Niewidzialny podatek od braku bezpieczeństwa psychologicznego w polskim biznesie” (2026): badanie CAWI na 1000 osobach pracujących w zespołach co najmniej pięcioosobowych w sektorze prywatnym. Liczby w brzmieniu ze strony raportu i relacji prasowych; brzmienie pytań sprawdzimy w pełnym raporcie. To wyniki badania opinii, pokazane jako polski kontekst. Kalkulator nie przelicza tych odsetków na złote i nie jest na nich skalibrowany.
      </p>
    </section>
  );
}
