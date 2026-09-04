import LedgerSectionHeading from "../components/LedgerSectionHeading.jsx";

export default function Limitations() {
  return (
    <section id="zastrzezenia" style={{ padding: "48px 0" }}>
      <LedgerSectionHeading
        num="UWAGA"
        title="Jak interpretować wynik"
        kicker="Ograniczenia"
      />
      <ul style={{ marginTop: 22, paddingLeft: 18, maxWidth: 820, lineHeight: 1.65 }}>
        <li>Wynik nie jest wyceną księgową, prognozą, oszacowaniem przyczynowym ani obietnicą zwrotu z działań. Nie ustala, jaka część rzeczywistych kosztów wynika z milczenia.</li>
        <li>Suwak nie mierzy bezpieczeństwa psychologicznego. To Twoja ocena klimatu: jedno pytanie, nie ankieta zespołu.</li>
        <li>Za wzorami stoją badania publiczne (m.in. Edmondson, Williamson, Van Dyne, Frazier). Przeliczenie na złote jest założeniem autorskim. Raport Ipsos × FNP 2026 daje polski kontekst; tabele źródłowe nie są jeszcze sprawdzone, więc nie mówimy o kalibracji.</li>
        <li>Kod jest otwarty, żeby dało się sprawdzić założenia. To nie znaczy, że liczby są trafne.</li>
        <li>Przed decyzją o wydatkach sprawdź założenia na danych firmy, różnice między zespołami i wrażliwość wyniku. Próg 5% dla przykładu jest warunkiem projektowym, nie limitem wyniku dla każdej organizacji.</li>
      </ul>
    </section>
  );
}
