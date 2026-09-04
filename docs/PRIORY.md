# Priory FNP: instrukcja dla analityka

Stan opisu: 4 września 2026 r. Wartości sprawdzaj względem wersji kodu, z której wykonujesz analizę.

Prior oznacza tutaj założenie startowe autora. Nie oznacza rozkładu wyestymowanego metodą bayesowską. Kalkulator tworzy **scenariusz skali** przy zadanych warunkach. Nie wycenia księgowej straty, nie prognozuje skutków interwencji ani zwrotu z inwestycji.

## Co uzasadnia wartości startowe

Badania uzasadniają rozpatrywanie zależności między klimatem, milczeniem i zachowaniem pracowników. Nie wyznaczają zastosowanych przeliczników pieniężnych. Wersja FNP celowo ogranicza zakres sumy, częstość poważnych błędów oraz reakcję na zmianę klimatu. Jest to decyzja o skali scenariusza, a nie estymacja na próbie polskich firm.

Limit 5% przychodu dla firmy przykładowej jest kontrolą projektu. Nie jest wynikiem badania ani ogranicznikiem wszystkich wyników: przy innym stosunku płac do przychodu procent może być wyższy. Nie należy dostrajać współczynników do oczekiwanej kwoty.

Końce krzywych w `METRICS` mają status `private-source-pending`: w silniku przypisano je do Ipsos × FNP, ale audyt tabel nie jest zakończony. Środki i stromości są autorskie. Otwarty kod umożliwia sprawdzenie rachunku, nie dowodzi prawdziwości założeń. Wewnętrzna etykieta `validated` określa zakres sumy; nie oznacza empirycznie zwalidowanej kwoty.

## Ścieżka obliczenia

1. Publiczny formularz zbiera przychód i koszty roczne, FTE, średnią płacę brutto, rotację oraz klimat. W API `avgSalary` to **roczna** płaca brutto na FTE; `turnoverPct: 16` oznacza 16%, a `safety: 41` to szacunek własny 41/100, nie pomiar.
2. `fnpAnalysisParams` nakłada ostrożne priory, rozkład zdarzeń FNP i deklarowaną rotację. `computeFnpAnalysis` wykonuje analizę ze stałym ziarnem losowania.
3. Model oblicza koszt danego obszaru przy zadanym klimacie oraz przy 100/100, z tymi samymi pozostałymi parametrami. Odejmuje drugi od pierwszego i zeruje ujemną różnicę. Punkt 100 jest odniesieniem matematycznym, nie organizacją bez problemów.
4. Stosuje korekty nakładania kosztów, powiązań między wskaźnikami i rodzajów milczenia. Suma publiczna zawiera tylko `errors`, `turnover`, `burnout`.
5. Losowanie mnożników tych trzech kosztów daje P10–P90. To rozrzut przyjętego scenariusza, nie przedział ufności przyczynowej straty firmy.

Przychód jest mianownikiem procentu sumy publicznej. Koszty działalności służą marży w interfejsie, nie wyznaczają kwoty modelu. `totalTaxFull` i pełne kwoty kanałów zawierają również obszary wyłączone: nie używaj ich jako sumy publicznej. Odczytuj `costs.totalTax` oraz komponenty z `inHeadline: true`.

## Parametry mające wpływ na sumę

