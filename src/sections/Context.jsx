
const FACTS = [
  { value: "71%", body: "pracowników polskich zespołów nie czuje pełnego bezpieczeństwa psychologicznego." },
  { value: "42%", body: "mówi, że błędy bywają wykorzystywane przeciwko pracownikowi." },
  { value: "85% / 59%", body: "osób deklaruje stabilność zespołu, gdy bezpieczeństwo jest wysokie; gdy panuje strach, 59%." },
];

export default function Context() {
  return (
    <section id="kontekst" aria-labelledby="kontekst-title">
      <h3 id="kontekst-title">Polski kontekst: raport „Ile kosztuje milczenie?” (Fundacja Nowe Przestrzenie × Ipsos)</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24, marginTop: 16 }}>
        {FACTS.map((fact) => (
          <article key={fact.value}>
            <div className="num" style={{ fontSize: "var(--t-xl)", fontWeight: 600, lineHeight: 1.1 }}>{fact.value}</div>
            <p style={{ marginTop: 6 }}>{fact.body}</p>
          </article>
        ))}
      </div>
      <p className="field-hint" style={{ marginTop: 16, }}>
        Źródło: raport Fundacji Nowe Przestrzenie i Ipsos „Ile kosztuje milczenie? Niewidzialny podatek od braku bezpieczeństwa psychologicznego w polskim biznesie” (2026): badanie CAWI na 1000 osobach pracujących w zespołach co najmniej pięcioosobowych w sektorze prywatnym. Liczby w brzmieniu ze strony raportu i relacji prasowych; brzmienie pytań sprawdzimy w pełnym raporcie. To wyniki badania opinii, pokazane jako polski kontekst. Część liczb z raportu posłużyła jako wartości końcowe krzywych modelu (stabilność zespołu 59% i 85%, wypalenie 51%); tych wartości nie sprawdzono jeszcze w tabelach badania. Kwoty kalkulatora nie są skalibrowane na tym badaniu.
      </p>
    </section>
  );
}
