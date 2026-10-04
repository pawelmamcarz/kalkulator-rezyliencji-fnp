# Priory FNP: instrukcja dla analityka

Stan opisu: 4 października 2026 r. Wartości sprawdzaj względem wersji kodu, z której wykonujesz analizę.

Prior oznacza tutaj założenie startowe autora. Nie oznacza rozkładu wyestymowanego metodą bayesowską. Kalkulator tworzy **scenariusz skali** przy zadanych warunkach. Nie wycenia księgowej straty, nie prognozuje skutków interwencji ani zwrotu z inwestycji.

## Co uzasadnia wartości startowe

Badania uzasadniają rozpatrywanie zależności między klimatem, milczeniem i zachowaniem pracowników. Nie wyznaczają zastosowanych przeliczników pieniężnych. Wersja FNP celowo ogranicza zakres sumy, częstość poważnych błędów oraz reakcję na zmianę klimatu. Jest to decyzja o skali scenariusza, a nie estymacja na próbie polskich firm.

Limit 5% przychodu dla firmy przykładowej jest kontrolą projektu. Nie jest wynikiem badania ani ogranicznikiem wszystkich wyników: przy innym stosunku płac do przychodu procent może być wyższy. Nie należy dostrajać współczynników do oczekiwanej kwoty.

Końce krzywych w `METRICS` mają status `private-source-pending`: większość przypisano w silniku do Ipsos × FNP, ale audyt tabel nie jest zakończony. Nie wszystkie są liczbami z raportu: według pól `src` w `src/logic/constants.js` część wartości dla wysokiego klimatu to szacunki autora (np. `burnoutRate` „est. 8% high”), a opis `snitchPerc` („5% vs 41% neg”) nie zgadza się z jego parametrami (0,55 i 0,10). Środki i stromości są autorskie. Przy mnożniku FNP krzywe nie osiągają tych końców (tabela niżej). Otwarty kod umożliwia sprawdzenie rachunku, nie dowodzi prawdziwości założeń. Wewnętrzna etykieta `validated` określa zakres sumy; nie oznacza empirycznie zwalidowanej kwoty.

## Ścieżka obliczenia

1. Publiczny formularz zbiera przychód i koszty roczne, FTE, średnią płacę brutto, rotację oraz klimat. W API `avgSalary` to **roczna** płaca brutto na FTE; `turnoverPct: 16` oznacza 16%, a `safety: 41` to szacunek własny 41/100, nie pomiar.
2. `fnpAnalysisParams` nakłada ostrożne priory, rozkład zdarzeń FNP, powiązania FNP, deklarowaną rotację i domyślną liczbę liderów (10% FTE, jak w adapterze silnika). Rotacja jest wymagana: pusta (`undefined`, `null`, `""`, same spacje) kończy się błędem `TypeError` z polskim komunikatem; nie ma stopy domyślnej. Tak samo pusty lub nieliczbowy klimat (także `true`, `[41]`, `" "`). Klimat lub rotacja spoza 0–100 kończą się błędem `RangeError`, bez przycinania. Liczby można podać jako liczby albo napisy z cyframi (`" 41 "`). `computeFnpAnalysis` wykonuje analizę ze stałym ziarnem losowania (`MC_SEED_DEFAULT`, to samo co domyślne ziarno silnika).
3. Model oblicza koszt danego obszaru przy zadanym klimacie oraz przy 100/100, z tymi samymi pozostałymi parametrami. Odejmuje drugi od pierwszego i zeruje ujemną różnicę. Punkt 100 jest odniesieniem matematycznym, nie organizacją bez problemów.
4. Stosuje korekty nakładania kosztów, powiązań między wskaźnikami i rodzajów milczenia. Suma publiczna zawiera tylko `errors`, `turnover`, `burnout`. Wagi rodzajów milczenia są skalowane osobno w obrębie tych trzech obszarów i w obrębie pozostałych, więc nie zmieniają ani sumy publicznej, ani pełnej; przesuwają tylko koszt między obszarami.
5. Losowanie mnożników tych trzech kosztów daje P10–P90. To rozrzut przyjętego scenariusza, nie przedział ufności przyczynowej straty firmy.

Przychód jest mianownikiem procentu sumy publicznej. Koszty działalności służą marży w interfejsie, nie wyznaczają kwoty modelu. `totalTaxFull` oraz pole `full` kanałów zawierają również obszary wyłączone: nie używaj ich jako sumy publicznej. Odczytuj `costs.totalTax`, komponenty z `inHeadline: true` albo pole `base` kanałów (kwota w sumie; `excluded` to kwota poza sumą).