| Założenie | FNP | Powód przyjęcia i podstawa zmiany |
| --- | --- | --- |
| `K_SIGMOID_MULT` | 0,30 | Łagodniejsza reakcja wskaźników na jeden punkt szacunku klimatu. Do oszacowania potrzebne są porównywalne obserwacje klimatu i zachowania w wielu zespołach i okresach, także pośrodku skali. |
| Przesunięcie środków krzywych lęku | +4 punkty | Autorska reprezentacja asymetrii reakcji. Badania o uprzedzeniach poznawczych nie wyznaczają tej liczby. Brak nazwanego override. |
| Sygnał rotacji z klimatu | `max(0, (1 − stabilność) × 0,4 − 0,015)` | Autorska konwersja wskaźnika stabilności na stopę. Współczynniki 0,4 i 0,015 nie są oszacowane na danych firmy; brak nazwanych overrides. |
| Połączenie informacji o rotacji | 50% nadwyżki sygnału klimatu, 50% nadwyżki deklaracji ponad odniesienie | Zmniejsza zależność od pojedynczego suwaka. Wagi są autorskie, bez nazwanego override. Deklaracja ogranicza modelową stopę odejść, ale nie dowodzi ich przyczyny. |
| `PL_AVG_TURNOVER` | 0,148 | Historyczny punkt odniesienia przypisany w kodzie do GUS, obecnie niezweryfikowany. Przed zmianą uzgodnij definicję odejść, mianownik, rok i populację. |
| Koszt zastąpienia | 0,75 rocznej płacy | Umowny ekwiwalent dziewięciu miesięcznych płac. Zastąpić może go udokumentowany koszt obsadzenia i wdrożenia stanowiska podzielony przez płacę roczną. Brak nazwanego override. |
| `HIRSCHMAN_EXIT_AMPLIFIER` | 0,10 | Autorskie wzmocnienie kosztu rotacji przy blokowaniu głosu. Teoria uzasadnia mechanizm, nie wielkość. Sprawdzaj oddzielnie od kosztu zastąpienia. |
| Koszt wypalenia | płace × `b × (1 + 0,5 × b) × 0,25` | `b` to modelowy wskaźnik, nie rozpoznanie zdrowia pracowników. 0,5 i 0,25 są autorskie, bez nazwanych overrides. Nie interpretuj 0,25 jako zmierzonej utraty produktywności. |
| `OVERLAP_CORRECTIONS.burnout` | 0,75 | Pozostawia 75% kosztu wypalenia przed dalszymi korektami. Założenie ogranicza nakładanie z rotacją, nie stanowi statystycznej dekorelacji. Dane o rozłącznych kosztach absencji, zastępstw i zakłóceń mogą zastąpić ten prior. |
| Powiązania z błędami i wypaleniem | `blameRate → errors: 0,15`; `destructiveFear → burnout: 0,15` | Autorskie wzmocnienia względem znormalizowanego nasilenia wskaźnika. FNP usuwa dodatkowe `burnoutRate → turnover`, aby ograniczyć powtórne naliczanie. |
| `AUTOMATIC_SILENCE_PENALTY` | 0,04 | Mnożnik kosztu wynosi `1 + 0,04 × automaticShare`. Wyłączenie oznacza współczynnik 0, czyli mnożnik 1. Potrzebne byłyby powtarzane obserwacje utrwalenia milczenia i jego skutków, aby oszacować wielkość. |
| Autonomia | 0,5 | Stałe domyślne założenie, używane m.in. w podziale milczenia. Publiczny formularz jej nie mierzy. |

W rotacji model wylicza również koszt odniesienia przy 100/100, nadal z deklaracją tej samej firmy. Dlatego końcowa kwota nie jest po prostu połową różnicy między deklarowaną rotacją a 14,8% pomnożoną przez płace. Nie interpretuj różnicy względem odniesienia jako liczby odejść spowodowanych milczeniem.

Wagi rodzajów milczenia też są priorami. Dla błędów wynoszą 1,20 / 0,90 / 0,80, dla rotacji 1,00 / 1,20 / 0,80, dla wypalenia 1,10 / 1,30 / 0,90, odpowiednio dla milczenia obronnego, rezygnacyjnego i prospołecznego. Są uśredniane udziałami z autorskich krzywych w `silenceDecomposition`. Nie są zmierzonym składem milczenia w firmie i nie mają nazwanego override.

### Zastrzeżenie do odniesienia GUS

