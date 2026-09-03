import LedgerSectionHeading from "../components/LedgerSectionHeading.jsx";

export default function Limitations() {
  return (
    <section id="zastrzezenia" style={{ padding: "48px 0" }}>
      <LedgerSectionHeading
        num="UWAGA"
        title="Czego ten wynik nie jest"
        kicker="Zawsze obecne"
      />
      <ul style={{ marginTop: 22, paddingLeft: 18, maxWidth: 820, lineHeight: 1.65 }}>
        <li>Nie jest wyceną księgową, prognozą, oszacowaniem przyczynowym ani obietnicą ROI.</li>
        <li>Nie jest pomiarem bezpieczeństwa psychologicznego. Suwak to szacunek własny.</li>
        <li>Model opiera się na publicznie dostępnych badaniach i jest kalibrowany na Ipsos Polska × FNP 2026 (n=1000). Żadnych licencjonowanych metodyk.</li>
        <li>Parametry bez bezpośredniej kalibracji empirycznej są w kodzie oznaczone jako założenia autorskie.</li>
        <li>Otwartość kodu czyni założenia inspekcjonowalnymi. Nie jest dowodem ich empirycznej trafności.</li>
        <li>Kalibracja dotyczy polskiego kontekstu kulturowego. Decyzje powyżej 500 tys. PLN powinny poprzedzić pilotaż na danych firmy.</li>
      </ul>
    </section>
  );
}
