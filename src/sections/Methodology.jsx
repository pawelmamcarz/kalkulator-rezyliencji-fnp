import { FNP_PROBLEM_DIST } from "../fnpModel.js";
import { CALIBRATION_MODES, K_SIGMOID_DEFAULT_MULT, TURNOVER_CLIMATE_WEIGHT } from "../logic/constants.js";

const number = (value) => value.toLocaleString("pl-PL");
const fnpK = number(CALIBRATION_MODES.conservative.overrides.K_SIGMOID_MULT);
const problemLabels = { trivial: "Drobne", medium: "Średnie", major: "Poważne", critical: "Krytyczne" };

export default function Methodology() {
  return (
    <section id="metodologia" aria-labelledby="metodologia-title">
      <h3 id="metodologia-title">Założenia autora i badania: co wiemy, co przyjmujemy</h3>
      <p><strong>Prior to założenie przyjęte przed sprawdzeniem modelu na danych danej firmy.</strong> W tym kalkulatorze oznacza wartość startową lub regułę przeliczenia, a nie wynik estymacji bayesowskiej. Badania pomagają określić mechanizm i kierunek zależności. Nie wyznaczają automatycznie kosztu w złotych.</p>
      <p>Wartości wybrano do ostrożnego scenariusza: ograniczono częstość najpoważniejszych zdarzeń, spłaszczono reakcję modelu na klimat i wyłączono z sumy obszary o słabszym uzasadnieniu. Nie ma danych, które dowodziłyby, że dokładnie te współczynniki są właściwe dla każdej firmy. Warunek wyniku do 5% przychodu dla przykładowej organizacji jest kontrolą skali przyjętą w projekcie, nie ustaleniem badawczym.</p>

      <h4>Jak dane stają się kwotą</h4>
      <ol>
        <li>Klimat 0–100 jest przekształcany przez łagodne krzywe w modelowe wskaźniki, np. obawy przed błędami i stabilności zespołu. To nie są zmierzone odsetki pracowników.</li>
        <li>Wskaźniki łączą się z etatami i roczną płacą albo z częstością i kosztem zdarzeń.</li>
        <li>Od kosztu każdego obszaru odejmowany jest jego koszt przy klimacie 100/100. Ujemne różnice są zerowane. Punkt 100 to odniesienie matematyczne, nie obietnica organizacji bez kosztów.</li>
        <li>Model stosuje autorskie korekty nakładania się kosztów, powiązań między zjawiskami i rodzajów milczenia. Sumuje tylko rotację, błędy i wypalenie.</li>
      </ol>

      <details open>
        <summary>Najważniejsze priory: wartości, powody i dane do zmiany</summary>
        <dl className="prior-list">
          <dt>Reakcja na klimat: mnożnik stromości {fnpK}</dt>
          <dd>Zmniejsza gwałtowność reakcji na jeden punkt suwaka. Wartość {fnpK} jest wyborem autora, nie pomiarem: domyślny mnożnik silnika ({number(K_SIGMOID_DEFAULT_MULT)}) ustalono kiedyś pod docelowe sumy z rozprawy autora, których poprawiony silnik już nie odtwarza, a wariant ostrożny obniża go o kolejne 25%. Mnożnik działa tylko na krzywe wskaźników zachowań, nie na krzywe hierarchii i nadzoru. Przy {fnpK} model korzysta tylko ze środkowej części każdej krzywej i nie osiąga wartości końcowych przypisanych raportowi. Kształt krzywych, ich środki i przesunięcie wskaźników lęku o 4 punkty są autorskie. Końce krzywych w silniku mają status „private-source-pending”: przypisano je do Ipsos × FNP, lecz audyt tabel nie jest zakończony, a część z nich to szacunki autora. Nie traktujemy ich jako zweryfikowanej kalibracji. Do zmiany potrzebne są porównywalne pomiary klimatu i zachowań w wielu zespołach, także w środku skali.</dd>
          <dt>Rotacja: część odejść z firmy, z wagą {number(TURNOVER_CLIMATE_WEIGHT)}</dt>
          <dd>Model przypisuje klimatowi część zadeklarowanych odejść. Ta część wynika z krzywej stabilności zespołu: to udział modelowej rotacji ponad jej poziom przy klimacie 100/100. Do kwoty wchodzi z wagą {number(TURNOVER_CLIMATE_WEIGHT)}: etaty × zadeklarowana rotacja × waga × ta część × koszt zastąpienia, ze wzmocnieniem przy blokowaniu głosu. Kwota rośnie proporcjonalnie do zadeklarowanej rotacji, a przy rotacji 0% albo klimacie 100/100 wynosi zero. Waga i krzywa są autorskie; deklaracja nie dowodzi przyczyny odejść. Wcześniejsza wersja używała punktu odniesienia 14,8% o niepotwierdzonym pochodzeniu; model nie używa już żadnej krajowej wartości odniesienia.</dd>
          <dt>Zastąpienie pracownika: 0,75 rocznej płacy brutto</dt>
          <dd>To umowny koszt rekrutacji, wdrożenia i przejściowej utraty zdolności do pracy, równoważny dziewięciu miesięcznym płacom. To założenie autora. Badania z opisaną metodą podają medianę około jednej piątej rocznej płacy dla typowego stanowiska (Boushey i Glynn 2012, Center for American Progress: mediana około 21%), wyższą dla specjalistów i kadry kierowniczej. Często cytowany zakres SHRM 50–200% rocznego wynagrodzenia nie ma opublikowanej metody. Wartość 0,75 jest więc wyższa od udokumentowanej mediany. W diagnozie zastąp ją udokumentowanym kosztem obsadzenia stanowiska i wdrożenia w firmie, podzielonym przez płacę roczną. Nie sumuj drugi raz tych samych godzin ani utraty wiedzy. Dodatkowe wzmocnienie związane z blokowaniem głosu ma współczynnik 0,10, również autorski.</dd>
          <dt>Wypalenie: współczynnik kosztu 0,25 i korekta nakładania 0,75</dt>
          <dd>Pierwszy przelicza modelowy wskaźnik wypalenia na część płac, drugi zmniejsza koszt o 25%, bo część konsekwencji może już znajdować się w rotacji. Żaden nie oznacza, że pracownik z wypaleniem pracuje o 25% mniej. W wersji FNP wyłączono dodatkowe wzmocnienie rotacji przez wypalenie. Korekty można zastąpić analizą rozłącznych kosztów absencji, zastępstw i zakłóceń pracy na danych zbiorczych, z uwzględnieniem innych przyczyn.</dd>
          <dt>Rodzaje milczenia i powiązania między obszarami</dt>
          <dd>Wagi milczenia obronnego, rezygnacyjnego i prospołecznego są autorskie. Przesuwają koszt między obszarami według modelowego składu milczenia: silnik skaluje je tak, aby nie zmieniały sumy wszystkich obszarów modelu. Do sumy kalkulatora wchodzą tylko trzy obszary, więc wagi mogą ją nieznacznie przesunąć. Wyłączono też dodatkowe wzmocnienie błędów przez kulturę obwiniania, bo obwinianie już zwiększa modelową skłonność do ukrywania błędów.</dd>
          <dt>Milczenie automatyczne: 1 + 0,04 × modelowy udział</dt>
          <dd>Założenie o utrwalaniu milczenia zwiększa wyliczone koszty o mniej niż 4%. Współczynnik 0,04 i udział są autorskie, nie zmierzone w firmie. Model przyjmuje też stałą autonomię 0,5. Aby zmienić ten mnożnik, potrzebne są powtarzane obserwacje utrzymywania się milczenia i jego skutków. W analizie wrażliwości można ustawić współczynnik korekty na 0 (czyli mnożnik na 1) i porównać wynik. Nie dodajemy obok niego kolejnego kosztu „mrożenia”.</dd>
        </dl>
      </details>

      <details>
        <summary>Błędy: skąd częstości, kwoty i mnożniki opóźnienia</summary>
        <p>To autorski rozkład zdarzeń, nie statystyka polskich firm. Częstości są roczne, na jeden etat, także dla zdarzeń poważnych i krytycznych. Przy 500 FTE oznaczają odpowiednio 25 i 3 zdarzenia przed uwzględnieniem ukrywania. Skalowanie liniowe może źle pasować do małej firmy lub pojedynczego ryzyka obejmującego całą organizację.</p>
        <div className="table-scroll" role="region" aria-label="Założenia kosztów błędów, tabela przewijana poziomo" tabIndex={0}>
          <table>
            <caption>Rozkład FNP: wartości startowe autora</caption>
            <thead><tr><th scope="col">Zdarzenia</th><th scope="col">Na FTE / rok</th><th scope="col">Koszt wczesny</th><th scope="col">Koszt późny ×</th><th scope="col">Podatność na ukrycie</th></tr></thead>
            <tbody>{FNP_PROBLEM_DIST.map((row) => <tr key={row.id}><th scope="row">{problemLabels[row.id]}</th><td>{number(row.count)}</td><td>{number(row.cost)} zł</td><td>{number(row.lateMultiplier)}</td><td>{number(row.concealability)}</td></tr>)}</tbody>
          </table>
        </div>
        <p>Rzadsze duże zdarzenia ograniczają ich dominację w scenariuszu. Niższa podatność na ukrycie zakłada, że poważny problem trudniej przemilczeć; to hipoteza do sprawdzenia. Kalkulator nalicza tylko dodatkowy koszt opóźnienia: koszt wczesny × (mnożnik późny − 1), pomnożony przez modelową liczbę ukrytych zdarzeń, a następnie odejmuje wariant odniesienia.</p>
        <p>Do aktualizacji użyj rejestru incydentów z datą wykrycia, zgłoszenia, reakcją i kosztami. Częstość to liczba zdarzeń podzielona przez FTE i lata obserwacji. Mnożnik opóźnienia wymaga porównania podobnych zdarzeń z reakcją wczesną i późną. Brak zgłoszeń nie jest dowodem braku zdarzeń. Nie wpisuj odejść pracowników jako błędów, jeśli ich koszt jest już w rotacji.</p>
      </details>

      <details>
        <summary>Co obejmuje zakres P10–P90</summary>
        <p>Wykonujemy 2000 powtarzalnych losowań mnożników trzech kosztów. Rozkład jest lognormalny, z odchyleniem w skali logarytmicznej 0,35 dla błędów oraz 0,25 dla rotacji i wypalenia. Wagi wspólnego szoku wynoszą 0,5, co daje korelację 0,25 między normalnymi szokami przed przekształceniem. Nie jest to korelacja 0,5 między kwotami.</p>
        <p>Rozrzut i zależność to priory autora. Zakres nie uwzględnia wszystkich niepewności: nie losuje oceny klimatu, kształtu krzywych ani definicji kosztów. Zmiana przychodu nie zmienia kosztu ani pasma, tylko procent przychodów. Weryfikacja rozrzutu wymaga danych o kosztach w wielu okresach lub organizacjach.</p>
      </details>

      <section id="efekt-mrozenia" aria-labelledby="efekt-mrozenia-title">
        <h4 id="efekt-mrozenia-title">Efekt mrożenia: co wnoszą publikacje z 2016 r.</h4>
        <p>Obawa przed konsekwencjami może powstrzymywać pracownika przed zgłoszeniem problemu. Tutaj „efekt mrożenia” opisuje ten mechanizm autocenzury. Sam brak zgłoszeń nie pozwala rozstrzygnąć, czy zespół nie ma problemów, czy boi się o nich mówić.</p>
        <p><a href="https://pubmed.ncbi.nlm.nih.gov/26727209/">Kiewitz i współautorzy (2016), „Suffering in silence”</a>, w trzech badaniach analizowali związek nadużyć przełożonych, strachu i milczenia obronnego. Silniej odczuwany klimat strachu nasilał związek strachu z milczeniem. Badanie wspiera opis mechanizmu, nie dostarcza przelicznika strat w złotych.</p>
        <p><a href="https://doi.org/10.18290/rpsych.2016.19.1-3pl">Adamska (2016), „Milczenie i przełamywanie milczenia w organizacji”</a>, odróżnia milczenie wynikające ze społecznie podzielanych przekonań od milczenia jako świadomej taktyki. To praca koncepcyjna, nie estymacja uniwersalnej wielkości efektu mrożenia.</p>
        <p>W kalkulatorze obawa i utrwalanie milczenia są już reprezentowane przez klimat, ukrywanie błędów i autorską korektę milczenia automatycznego. Dodanie osobnej kwoty za ten sam mechanizm groziłoby podwójnym liczeniem. Jeśli odwet lub autocenzura są obecne, uwzględnij je w ocenie klimatu i sprawdź w diagnozie zespołów, zamiast automatycznie odejmować punkty według rzekomego współczynnika z badania.</p>
        <p className="field-hint">Pojęcie pojawia się też u <a href="https://btlj.org/data/articles2016/vol31/31_1/0117_0182_Penney_ChillingEffects_WEB.pdf">Penneya (2016), „Chilling Effects: Online Surveillance and Wikipedia Use”</a>. Badanie dotyczyło korzystania z Wikipedii w kontekście ujawnień nadzoru państwowego. Nie przenosimy jego wielkości efektu na pracowników ani koszty firmy.</p>
      </section>

      <h4>Jak modyfikować priory odpowiedzialnie</h4>
      <ol>
        <li><strong>Najpierw dane wejściowe.</strong> Ustal rok, zakres organizacji, FTE, płacę roczną i definicję rotacji. Zbierz oceny pracowników; jedna ocena kierownictwa nie zastępuje pomiaru.</li>
        <li><strong>Jedno założenie naraz.</strong> Porównaj wartość obecną, niższą i wyższą. Zaproponowane wartości muszą mieć opis źródła, jednostki, zakresu i niepewności. Nie dopasowuj ich do oczekiwanego wyniku finansowego.</li>
        <li><strong>Sprawdzenie poza danymi użytymi do zmiany.</strong> Oceń model na innym okresie lub zespole. Uwzględnij sezonowość, reorganizacje i zmiany rynku. Zależność między klimatem a kosztem sama w sobie nie dowodzi przyczynowości.</li>
        <li><strong>Wersja i ślad zmiany.</strong> Zapisz stare i nowe wartości, uzasadnienie, autora zmiany i datę. Sprawdź, czy te same koszty nie trafiły do dwóch obszarów. Zachowaj tryb ostrożny oraz opis ograniczeń.</li>
      </ol>
      <p>Publiczny formularz pozwala zmienić dane i klimat. Zmiany priory wykonuje się w kodzie lub w osobnej analizie po diagnozie. <a href="https://github.com/pawelmamcarz/kalkulator-rezyliencji-fnp/blob/main/docs/PRIORY.md">Instrukcja dla analityka: parametry, przykład zmiany i kontrole</a>.</p>
      <p className="field-hint">Raport Ipsos × FNP 2026 pozostaje kontekstem. Otwarty kod umożliwia kontrolę obliczeń, ale nie zastępuje audytu źródeł ani walidacji na danych firm.</p>
    </section>
  );
}
