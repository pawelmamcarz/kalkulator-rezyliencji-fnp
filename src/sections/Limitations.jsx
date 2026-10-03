export default function Limitations() {
  return (
    <section id="zastrzezenia" aria-labelledby="zastrzezenia-title">
      <h3 id="zastrzezenia-title">Jak interpretować wynik</h3>
      <ul style={{ paddingLeft: 18, maxWidth: 820, lineHeight: 1.65 }}>
        <li>Wynik nie jest wyceną księgową, prognozą, oszacowaniem przyczynowym ani obietnicą zwrotu z działań. Nie ustala, jaka część rzeczywistych kosztów wynika z milczenia.</li>
        <li>Kwota zależy od etatów, płacy, rotacji i klimatu. Przychód służy do obliczenia procentu, a koszty do porównania z marżą.</li>
        <li>To nadwyżka względem modelowego klimatu 100/100, po korektach i zsumowaniu trzech obszarów. Kwota główna to wariant bazowy. Zakres (P10–P90) obejmuje środkowe 80% symulowanych kosztów. Nie jest przedziałem ufności z badania ani dolną i górną granicą możliwej straty.</li>
        <li>Porównanie z różnicą przychodów i kosztów pokazuje skalę. Kwoty nie należy ponownie odejmować od zysku.</li>
        <li>Suwak nie mierzy bezpieczeństwa psychologicznego. To Twoja ocena klimatu: jedno pytanie, nie ankieta zespołu. Ocenę warto porównać z doświadczeniami pracowników, w tym z obawą przed konsekwencjami zgłoszenia. <a href="#efekt-mrozenia">Przeczytaj o efekcie mrożenia.</a></li>
        <li>Za wzorami stoją badania publiczne (m.in. Edmondson, Williamson, Van Dyne, Frazier). Przeliczenie na złote jest założeniem autorskim. Raport Ipsos × FNP 2026 daje polski kontekst; tabele źródłowe nie są jeszcze sprawdzone, więc nie mówimy o kalibracji.</li>
        <li>Kod jest otwarty, żeby dało się sprawdzić założenia. To nie znaczy, że liczby są trafne.</li>
        <li>Przed decyzją o wydatkach sprawdź założenia na danych firmy, różnice między zespołami i wrażliwość wyniku. Próg 5% dla przykładu jest warunkiem projektowym, nie limitem wyniku dla każdej organizacji.</li>
      </ul>
    </section>
  );
}