## Parametry mające wpływ na sumę

| Założenie | FNP | Powód przyjęcia i podstawa zmiany |
| --- | --- | --- |
| `K_SIGMOID_MULT` | 0,30 | Łagodniejsza reakcja wskaźników na jeden punkt szacunku klimatu. Pochodzenie: wybór autora, nie pomiar. Domyślny mnożnik silnika (0,4) ustalono kiedyś tak, aby sumy zbliżyły się do docelowych wartości z rozprawy autora; poprawiony silnik tych wartości już nie odtwarza i mnożnika nie dostrajano ponownie. Wariant ostrożny obniża go o kolejne 25%, do 0,30. Mnożnik działa tylko na 12 krzywych `METRICS`, nie na krzywe Williamsona, governance, Argyrisa, Nonaki i agencji. Przy 0,30 krzywe nie osiągają końców z `METRICS` (tabela niżej). Do oszacowania potrzebne są porównywalne obserwacje klimatu i zachowania w wielu zespołach i okresach, także pośrodku skali; walidacja ma zastąpić ten wybór oszacowaniem. |
| Przesunięcie środków krzywych lęku | +4 punkty | Autorska reprezentacja asymetrii reakcji. Badania o uprzedzeniach poznawczych nie wyznaczają tej liczby. Brak nazwanego override. |
| Sygnał rotacji z klimatu | `max(0, (1 − stabilność) × 0,4 − 0,015)` | Autorska konwersja wskaźnika stabilności na stopę. Współczynniki 0,4 i 0,015 nie są oszacowane na danych firmy; brak nazwanych overrides. |
| Udział odejść przypisany klimatowi | `share(s) = 1 − churn(100) / churn(s)` | Część modelowej rotacji ponad jej poziom przy 100/100, z tej samej krzywej stabilności i tego samego mnożnika `K`. Przy klimacie 41 wynosi około 29%, przy 10 około 39%, przy 70 około 17%, przy 100 zero (liczy to `fnpTurnoverClimateShare`). Nie jest zmierzonym odsetkiem odejść z powodu klimatu. |
| Rotacja z deklaracją | `FTE × deklaracja × 0,5 × share(s) × 0,75 × płaca × (1 + H × blokada głosu)` | Model przypisuje klimatowi część zadeklarowanych odejść firmy. Waga `TURNOVER_CLIMATE_WEIGHT` = 0,5 jest autorska (override `TURNOVER_CLIMATE_WEIGHT`, 0–1). Kwota przed wagami milczenia jest proporcjonalna do deklaracji, ściśle rosnąca, równa zero przy deklaracji 0 i przy klimacie 100. Nie przekracza kosztu zastąpienia wszystkich zadeklarowanych odejść pomnożonego przez dalsze mnożniki. Silnik nie używa żadnej krajowej wartości odniesienia. Deklaracja nie dowodzi przyczyny odejść. |
| Koszt zastąpienia | 0,75 rocznej płacy | Umowny ekwiwalent dziewięciu miesięcznych płac, prior autora. Badania z opisaną metodą podają medianę około jednej piątej rocznej płacy dla typowego stanowiska (Boushey i Glynn 2012, Center for American Progress: mediana około 21%), wyższą dla specjalistów i kadry kierowniczej. Zakres SHRM 50–200% nie ma opublikowanej metody; hasło „6–9 miesięcy pensji” nie pochodzi z publikacji SHRM. 0,75 jest więc powyżej udokumentowanej mediany i pozostaje założeniem autora, które w diagnozie zastępuje udokumentowany koszt obsadzenia i wdrożenia stanowiska w firmie, podzielony przez płacę roczną. Brak nazwanego override; decyzja o wartości należy do właściciela modelu. |
| `HIRSCHMAN_EXIT_AMPLIFIER` | 0,10 | Autorskie wzmocnienie kosztu rotacji przy blokowaniu głosu. Teoria uzasadnia mechanizm, nie wielkość. Sprawdzaj oddzielnie od kosztu zastąpienia. |
| Koszt wypalenia | płace × `b × (1 + 0,5 × b) × 0,25` | `b` to modelowy wskaźnik, nie rozpoznanie zdrowia pracowników. 0,5 i 0,25 są autorskie, bez nazwanych overrides. Nie interpretuj 0,25 jako zmierzonej utraty produktywności. |
| `OVERLAP_CORRECTIONS.burnout` | 0,75 | Pozostawia 75% kosztu wypalenia przed dalszymi korektami. Założenie ogranicza nakładanie z rotacją, nie stanowi statystycznej dekorelacji. Dane o rozłącznych kosztach absencji, zastępstw i zakłóceń mogą zastąpić ten prior. |
| Powiązania z wypaleniem | `destructiveFear → burnout: 0,15` | Autorskie wzmocnienie względem znormalizowanego nasilenia wskaźnika. FNP odfiltrowuje `burnoutRate → turnover` (te same osoby byłyby liczone w rotacji i wypaleniu) oraz `blameRate → errors` (obwinianie już zwiększa modelową skłonność do ukrywania błędów). Wspólny silnik również nie ma ich na domyślnej liście; filtr FNP chroni przed ich powrotem. Nasilenie liczy się tą samą ścieżką co moduły (mnożnik `K`, przesunięcie lęku, korekta niedawnej traumy), bez progu odcięcia. |
| Wagi rodzajów milczenia | wspólny czynnik w grupie | Dla każdego obszaru waga to średnia wag trzech rodzajów milczenia ważona modelowym składem milczenia. Silnik mnoży wagi przez wspólny czynnik, tak aby średni mnożnik ważony kosztem wynosił dokładnie 1, osobno dla obszarów w sumie i poza nią. Suma publiczna nie zmienia się więc od wag; zmienia się tylko podział na trzy obszary. Dawny przełącznik `SILENCE_WEIGHTS_NORMALIZED` usunięto. |
| `AUTOMATIC_SILENCE_PENALTY` | 0,04 | Mnożnik kosztu wynosi `1 + 0,04 × automaticShare`. Wyłączenie oznacza współczynnik 0, czyli mnożnik 1. Potrzebne byłyby powtarzane obserwacje utrwalenia milczenia i jego skutków, aby oszacować wielkość. |
| Autonomia | 0,5 | Stałe domyślne założenie, używane m.in. w podziale milczenia. Publiczny formularz jej nie mierzy. |

