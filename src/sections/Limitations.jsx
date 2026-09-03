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
        <li>Nie jest wyceną księgową ani prognozą.</li>
        <li>Suwak nie mierzy bezpieczeństwa psychologicznego. To Twoja ocena klimatu: jedno pytanie, nie ankieta zespołu.</li>
        <li>Za wzorami stoją badania publiczne (m.in. Edmondson, Williamson, Van Dyne, Frazier). Przeliczenie na złote jest założeniem autorskim. Raport Ipsos × FNP 2026 daje polski kontekst; tabele źródłowe nie są jeszcze sprawdzone, więc nie mówimy o kalibracji.</li>
        <li>Kod jest otwarty, żeby dało się sprawdzić założenia. To nie znaczy, że liczby są trafne.</li>
        <li>Przy decyzjach powyżej 500 tys. zł warto zrobić pilotaż na danych firmy.</li>
      </ul>
    </section>
  );
}
