
const PATH = [
  {
    name: "Sygnał",
    text: "Kalkulator pokazuje scenariusz skali kosztów milczenia. Nie wskazuje przyczyny ani gotowego działania.",
  },
  {
    name: "Diagnoza",
    text: "Diagnoza własna lub prowadzona przez FNP sprawdza pięć warunków zabierania głosu na poziomie kultury organizacyjnej, liderów i zespołów.",
  },
  {
    name: "Działanie",
    text: "Najpierw wspólna edukacja, następnie interwencje w miejscach, w których diagnoza wykazała deficyt, z ustalonym sposobem oceny zmiany.",
  },
];

const AREAS = [
  {
    name: "Docenianie",
    question: "Czy wkład ludzi jest zauważany i sprawiedliwie uznawany?",
    example: "Rytuały doceniania i regularny feedback. Po diagnozie także korekta mechanizmów uznania tam, gdzie ich brakuje.",
  },
  {
    name: "Otwarte mówienie",
    question: "Czy można zgłosić problem, a organizacja pokazuje, co zrobiła ze zgłoszeniem?",
    example: "Aktywne słuchanie i przegląd kanałów zgłaszania. Po diagnozie praca nad wykrytą barierą oraz pokazanie, co stało się ze zgłoszeniami.",
  },
  {
    name: "Prawo do błędu",
    question: "Czy błąd uruchamia uczenie się, czy szukanie winnego?",
    example: "Premortem i omówienia błędów bez obwiniania. Po diagnozie zmiana procedur, które skłaniają do ukrywania błędów.",
  },
  {
    name: "Przynależność i inkluzja",
    question: "Kto zabiera głos, a czyja perspektywa regularnie znika?",
    example: "Uważność na uprzedzenia i różne perspektywy. Po diagnozie audyt grup pomijanych w rozmowie oraz działania w zespołach, które doświadczają wykluczenia.",
  },
  {
    name: "Autonomia i zaufanie",
    question: "Czy ludzie mogą decydować, czy każda decyzja wymaga zgody?",
    example: "Delegowanie i praca oparta na wynikach. Po diagnozie ograniczenie nadmiernych zatwierdzeń i mikrozarządzania.",
  },
];

// Body of the collapsed "Model Safe Space" block inside "Co dalej".
export default function SafeSpaceConcept() {

  return (
    <div style={{ marginTop: 16 }}>
      <p>
        Wynik kalkulatora otwiera rozmowę o skali problemu. Model Safe Space porządkuje pytania o to, co utrudnia ludziom zabieranie głosu i na jakim poziomie warto działać. Sam wynik nie dobiera interwencji.
      </p>

      <ol style={{ listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginTop: 20 }}>
        {PATH.map((step, index) => (
          <li key={step.name}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{index + 1}. {step.name}</div>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>

      <h3 style={{ fontSize: "var(--t-l)", margin: "28px 0 8px" }}>Pięć warunków bezpiecznej pracy</h3>
      <p className="muted" style={{ marginBottom: 16 }}>
        To obszary diagnozy i programu Safe Space. Są odrębne od pięciu kategorii kosztów w wyniku.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
        {AREAS.map((area) => (
          <article key={area.name} style={{ paddingLeft: 16, borderLeft: "4px solid var(--safe)" }}>
            <h4 style={{ marginBottom: 4 }}>{area.name}</h4>
            <p style={{ marginBottom: 6 }}>{area.question}</p>
            <p className="muted">{area.example}</p>
          </article>
        ))}
      </div>
      <p style={{ marginTop: 20 }}>
        Najpierw edukacja buduje wspólny język. Potem zmianę dobiera się do wyniku diagnozy, na poziomie organizacji, lidera lub zespołu. Przykłady pochodzą z programu Safe Space, a ich skuteczność w danej firmie wymaga osobnej oceny.
      </p>
    </div>
  );
}