W rotacji wariant odniesienia przy 100/100 ma udział `share(100) = 0`, więc odjęcie go nic nie zmienia i nie zostaje żadna resztka wzmocnienia `HIRSCHMAN_EXIT_AMPLIFIER`. Dla firmy przykładowej (klimat 41, rotacja 16%) model przypisuje klimatowi 0,5 × 29,3% × 16% ≈ 2,3% etatów rocznie. Wcześniejsze wersje traktowały deklarację tylko jako górny limit, więc każda deklaracja powyżej około 9% dawała tę samą kwotę; ta reguła została zastąpiona. Nie interpretuj kwoty jako liczby odejść spowodowanych milczeniem.

Kwota rotacji dla firmy przykładowej (500 FTE, płaca 90 000 zł), w złotych, po wszystkich korektach. Wagi milczenia przesuwają koszt między trzema obszarami sumy, dlatego przy wysokiej deklaracji kwota rośnie odrobinę szybciej niż proporcjonalnie (do około 3% przy 100%):

| Rotacja | klimat 10 | klimat 41 | klimat 70 |
| ---: | ---: | ---: | ---: |
| 0% | 0 | 0 | 0 |
| 3% | 209 001 | 153 561 | 84 557 |
| 8% | 559 224 | 411 122 | 226 365 |
| 10% | 699 875 | 514 613 | 283 326 |
| 16% | 1 123 405 | 826 341 | 454 809 |
| 25% | 1 762 209 | 1 296 608 | 713 235 |
| 40% | 2 833 322 | 2 084 999 | 1 145 841 |
| 100% | 7 154 978 | 5 262 802 | 2 885 072 |

Wagi rodzajów milczenia też są priorami. Dla błędów wynoszą 1,20 / 0,90 / 0,80, dla rotacji 1,00 / 1,20 / 0,80, dla wypalenia 1,10 / 1,30 / 0,90, odpowiednio dla milczenia obronnego, rezygnacyjnego i prospołecznego. Są uśredniane udziałami z autorskich krzywych w `silenceDecomposition`, a potem mnożone przez wspólny czynnik, który zachowuje sumę trzech obszarów. Wartości wag nie są zmierzonym składem milczenia w firmie i nie mają nazwanego override.

