
const PATH = [
  {
    name: "Wynik",
    text: "Kalkulator pokazuje scenariusz kosztów dla podanych danych i oceny klimatu.",
  },
  {
    name: "Diagnoza",
    text: "Samodzielnie lub z FNP sprawdzasz, co utrudnia zabieranie głosu: zasady w firmie, zachowanie przełożonych czy relacje w zespole.",
  },
  {
    name: "Działanie",
    text: "Zaczynacie od edukacji. Na podstawie diagnozy ustalacie, co zmienić i jak sprawdzicie efekty.",
  },
];

const AREAS = [
  {
    name: "Docenianie",
    question: "Czy pracownicy wiedzą, za co są doceniani i czy zasady są sprawiedliwe?",
    example: "Regularna rozmowa o wkładzie pracowników i zmiana zasad doceniania pracy tam, gdzie są niejasne lub niesprawiedliwe.",
  },
  {
    name: "Otwarte mówienie",
    question: "Czy można zgłosić problem, a organizacja pokazuje, co zrobiła ze zgłoszeniem?",
    example: "Sprawdzenie, jak pracownicy zgłaszają problemy i czy dowiadują się, co zrobiono ze zgłoszeniem.",
  },
  {
    name: "Prawo do błędu",
    question: "Czy po błędzie szuka się rozwiązania, czy winnego?",
    example: "Omówienie, co doprowadziło do błędu i co trzeba zmienić, żeby się nie powtórzył.",
  },
  {
    name: "Przynależność i inkluzja",
    question: "Czy każdy ma okazję zabrać głos i jest wysłuchany?",
    example: "Sprawdzenie, kogo pomija się w rozmowach i przy podejmowaniu decyzji.",
  },
  {
    name: "Autonomia i zaufanie",
    question: "Czy ludzie mogą decydować, czy każda decyzja wymaga zgody?",
    example: "Ustalenie, które decyzje pracownik może podjąć sam, a które wymagają zgody przełożonego.",
  },
];

// Body of the collapsed "Model Safe Space" block inside "Co dalej".
export default function SafeSpaceConcept() {

  return (
    <div style={{ marginTop: 16 }}>
      <p>
        Diagnoza pomaga ustalić, co utrudnia pracownikom zgłaszanie problemów. Sam wynik kalkulatora nie wskazuje, jakie działania wybrać.
      </p>

      <ol style={{ listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginTop: 20 }}>
        {PATH.map((step, index) => (
          <li key={step.name}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{index + 1}. {step.name}</div>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>

      <h3 style={{ fontSize: "var(--t-l)", margin: "28px 0 8px" }}>Pięć warunków zabierania głosu</h3>
      <p className="muted" style={{ marginBottom: 16 }}>
        Te obszary dotyczą diagnozy Safe Space. Pięć kategorii w wyniku kalkulatora dotyczy kosztów.
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
        Przykłady pochodzą z programu Safe Space. Ich skuteczność trzeba sprawdzić w danej firmie.
      </p>
    </div>
  );
}
