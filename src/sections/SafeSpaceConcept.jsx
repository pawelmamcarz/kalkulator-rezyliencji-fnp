import LedgerSectionHeading from "../components/LedgerSectionHeading.jsx";
import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";

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
    text: "Najpierw wspólna edukacja, następnie interwencje w miejscach, w których diagnoza wykazała deficyt.",
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

export default function SafeSpaceConcept() {
  const isMobile = useMediaQuery(MOBILE_QUERY);

  return (
    <section id="safe-space" style={{ padding: "48px 0" }}>
      <LedgerSectionHeading
        num="PROGRAM FNP"
        title="Jak działa Safe Space"
        kicker="Od sygnału do dobranych działań"
      />
      <p style={{ maxWidth: 800, marginTop: 20, lineHeight: 1.6 }}>
        Wynik kalkulatora otwiera rozmowę o skali problemu. Model Safe Space porządkuje pytania o to, co utrudnia ludziom zabieranie głosu i na jakim poziomie warto działać. Sam wynik nie dobiera interwencji.
      </p>

      <ol style={{ listStyle: "none", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 0, marginTop: 28, borderTop: "2px solid var(--l-rule)", borderBottom: "1px solid var(--l-rule)" }}>
        {PATH.map((step, index) => (
          <li key={step.name} style={{ padding: "18px 20px 22px", borderLeft: !isMobile && index > 0 ? "1px solid var(--l-grid)" : "none", borderTop: isMobile && index > 0 ? "1px solid var(--l-grid)" : "none" }}>
            <div style={{ fontFamily: "var(--mono)", color: "var(--l-stamp)", fontSize: 12, marginBottom: 8 }}>{index + 1}. {step.name}</div>
            <p style={{ lineHeight: 1.5 }}>{step.text}</p>
          </li>
        ))}
      </ol>

      <h3 style={{ fontFamily: "var(--mono)", fontSize: isMobile ? 21 : 26, margin: "34px 0 8px" }}>Pięć warunków bezpiecznej pracy</h3>
      <p style={{ maxWidth: 800, color: "var(--l-mute)", marginBottom: 16 }}>
        To obszary diagnozy i programu Safe Space. Są odrębne od pięciu kategorii kosztów pokazywanych wyżej.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 14 }}>
        {AREAS.map((area) => (
          <article key={area.name} style={{ background: "#fff", border: "1px solid var(--l-rule)", borderLeft: "4px solid var(--l-stamp)", padding: isMobile ? 16 : 20 }}>
            <h4 style={{ fontFamily: "var(--mono)", fontSize: 18, lineHeight: 1.3, marginBottom: 8 }}>{area.name}</h4>
            <p style={{ fontWeight: 600, marginBottom: 10 }}>{area.question}</p>
            <p style={{ color: "var(--l-ink-2)", lineHeight: 1.5 }}>{area.example}</p>
          </article>
        ))}
      </div>
      <p style={{ maxWidth: 820, borderLeft: "3px solid var(--l-accent)", paddingLeft: 16, marginTop: 20, lineHeight: 1.55 }}>
        Krok 1 buduje wspólny język przez edukację. Krok 2 dobiera zmianę do wyniku diagnozy, na poziomie organizacji, lidera lub zespołu. Przykłady pochodzą z programu Safe Space, a ich skuteczność w danej firmie wymaga osobnej oceny.
      </p>
    </section>
  );
}