### Zakres krzywych przy mnożniku 0,30

Przy `K_SIGMOID_MULT` = 0,30 model korzysta tylko ze środkowej części każdej krzywej i w skali 0–100 nie osiąga końców zapisanych w `METRICS`. Wskaźniki używane w sumie publicznej (wartości policzone silnikiem, `getMetricValue` przy klimacie 0 i 100):

| Wskaźnik | Koniec w `METRICS` (niski / wysoki klimat) | Osiągany zakres przy 0,30 (klimat 0 → 100) | Opis `src` |
| --- | --- | --- | --- |
| `teamStability` | 0,59 / 0,85 | 0,655 → 0,780 | 59% vs 85% |
| `burnoutRate` | 0,51 / 0,08 | 0,394 → 0,212 | 51% low, est. 8% high (górny koniec szacowany) |
| `errorFear` | 0,72 / 0,05 | 0,604 → 0,178 | 42% ogół, 72% low |
| `blameRate` | 0,72 / 0,02 | 0,618 → 0,116 | 72% vs 2% |
| `ideaSilence` | 0,52 / 0,10 | 0,430 → 0,183 | 52% vs 10% |
| `destructiveFear` | 0,74 / 0,19 | 0,649 → 0,276 | 74% vs 19% |

Żadnej z tych wartości nie zmieniono. Nawet gdyby końce zostały potwierdzone w tabelach Ipsos × FNP, przy tym mnożniku model nie odtwarza ich na krańcach skali.

### Brak krajowego punktu odniesienia

Wcześniejsza wersja używała punktu odniesienia rotacji 14,8% o niepotwierdzonym pochodzeniu; model nie używa już żadnej krajowej wartości odniesienia, a stała `PL_TURNOVER_RATE_GUS` została usunięta z silnika.

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

Domyślnie model wykonuje 2000 losowań, zawsze z tym samym ziarnem (wspólne liczby losowe), więc pasmo przesuwa się razem z kwotą bazową. Współczynniki w kodzie nazwano `MODULE_CV`, ale we wzorze `exp(σ × z − σ² / 2)` pełnią rolę **odchylenia w skali logarytmicznej**: σ = 0,35 dla błędów oraz 0,25 dla rotacji i wypalenia. Nie należy przedstawiać ich jako dokładnego współczynnika zmienności kwot.

`rho = 0,5` jest wagą wspólnego szoku. Korelacja normalnych szoków przed potęgowaniem wynosi `rho² = 0,25`, a nie 0,5. Pasmo nie losuje oceny klimatu, końców krzywych, błędów danych wejściowych ani wszystkich możliwych struktur modelu. Rozrzut jest priorem, nie wynikiem estymacji na panelu firm. Stałe ziarno stabilizuje porównania scenariuszy; nie zwiększa wiarygodności empirycznej.

## Efekt mrożenia i publikacje z 2016 r.

„Efekt mrożenia” opisuje tu powstrzymywanie się od zgłaszania problemów z obawy przed konsekwencjami. Nie dodajemy stałej kwoty ani automatycznego odjęcia punktów klimatu na podstawie samej etykiety zjawiska.