Komentarz silnika wskazuje publikację „Popyt na pracę w 2023 roku”, lecz nie podaje tabeli potwierdzającej 14,8%. Zakres publikacji obejmuje obsadzone i wolne miejsca pracy oraz miejsca utworzone i zlikwidowane. [Opis publikacji GUS](https://stat.gov.pl/obszary-tematyczne/rynek-pracy/popyt-na-prace/popyt-na-prace-w-2023-roku%2C1%2C19.html).

Inna oficjalna publikacja podaje krajowy współczynnik zwolnień 19,7% za 2023 r. To dodatkowy powód, aby sprawdzić pochodzenie i definicję 14,8%, a nie podstawa do automatycznej zamiany. Współczynnik zwolnień GUS może mieć inny zakres niż rotacja dobrowolna lub ogół odejść deklarowany w firmie. [GUS Szczecin, zatrudnienie i wynagrodzenia w 2023 r., s. 2](https://szczecin.stat.gov.pl/download/gfx/szczecin/pl/defaultaktualnosci/744/4/9/1/zatrudnienie_wynagrodzenia_za_2023.pdf).

### Rozkład błędów FNP

| `id` | Zdarzenia / FTE / rok | Koszt wczesny, zł | Koszt późny × | Podatność na ukrycie |
| --- | ---: | ---: | ---: | ---: |
| `trivial` | 8 | 500 | 1,5 | 0,60 |
| `medium` | 3 | 5 000 | 2,5 | 0,30 |
| `major` | 0,05 | 50 000 | 3,5 | 0,15 |
| `critical` | 0,006 | 250 000 | 5,0 | 0,05 |

Wszystkie wartości są autorskie. Rzadsze poważne zdarzenia ograniczają ich dominację w sumie. Przy 500 FTE model zakłada 25 poważnych i 3 krytyczne zdarzenia rocznie przed ukrywaniem. Liniowe skalowanie może nie pasować do ryzyka występującego raz na organizację. Niższa podatność na ukrycie zakłada łatwiejsze wykrycie poważnego zdarzenia; trzeba to sprawdzić w rejestrze incydentów.

Modelowa skłonność do ukrywania wynika z `f = errorFear × (0,3 + 0,7 × blameRate)`, następnie `f × (1 + 0,3 × f)`. Także te współczynniki są autorskie. Udział ukrytych zdarzeń kategorii jest ograniczany do 1. Koszt dodatkowy pojedynczego opóźnienia to `cost × (lateMultiplier − 1)`. Silnik mnoży go przez liczbę ukrytych zdarzeń, odejmuje scenariusz 100/100 i stosuje pozostałe korekty.

Przy aktualizacji ustal wspólne definicje kategorii. Częstość licz jako zdarzenia / FTE / lata obserwacji. Zapisuj wykrycie, zgłoszenie, reakcję, koszt wczesny i koszt opóźnienia. Porównuj podobne zdarzenia; poważniejszy incydent może jednocześnie kosztować więcej i trwać dłużej bez związku przyczynowego między tymi wielkościami. Brak zgłoszeń nie oznacza braku zdarzeń. Koszt odejść pracowników pozostaw w rotacji.

### Rozrzut P10–P90

Domyślnie model wykonuje 2000 losowań. Współczynniki w kodzie nazwano `MODULE_CV`, ale we wzorze `exp(σ × z − σ² / 2)` pełnią rolę **odchylenia w skali logarytmicznej**: σ = 0,35 dla błędów oraz 0,25 dla rotacji i wypalenia. Nie należy przedstawiać ich jako dokładnego współczynnika zmienności kwot.

`rho = 0,5` jest wagą wspólnego szoku. Korelacja normalnych szoków przed potęgowaniem wynosi `rho² = 0,25`, a nie 0,5. Pasmo nie losuje oceny klimatu, końców krzywych, błędów danych wejściowych ani wszystkich możliwych struktur modelu. Rozrzut jest priorem, nie wynikiem estymacji na panelu firm. Stałe ziarno stabilizuje porównania scenariuszy; nie zwiększa wiarygodności empirycznej.

## Efekt mrożenia i publikacje z 2016 r.

„Efekt mrożenia” opisuje tu powstrzymywanie się od zgłaszania problemów z obawy przed konsekwencjami. Nie dodajemy stałej kwoty ani automatycznego odjęcia punktów klimatu na podstawie samej etykiety zjawiska.

- Kiewitz i współautorzy analizowali nadużycia przełożonych, strach i milczenie obronne w trzech badaniach. Silniejsze postrzeganie klimatu strachu nasilało niekorzystną relację strachu z milczeniem. To podstawa opisu mechanizmu, nie przelicznik pieniężny. [Kiewitz i in. (2016), DOI 10.1037/apl0000074](https://pubmed.ncbi.nlm.nih.gov/26727209/).
- Adamska rozróżnia milczenie związane ze społecznie podzielanymi przekonaniami oraz milczenie jako taktykę. Podział i omówienie przełamywania milczenia nie ustanawiają użytych w silniku wartości `automaticShare` ani kary 0,04. [Adamska (2016), DOI 10.18290/rpsych.2016.19.1-3pl](https://ojs.tnkul.pl/index.php/rpsych/article/view/618).
- Penney badał ruch do wrażliwych tematycznie artykułów Wikipedii po ujawnieniach nadzoru NSA/PRISM w 2013 r. Publikacja z 2016 r. dotyczy nadzoru państwowego i zachowania internautów. Nie uzasadnia przeniesienia wielkości efektu na pracowników, klimat firmy ani złote. [Penney (2016), pełny tekst](https://btlj.org/data/articles2016/vol31/31_1/0117_0182_Penney_ChillingEffects_WEB.pdf).

Przeniesienie pojęcia na kalkulator jest interpretacją autora. Klimat, ukrywanie błędów oraz korekta milczenia automatycznego już reprezentują powiązane mechanizmy. Osobna pozycja pieniężna wymagałaby dowodu, że obejmuje rozłączny koszt. W diagnozie szukaj zbiorczych informacji o obawie przed odwetem, rezygnacji ze zgłoszenia oraz reakcji na wcześniejsze zgłoszenia. Nie obniżaj drugi raz klimatu, jeżeli respondent uwzględnił te zachowania w swoim szacunku.

## Jak wykonać analizę bez zmieniania wspólnego silnika

`fnpAnalysisParams` łączy domyślne ustawienia FNP z `params.overrides`, a potem nakłada `TURNOVER_DECLARED` wynikający z `turnoverPct`. Podawaj deklarację przez `turnoverPct`; nie próbuj zmieniać jej równocześnie w dwóch miejscach. Rozkład zdarzeń podawaj jako `problemDist`, poza obiektem `overrides`.

Obecnie obsługiwane overrides przydatne w sumie publicznej to `K_SIGMOID_MULT`, `HIRSCHMAN_EXIT_AMPLIFIER`, `PL_AVG_TURNOVER`, `AUTOMATIC_SILENCE_PENALTY`, `OVERLAP_CORRECTIONS`, `OVERLAP_GLOBAL` i `MODULE_INTERACTIONS`. Silnik nie zgłasza błędu dla nieznanej nazwy, ale jej nie stosuje. Nie wymyślaj np. `BURNOUT_COST_RATE`. Stałe bez override wymagają osobnej, opisanej zmiany formuły, najlepiej w źródłowym silniku Silence Tax, a potem przeniesienia poprawki do FNP.

Gdy zmieniasz mapę `OVERLAP_CORRECTIONS`, kopiuj pozostałe wartości. Przekazanie samego `{ burnout: 0.6 }` usuwa inne korekty z przekazanej mapy. Nie modyfikuj importowanych obiektów w miejscu. Dla scenariusza firmy kopiuj `FNP_PROBLEM_DIST`; nie zmieniaj `DEFAULT_PROBLEM_DIST` wspólnego silnika.

API analityczne nie waliduje wszystkich niestandardowych priory. Przed obliczeniem sprawdź skończoność wartości: częstości i koszty muszą być nieujemne, podatność na ukrycie mieścić się w 0–1, a mnożnik kosztu późnego wynosić co najmniej 1. Zerowa podatność jest obsługiwana, oznacza brak ukrywania. Nie używaj normalizacji silnika jako walidatora: np. `employees: 0` zastępuje ona 1, a `autonomy: 0` wartością 0,5. Publiczny formularz odrzuca FTE poniżej 1 i nie udostępnia pola autonomii. Badanie skrajnej autonomii wymaga najpierw korekty tej normalizacji w silniku źródłowym.

Poniższy przykład uruchom w katalogu repozytorium. Pokazuje jedną zmianę naraz. Wartości alternatywne są wyłącznie ilustracją wrażliwości, nie rekomendacją kalibracji.

```bash
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { computeFnpAnalysis, FNP_PROBLEM_DIST } from './src/fnpModel.js';

const input = {
  revenue: 100_000_000,
  employees: 500,
  avgSalary: 90_000, // Roczna płaca brutto na FTE.
  turnoverPct: 16,
  safety: 41,
  scopeMode: 'conservative',
  safetySource: 'estimate',
};
const scenarios = [
  ['FNP', {}],
  ['Bez korekty milczenia automatycznego', {
    overrides: { AUTOMATIC_SILENCE_PENALTY: 0 },
  }],
  ['Mniejsza stromość krzywych', {
    overrides: { K_SIGMOID_MULT: 0.25 },
  }],
  ['Połowa częstości zdarzeń poważnych', {
    problemDist: FNP_PROBLEM_DIST.map(row => ({
      ...row,
      count: row.id === 'major' ? row.count / 2 : row.count,
    })),
  }],
];
const rows = scenarios.map(([name, change]) => {
  const result = computeFnpAnalysis({ ...input, ...change });
  const headline = result.costs.components.filter(row => row.inHeadline);
  assert.deepEqual(headline.map(row => row.id), ['errors', 'turnover', 'burnout']);
  assert.ok(Number.isFinite(result.costs.totalTax));
  assert.ok(result.costs.totalTax >= 0);
  assert.ok(Math.abs(headline.reduce((sum, row) => sum + row.value, 0)
    - result.costs.totalTax) < 1e-6);
  assert.ok(result.mc.p10 <= result.mc.p50 && result.mc.p50 <= result.mc.p90);
  return {
    scenariusz: name,
    kwota: Math.round(result.costs.totalTax),
    P10: Math.round(result.mc.p10),
    P90: Math.round(result.mc.p90),
  };
});
console.table(rows);
NODE
```

## Podstawa decyzji o zmianie

1. Zapisz jednostkę, definicję, populację, okres i kompletność danych. Porównaj odpowiedzi kierownictwa i pracowników. Pojedynczy szacunek kierownika nie zastępuje pomiaru klimatu.
2. Oddziel aktualizację danych wejściowych od zmiany formuł i priorów. Ustal niższy, centralny i wyższy wariant na podstawie danych lub jawnej oceny eksperckiej, z opisem niepewności.
3. Porównuj jedno założenie naraz na tych samych danych i ziarnie losowania. Następnie sprawdź kilka wspólnych zmian jako odrębny test skrajnego scenariusza.
4. Sprawdź wynik na innym okresie lub zespole niż wykorzystany do doboru współczynnika. Uwzględnij sezonowość, reorganizację, branżę i rynek pracy. Korelacja nie ustala przyczynowości.
5. Zapisz stare i nowe wartości, źródło z numerem tabeli lub definicją rejestru, autora, datę, wersję kodu oraz wpływ na trzy składowe i P10–P90. Zachowaj ograniczenia interpretacji.

## Kontrole przed zmianą publicznych wartości

Uruchom `npm test`, `npm run lint` i `npm run build`. `src/logic.test.js` chroni zachowanie wspólnego silnika, a `src/fnp.test.js` kontrakt publiczny. Zielone testy potwierdzają reguły rachunku, nie empiryczną kalibrację.

Sprawdź też sens zmiany na scenariuszach brzegowych: klimat 0 i 100, rotacja 0, brak częstości danego typu błędu, małe i duże FTE. Przy 100/100 koszt ponad odniesienie powinien być zerowy. Zmiana wyłącznie przychodu powinna zmienić procent, lecz zachować kwotę i pasmo. Suma kanałów publicznych musi odpowiadać trzem włączonym komponentom; dwa pozostałe obszary pozostają poza sumą.

Nie usuwaj kontroli domyślnego scenariusza do 5% tylko po to, aby zaakceptować nową wartość. Jeśli dane uzasadniają zmianę skali publicznej, opisz zmianę założeń i komunikacji produktu. Przy zmianie widocznego tekstu lub formularza sprawdź stronę na komputerze i telefonie. Zachowaj oznaczenia `AUTHOR'S EXTENSION`, ostrożny zakres i brak obietnic ROI.

Pliki odniesienia: [`fnpModel.js`](../src/fnpModel.js), [`modules.js`](../src/logic/modules.js), [`constants.js`](../src/logic/constants.js), [`silence.js`](../src/logic/silence.js), [`sigmoid.js`](../src/logic/sigmoid.js), [`monteCarlo.js`](../src/logic/monteCarlo.js).
