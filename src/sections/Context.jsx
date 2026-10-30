
const FACTS = [
  { value: "71%", body: "badanych znalazło się w trzech niższych kategoriach bezpieczeństwa: bardzo niskiej, niskiej lub obniżonej." },
  { value: "42%", body: "badanych uważa, że w ich zespole błąd może zostać wykorzystany przeciw osobie, która go popełniła." },
  { value: "85% / 59%", body: "badanych deklaruje stabilność zespołu odpowiednio w grupie o wysokim i niskim bezpieczeństwie. To nie jest zmierzona stopa rotacji." },
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
        Źródło: raport Fundacji Nowe Przestrzenie i Ipsos „Ile kosztuje milczenie?” (2026), strony 7, 12, 14, 16 i 24. Badanie CAWI przeprowadzono w październiku 2025 r. wśród 1000 osób w wieku 18–65 lat, pracujących w zespołach co najmniej pięcioosobowych i z co najmniej średnim wykształceniem technicznym. Próba obejmowała określone rodzaje pracy i wykluczała m.in. administrację państwową; nie opisuje wszystkich pracujących w Polsce. Na wykresie 71% stanowią trzy niższe kategorie, 15% poziom umiarkowany, a 14% wysoki. Kwoty kalkulatora nie są skalibrowane na tym badaniu.
      </p>
    </section>
  );
}