- Kiewitz i współautorzy analizowali nadużycia przełożonych, strach i milczenie obronne w trzech badaniach. Silniejsze postrzeganie klimatu strachu nasilało niekorzystną relację strachu z milczeniem. To podstawa opisu mechanizmu, nie przelicznik pieniężny. [Kiewitz i in. (2016), DOI 10.1037/apl0000074](https://pubmed.ncbi.nlm.nih.gov/26727209/).
- Adamska rozróżnia milczenie związane ze społecznie podzielanymi przekonaniami oraz milczenie jako taktykę. Podział i omówienie przełamywania milczenia nie ustanawiają użytych w silniku wartości `automaticShare` ani kary 0,04. [Adamska (2016), DOI 10.18290/rpsych.2016.19.1-3pl](https://ojs.tnkul.pl/index.php/rpsych/article/view/618).
- Penney badał ruch do wrażliwych tematycznie artykułów Wikipedii po ujawnieniach nadzoru NSA/PRISM w 2013 r. Publikacja z 2016 r. dotyczy nadzoru państwowego i zachowania internautów. Nie uzasadnia przeniesienia wielkości efektu na pracowników, klimat firmy ani złote. [Penney (2016), pełny tekst](https://btlj.org/data/articles2016/vol31/31_1/0117_0182_Penney_ChillingEffects_WEB.pdf).

Przeniesienie pojęcia na kalkulator jest interpretacją autora. Klimat, ukrywanie błędów oraz korekta milczenia automatycznego już reprezentują powiązane mechanizmy. Osobna pozycja pieniężna wymagałaby dowodu, że obejmuje rozłączny koszt. W diagnozie szukaj zbiorczych informacji o obawie przed odwetem, rezygnacji ze zgłoszenia oraz reakcji na wcześniejsze zgłoszenia. Nie obniżaj drugi raz klimatu, jeżeli respondent uwzględnił te zachowania w swoim szacunku.

## Jak wykonać analizę bez zmieniania wspólnego silnika

`fnpAnalysisParams` łączy domyślne ustawienia FNP z `params.overrides`, a potem zawsze nakłada `TURNOVER_DECLARED` wynikający z `turnoverPct`. Podawaj deklarację przez `turnoverPct`; nie próbuj zmieniać jej równocześnie w dwóch miejscach. Rozkład zdarzeń podawaj jako `problemDist`, poza obiektem `overrides`.

Obsługiwane overrides przydatne w sumie publicznej to `K_SIGMOID_MULT`, `HIRSCHMAN_EXIT_AMPLIFIER`, `TURNOVER_CLIMATE_WEIGHT`, `AUTOMATIC_SILENCE_PENALTY`, `OVERLAP_CORRECTIONS`, `OVERLAP_GLOBAL` i `MODULE_INTERACTIONS`. Silnik sprawdza każdy override: wartość musi być skończoną liczbą w dozwolonym zakresie (np. `K_SIGMOID_MULT` w (0, 5], wagi i stopy w [0, 1]); `null`, `NaN`, napis, wartość spoza zakresu albo nieznana nazwa (np. dawne `PL_AVG_TURNOVER` czy `SILENCE_WEIGHTS_NORMALIZED`) kończą się błędem. `undefined` oznacza „nie podano”. Przekazując własne `MODULE_INTERACTIONS`, zacznij od `FNP_MODULE_INTERACTIONS` z `fnpModel.js`, inaczej wrócą usunięte powiązania. Stałe bez override wymagają osobnej, opisanej zmiany formuły, najlepiej w źródłowym silniku Silence Tax, a potem przeniesienia poprawki do FNP.

Częściowa mapa `OVERLAP_CORRECTIONS` zmienia tylko wymienione obszary, pozostałe zachowują wartości domyślne. Nie modyfikuj importowanych obiektów w miejscu. Dla scenariusza firmy kopiuj `FNP_PROBLEM_DIST`; nie zmieniaj `DEFAULT_PROBLEM_DIST` wspólnego silnika.

API nie waliduje wszystkich niestandardowych rozkładów zdarzeń. Przed obliczeniem sprawdź skończoność wartości: częstości i koszty muszą być nieujemne, podatność na ukrycie mieścić się w 0–1, a mnożnik kosztu późnego wynosić co najmniej 1. Zerowa podatność jest obsługiwana, oznacza brak ukrywania. Adapter silnika zastępuje `employees: 0` wartością 1; autonomię 0 zachowuje (pusta autonomia oznacza 0,5). Publiczny formularz odrzuca FTE poniżej 1 i nie udostępnia pola autonomii.

Poniższy przykład uruchom w katalogu repozytorium. Pokazuje jedną zmianę naraz. Wartości alternatywne są wyłącznie ilustracją wrażliwości, nie rekomendacją kalibracji.

```bash
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { computeFnpAnalysis, FNP_PROBLEM_DIST } from './src/fnpModel.js';

const input = {
  revenue: 100_000_000,
  employees: 500,
  avgSalary: 90_000, // Roczna płaca brutto na FTE.
  turnoverPct: 16, // Wymagana; kwota rotacji rośnie proporcjonalnie do niej.
  safety: 41, // Szacunek własny 0–100; puste pole kończy się błędem.
  scopeMode: 'conservative',
  safetySource: 'estimate',
};
const scenarios = [
  ['FNP', {}], // Ok. 3 146 247 zł, 3,15% przychodu (wersja kodu z 4.10.2026).
  ['Rotacja 8% zamiast 16%', { turnoverPct: 8 }],
  ['Cały udział klimatu w rotacji (waga 1)', {
    overrides: { TURNOVER_CLIMATE_WEIGHT: 1 },
  }],
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
