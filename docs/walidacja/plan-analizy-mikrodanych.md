# Plan analizy mikrodanych Ipsos × FNP 2026 dla Kalkulatora Rezyliencji FNP

Stan: 4 października 2026 r. Dokument dla psychometry lub analityka Fundacji oraz dla inżyniera, który przygotuje skrypt. Dotyczy luk 12 (końce krzywych), 13 (średnia 41) i 14 (skala klimatu 0–100). Nie zawiera kodu poza pseudokodem.

Zasada nadrzędna: **najpierw zapisujemy plan i reguły decyzji, potem otwieramy dane**. Wersję tego dokumentu z datą i skrótem SHA-256 trzeba zapisać (OSF, repozytorium lub e-mail do Fundacji z załącznikiem) przed pierwszym uruchomieniem analizy na mikrodanych.

## 1. Co model dziś zakłada (punkt wyjścia)

Plik `src/logic/constants.js:3-16` zawiera 12 wskaźników `METRICS`. Każdy liczony jest krzywą (`src/logic/sigmoid.js:3-15`):

`wartość(s) = low + (high − low) / (1 + exp(−k × K × (s − mid′)))`

gdzie `s` to klimat 0–100, `K` to globalny mnożnik stromości (0,4 w silniku, 0,30 w trybie ostrożnym FNP, `constants.js:87`, `constants.js:203`), a `mid′ = mid + 4` dla czterech wskaźników lęku (`blameRate`, `errorFear`, `snitchPerc`, `destructiveFear`; `constants.js:27`, `constants.js:238`).

Ważna własność, którą audyt musi uwzględnić: przy `K = 0,30` krzywe są tak płaskie, że **wartości `low` i `high` są asymptotami, których model nigdy nie osiąga w przedziale 0–100**. Wartości modelu FNP (obliczone na bieżącym kodzie, wersja z 3.10.2026):

| Wskaźnik | `low` / `high` w kodzie | model przy s = 0 | s = 15 | s = 41 | s = 85 | s = 100 |
|---|---|---:|---:|---:|---:|---:|
| blameRate | 0,72 / 0,02 | 0,62 | 0,56 | 0,42 | 0,17 | 0,12 |
| errorFear | 0,72 / 0,05 | 0,60 | 0,55 | 0,44 | 0,23 | 0,18 |
| teamStability | 0,59 / 0,85 | 0,66 | 0,67 | 0,71 | 0,76 | 0,78 |
| helpComfort | 0,21 / 0,99 | 0,38 | 0,44 | 0,55 | 0,75 | 0,80 |
| burnoutRate | 0,51 / 0,08 | 0,39 | 0,37 | 0,32 | 0,24 | 0,21 |
| ideaSilence | 0,52 / 0,10 | 0,43 | 0,40 | 0,33 | 0,21 | 0,18 |
| passivity | 0,59 / 0,08 | 0,46 | 0,42 | 0,36 | 0,25 | 0,21 |
| riskAversion | 0,70 / 0,15 | 0,57 | 0,53 | 0,45 | 0,32 | 0,28 |
| procedureUse | 0,39 / 0,79 | 0,50 | 0,52 | 0,56 | 0,64 | 0,67 |
| snitchPerc | 0,55 / 0,10 | 0,47 | 0,43 | 0,35 | 0,21 | 0,18 |
| workJoy | 0,19 / 0,70 | 0,32 | 0,35 | 0,42 | 0,53 | 0,56 |
| destructiveFear | 0,74 / 0,19 | 0,65 | 0,60 | 0,50 | 0,32 | 0,28 |

Wniosek dla audytu: porównanie „72% w danych wobec 0,72 w kodzie” sprawdza tylko, czy autor dobrze przepisał liczbę z raportu. Nie sprawdza modelu. Model przy klimacie typowym dla dolnej ćwiartki (np. s ≈ 15) daje 0,56, nie 0,72. Dlatego audyt ma **dwa poziomy**: (A) zgodność parametru z raportem i danymi, (B) zgodność wartości modelu z danymi w tych samych grupach.

## 2. Dane wejściowe

Wymagane (szczegóły w `prosba-o-dane-ipsos.md`):

1. Plik mikrodanych na poziomie respondenta (n ≈ 1000), wszystkie zmienne kwestionariusza, w formacie SPSS (.sav) lub CSV z księgą kodów.
2. Waga analityczna (ostateczna, po kalibracji) i opis jej konstrukcji: zmienne ważenia, źródło struktury populacji, przycinanie wag.
3. Pełny kwestionariusz w wersji, którą widzieli respondenci (z filtrami i kolejnością), oraz raport metodologiczny Ipsos (termin realizacji, panel, kwoty, wskaźnik realizacji, kryteria odrzucenia ankiet).
4. Definicja indeksu bezpieczeństwa psychologicznego użytego w raporcie (pozycje, kodowanie, odwrócenia, sposób sumowania, przeskalowanie) oraz definicje grup „niskie” i „wysokie” BP oraz „ćwiartka o najniższym BP”.
5. Tabele raportu (lub plik tabel Ipsos) dla liczb przypisanych modelowi: 72%, 2%, 42%, 59%, 85%, 21%, 99%, 51%, 52%, 10%, 70%, 56%, 39%, 79%, 36% (lub 35%), 19%, 70%, 74%, 19%, średnia 41, rozkład 14/17/40/15/14.
6. Zmienne stratyfikacyjne: branża (sekcja PKD lub grupowanie Ipsos), wielkość firmy, stanowisko (szeregowe, kierownik zespołu, średnie kierownictwo, zarząd), staż, płeć, wiek, region.

## 3. Mapowanie 12 wskaźników na pytania (do potwierdzenia przez Fundację)

Kolumna „Kandydat” to hipoteza z nazwy wskaźnika, pola `src` w kodzie i liczb potwierdzonych publicznie (rejestr źródeł, wiersz 37). Tam, gdzie piszę „zapytać”, nie da się ustalić pytania bez kwestionariusza.

| # | Wskaźnik (kod) | Liczby przypisane w kodzie (`src`) | Kandydat na pytanie Ipsos | Status publiczny | Co trzeba ustalić |
|---|---|---|---|---|---|
| 1 | blameRate | 72% vs 2% | Twierdzenie o tym, że za błędy szuka się winnych / błędy są wykorzystywane przeciwko pracownikowi | 42% ogółu „błędy wykorzystywane przeciwko pracownikowi” potwierdzone publicznie; 72% i 2% nie | Czy 42% i 72% dotyczą tego samego pytania co `errorFear` (pole `src` przypisuje 42% i 72% wskaźnikowi `errorFear`). Jeśli tak, dwa wskaźniki opierają się na jednym pytaniu i nie są niezależne. |
| 2 | errorFear | „42% ogół, 72% low” | Ukrywanie lub niezgłaszanie własnych błędów | 72% „ukrywa błędy w ćwiartce o najniższym BP” niepotwierdzone publicznie | Pytanie, skala, próg kodowania „tak”; definicja „ćwiartki”; skąd 5% (koniec `high`, bez źródła w `src`). |
| 3 | teamStability | 59% vs 85% | Deklarowana stabilność zespołu | 85% wobec 59% potwierdzone publicznie | Czy grupy to „wysokie BP” vs „króluje strach” (jak w komunikacie) i jak je zdefiniowano. |
| 4 | helpComfort | 21% vs 99% | Swoboda proszenia o pomoc | brak | Czy to pozycja wchodząca do indeksu BP (wtedy kolistość, patrz pkt 4.3). 99% wymaga sprawdzenia liczebności grupy. |
| 5 | burnoutRate | „51% low, est. 8% high” | Objawy wypalenia / poczucie wypalenia | 51% w zespołach o niskim BP potwierdzone publicznie | 8% jest szacunkiem autora według samego kodu. Pytanie i próg. |
| 6 | ideaSilence | 52% vs 10% | Zatrzymywanie pomysłów dla siebie | 52% niepotwierdzone publicznie | Pytanie i grupa, do której odnosi się 52% (ogół czy niskie BP). |
| 7 | passivity | „59% low” | „Nie warto się wychylać” / „nie wtrącam się” | 59% w zespołach o niskim BP potwierdzone publicznie | Koniec `high` 8% bez źródła w `src`. |
| 8 | riskAversion | „56% ogół, 70% low” | Obawa przed podejmowaniem ryzyka | 56% ogółu potwierdzone publicznie; 70% nie | Koniec `high` 15% bez źródła w `src`. |
| 9 | procedureUse | 39% vs 79% | Znajomość procedur (np. zgłaszania nieprawidłowości) | brak | Pytanie: o jakie procedury chodzi. |
| 10 | snitchPerc | „5% vs 41% neg” | Zgłaszanie usprawnień postrzegane jako donosicielstwo | 36% ogółu na stronie FNP (repozytorium pisało 35%) | **Niespójność w kodzie:** `src` mówi 5% i 41%, a parametry to 0,55 i 0,10. Trzeba ustalić, które liczby pochodzą z raportu. |
| 11 | workJoy | 19% vs 70% | „Pracuje się wspaniale” lub podobna ocena miejsca pracy | brak | Pytanie i próg. |
| 12 | destructiveFear | 74% vs 19% | Lęk paraliżujący lub szkodzący pracy | brak | Pytanie; czy to pozycja indeksu BP. |

Dodatkowo: w starszej wersji strony padały liczby 68% i 73% „w bezpiecznym środowisku” (rejestr, wiersz 37). Trzeba ustalić, czego dotyczą, i czy powinny trafić do tej tabeli.

## 4. Indeks klimatu 0–100 (wspólny dla luk 12, 13 i 14)

### 4.1 Kolejność decyzji

1. **Odtworzenie indeksu z raportu.** Jeśli Fundacja lub Ipsos podadzą definicję indeksu, liczymy go dokładnie według niej i porównujemy średnią ważoną z 41 oraz rozkład pięciu przedziałów z `PL_DISTRIBUTION` (`constants.js:302-308`: 14/17/40/15/14).
2. **Jeśli definicji nie ma:** psychometra wybiera pozycje mierzące bezpieczeństwo psychologiczne (treściowo bliskie konstruktowi Edmondson 1999: ryzyko interpersonalne, mówienie o błędach, proszenie o pomoc, odmienne zdanie), **przed** spojrzeniem na związki z 12 wskaźnikami. Lista pozycji i kierunek kodowania zostają zapisane w planie.
3. **Rozdział pozycji indeksu i pozycji wyniku.** Pozycja nie może jednocześnie budować indeksu i być wskaźnikiem, którego krzywą sprawdzamy. Jeśli pozycja należy do indeksu z raportu (np. „błędy są wykorzystywane przeciwko pracownikowi” jest w treści bliska pierwszej pozycji skali Edmondson), dla tego wskaźnika liczymy indeks bez tej pozycji („indeks reszty”) i raportujemy oba wyniki.

### 4.2 Konstrukcja wyniku 0–100

- Wariant podstawowy: średnia z pozycji po odwróceniu negatywnych, przeskalowana liniowo: `(średnia − min_skali) / (max_skali − min_skali) × 100`. To ta sama reguła, której używa narzędzie wsadowe (`docs/WSAD.md`: likert7 `(średnia − 1) / 6 × 100`).
- Braki danych: wynik liczony, gdy respondent odpowiedział na co najmniej 80% pozycji indeksu; odpowiedzi „trudno powiedzieć” traktowane jako brak (decyzja do zapisania przed analizą; wariant wrażliwości: kodowanie jako środek skali).
- Wariant wrażliwości: wynik czynnikowy z modelu jednoczynnikowego (CFA, estymator WLSMV dla pozycji porządkowych) przekształcony do skali 0–100 przez percentyle. Wariant ten nie zastępuje podstawowego, bo firmy klienta muszą dostać wynik liczony tą samą prostą regułą.

### 4.3 Kontrole psychometryczne indeksu (na danych Ipsos)

| Kontrola | Statystyka | Próg do zapisania przed analizą (propozycja) |
|---|---|---|
| Jednowymiarowość | CFA jednoczynnikowa: CFI, TLI, RMSEA, SRMR | CFI ≥ 0,95, RMSEA ≤ 0,08, SRMR ≤ 0,08; przy gorszym dopasowaniu raportujemy strukturę i nie używamy jednego wyniku bez decyzji psychometry |
| Rzetelność | omega McDonalda, alfa Cronbacha, korelacje pozycja–reszta | omega ≥ 0,80 dla użycia na poziomie zespołu |
| Rozkład | średnia ważona, SD, percentyle 5–95, efekt podłogi i sufitu | odsetek wyników 0 i 100 poniżej 15% |
| Niezmienność pomiaru | wielogrupowa CFA (konfiguralna, metryczna, skalarna) według stanowiska, wielkości firmy, branży | ΔCFI nie gorsze niż −0,01 między kolejnymi poziomami (kryterium przypisywane Chenowi 2007; liczby widziane tylko w źródłach wtórnych, psychometra sprawdza w oryginale); przy braku niezmienności skalarnej nie porównujemy średnich między tymi grupami |
| Zgodność z raportem | średnia ważona i rozkład w pięciu przedziałach | patrz reguła w sekcji 6 |

## 5. Audyt końców krzywych (luka 12)

### 5.1 Definicje grup „niskie” i „wysokie” BP

Pre-specyfikujemy trzy definicje i raportujemy wszystkie. Główna jest ta, której użył raport, jeśli jest znana.

| Definicja | Opis | Zaleta | Wada |
|---|---|---|---|
| D1: definicja raportu | dokładnie jak w raporcie (np. „ćwiartka o najniższym BP”) | sprawdza, czy liczba w kodzie odpowiada raportowi | może się różnić między liczbami (ćwiartka, „niskie BP”, „króluje strach”) |
| D2: kwartyle ważone indeksu | dolna i górna ćwiartka według wagi analitycznej | porównywalna między wskaźnikami | grupy mają różną średnią klimatu, więc porównujemy z modelem w punkcie średniej grupy |
| D3: stałe progi | np. s < 25 i s ≥ 75 na skali 0–100 | odpowiada językowi suwaka (kotwice 10 i 92) | grupy mogą być małe; raportujemy n |

### 5.2 Statystyki do raportowania w każdej grupie i dla każdego wskaźnika

- n nieważone, suma wag, efektywne n Kisha `n_eff = (Σw)² / Σw²`;
- odsetek ważony z 95% przedziałem ufności (Wilson lub logit, z uwzględnieniem wag przez `n_eff`; jeśli Ipsos poda warstwy i klastry, użyć estymacji z planem próby);
- średnia ważona indeksu w grupie (`s̄_grupy`) i jej przedział;
- wartość modelu w punkcie `s̄_grupy` przy ustawieniach FNP (`K = 0,30`, przesunięcie +4 dla lęku);
- różnica „dane − parametr `low`/`high`” i „dane − model(`s̄_grupy`)” w punktach procentowych z 95% przedziałem.

Orientacyjna precyzja: przy n_eff ≈ 170 w ćwiartce (n = 250, efekt ważenia około 1,5) połowa szerokości 95% przedziału wynosi około 7,5 pkt proc. dla odsetka 50%, 6,9 pkt dla 30% i 4,5 pkt dla 10%.

### 5.3 Reguła zgodności (zapisać przed analizą)

Margines równoważności: **±10 punktów procentowych** (propozycja; psychometra może zmienić przed otwarciem danych, nie po). Dla każdego wskaźnika, każdego końca i każdego poziomu (A: parametr, B: model w punkcie grupy):

- **Zgodny:** cały 90% przedział różnicy mieści się w ±10 pkt (test równoważności TOST na poziomie 5%).
- **Niezgodny:** cały 95% przedział różnicy leży poza ±10 pkt.
- **Nierozstrzygnięty:** pozostałe przypadki, w tym zbyt mała grupa (n_eff < 50).
- **Nie do sprawdzenia:** brak pytania odpowiadającego wskaźnikowi lub niezgodna definicja (np. inne pytanie, inny próg kodowania).

Dodatkowo kierunek: wskaźnik, którego odsetek nie zmienia się monotonicznie z klimatem (test trendu w pięciu przedziałach), dostaje adnotację „kierunek niepotwierdzony”, niezależnie od końców.

### 5.4 Szablon tabeli audytu (jeden wiersz na wskaźnik i definicję grupy)

| Wskaźnik | Pytanie (nr, brzmienie, kodowanie „tak”) | Definicja grup | Grupa | n | n_eff | s̄ grupy | Dane: odsetek (95% PU) | Parametr w kodzie | Dane − parametr (95% PU) | Model(s̄) FNP | Dane − model (95% PU) | Status A | Status B | Uwagi |
|---|---|---|---|---:|---:|---:|---|---:|---|---:|---|---|---|---|
| blameRate | | D1 | niskie | | | | | 0,72 | | | | | | |
| blameRate | | D1 | wysokie | | | | | 0,02 | | | | | | |
| … (12 wskaźników × 2 końce × 3 definicje) | | | | | | | | | | | | | | |

## 6. Średnia 41 i rozkład krajowy (luka 13)

- Liczymy ważoną średnią indeksu z 95% przedziałem (linearyzacja lub bootstrap z wagami) oraz nieważoną średnią i medianę. Komentarz w `constants.js:310-329` twierdzi, że 41 to „średnia surowej próby”. Trzeba sprawdzić obie wersje, bo raport mógł podać nieważoną.
- Liczymy rozkład w pięciu przedziałach `PL_DISTRIBUTION` i porównujemy z 14/17/40/15/14. Najpierw trzeba ustalić granice przedziałów: kod podaje tylko środki (15, 30, 45, 65, 85).
- Reguła decyzji (zapisać przed analizą):
  1. Indeks odtworzony i średnia ważona w przedziale 39–43: zostaje 41 z przypisem „Ipsos × FNP 2026, średnia ważona indeksu X, n = …, tabela …”.
  2. Indeks odtworzony, średnia poza 39–43: stała przyjmuje wartość z danych (zaokrągloną do liczby całkowitej), test `fnp.test.js` dla firmy przykładowej trzeba przeliczyć i opisać zmianę w `PRIORY.md`. Nie wolno dobierać innych parametrów tak, aby suma wróciła do poprzedniej kwoty.
  3. Indeksu nie da się odtworzyć: usuwamy etykietę „polska średnia” i domyślną wartość suwaka zastępujemy neutralnym punktem (np. 50) z opisem „wartość startowa, nie średnia”; jako kontekst podajemy wyłącznie publicznie potwierdzone liczby (71% itd.).

## 7. Estymacja krzywych zamiast przyjmowania ich kształtu

### 7.1 Modele

Dla każdego wskaźnika binarnego `y` (po zapisanym przed analizą progu kodowania) i indeksu `s` (lub indeksu reszty):

1. **M1, regresja logistyczna ważona:** `logit P(y = 1) = a + b × s`. Dwa parametry na wskaźnik. Odpowiada dokładnie postaci krzywej w kodzie przy `low = 0`, `high = 1` (lub odwrotnie dla wskaźników malejących), `k = |b|`, `mid = −a / b`. Model kalkulatora może więc przyjąć wynik bez zmiany wzoru.
2. **M2, przedziały z dopasowaniem monotonicznym:** odsetki ważone w 10 przedziałach decylowych indeksu, następnie regresja izotoniczna. Sprawdza, czy kształt logistyczny w ogóle pasuje (porównanie M1 i M2: maksymalna różnica w punktach przedziałów).
3. **M3 (wrażliwość), logistyka czteroparametrowa** z asymptotami: tylko gdy M2 wyraźnie pokazuje plateau poniżej 0 lub 1 w obu końcach. Przy n ≈ 1000 i małej liczbie osób przy skrajnych wartościach indeksu asymptoty są słabo identyfikowane. Nie raportujemy wartości poza obserwowanym zakresem indeksu (poza 5. i 95. percentylem) jako wyników.
4. **M4 (wrażliwość), M1 z kontrolą** stanowiska, wielkości firmy, branży, wieku i płci. Różnica między M1 i M4 pokazuje, ile związku przypada na skład grup. Do modelu kalkulatora trafia M1 (kalkulator nie zna tych cech), a M4 jest raportowany jako ograniczenie.

### 7.2 Co ta estymacja zastąpi w modelu

| Dziś (autorskie) | Po estymacji |
|---|---|
| `low`, `high` przypisane raportowi | wartości dopasowanej krzywej w zakresie obserwowanym; asymptoty 0 i 1 w M1 |
| `mid` (45–55) i `k` (0,06–0,12) wybrane przez autora | `mid = −a/b`, `k = |b|` z M1, z przedziałami ufności z bootstrapu |
| przesunięcie +4 dla wskaźników lęku (`LOSS_AVERSION_SHIFT`) | zbędne: przesunięcie jest już w danych. Przy wpisaniu estymat trzeba je wyłączyć albo odjąć 4 od `mid`, inaczej zostanie naliczone drugi raz |
| globalny `K = 0,4 / 0,30` dobrany do docelowych sum | `K = 1`: stromość pochodzi z danych. `K` przestaje być parametrem do strojenia |

### 7.3 Realia próby n ≈ 1000

Symulacja (logistyka o kształcie podobnym do `burnoutRate`, indeks o średniej 41 i SD 20, próba prosta, 2000 powtórzeń): błąd standardowy dopasowanej wartości wynosi około 3,2 pkt proc. przy s = 10, 1,7 pkt przy s = 90, a nachylenie `b` jest oszacowane z błędem około 12% swojej wartości. Przy wagach z efektem około 1,5 te błędy rosną mniej więcej o 22%. Precyzja jest więc wystarczająca dla dwuparametrowej krzywej w środku i umiarkowanie w końcach skali, ale niewystarczająca dla wiarygodnych asymptot i podziałów na branże (grupy po 100–200 osób).

### 7.4 Czego to nie zwaliduje (zapisać w raporcie wprost)

- Dane mówią o **związku między odpowiedziami tej samej osoby** w jednym momencie. To nie jest efekt przyczynowy: osoba wypalona może oceniać klimat gorzej (odwrotny kierunek), a wspólna metoda (ta sama ankieta) zawyża związek.
- To jest poziom **jednostki**, a model liczy **firmę**. Odsetek w firmie o średnim klimacie s̄ to średnia `P(y | s_i)` po pracownikach, nie `P(y | s̄)`. Przy nieliniowej krzywej i dużym rozrzucie w firmie te dwie liczby się różnią (nierówność Jensena). Silnik ma tryb segmentów zespołów (`teamSegments`, `modules.js:241-251`), który częściowo to łagodzi.
- Krzywe nie walidują **przeliczników na złote**. Estymacja może pokazać, że wskaźniki zmieniają się z klimatem bardziej stromo niż w modelu (np. jeśli 59% i 85% stabilności potwierdzi się dla ćwiartek, dane będą około 3 razy bardziej strome niż model przy `K = 0,30`, w którym ta różnica wynosi około 9 pkt proc.). Wtedy przy niezmienionych przelicznikach suma wzrośnie: dla firmy przykładowej przy `K = 1` wynosi 6,68% przychodu zamiast 3,12%. `K` było dobierane do sum razem z przelicznikami, więc **krzywych i przeliczników nie da się poprawiać osobno**. Trzeba to zapisać przed analizą (sekcja 9).

## 8. Wyniki do przekazania do modelu

Skrypt zapisuje plik `kalibracja-ipsos-<data>.json` (bez danych jednostkowych) o strukturze:

```
{
  "wersja_planu": "<sha256 tego dokumentu>",
  "indeks": { "pozycje": [...], "kodowanie": "...", "srednia_wazona": x, "pu95": [l, u], "srednia_niewazona": x, "percentyle": {...}, "omega": x, "cfa": {...} },
  "rozklad_5": { "granice": [...], "odsetki_wazone": [...] },
  "metryki": {
    "blameRate": {
      "pytanie": "Q..", "prog_kodowania": "...",
      "audyt": [ { "definicja": "D1", "grupa": "niskie", "n": .., "n_eff": .., "s_sr": .., "p": .., "pu95": [..], "parametr": 0.72, "model_FNP": .., "status_A": "...", "status_B": "..." }, ... ],
      "M1": { "a": .., "b": .., "bootstrap_pu95_a": [..], "bootstrap_pu95_b": [..], "mid": .., "k": .., "zakres_s": [p5, p95] },
      "M2": { "przedzialy": [...], "odsetki": [...] },
      "M4": { "b_skorygowane": .., "pu95": [..] },
      "monotonicznosc": "tak|nie|niejasne"
    }, ...
  }
}
```

Inżynier przekłada `M1` na nowy, osobny zestaw stałych (np. `METRICS_IPSOS_FIT`) z `K_SIGMOID_MULT = 1` i wyłączonym przesunięciem lęku, **nie nadpisując** `METRICS` używanego przez `logic.test.js`. Decyzja o przełączeniu publicznego kalkulatora należy do autora i Fundacji, po przeczytaniu sekcji 9.

## 9. Pre-specyfikacja: czego nie wolno robić po zobaczeniu wyników

1. Nie wolno zmieniać listy pozycji indeksu, progów kodowania, definicji grup ani marginesu ±10 pkt po pierwszym uruchomieniu na danych. Zmiana po fakcie jest dozwolona tylko jako opisane odstępstwo, z wynikami obu wersji.
2. Nie wolno wybierać wariantu (D1/D2/D3, M1/M3, ważony/nieważony) według tego, który daje sumę bliższą 5% przychodu.
3. Jeśli krzywe z danych podniosą sumę firmy przykładowej powyżej 5%, nie wolno przywracać `K < 1` ani obniżać przeliczników tylko po to, by wrócić poniżej 5%. Dopuszczalne decyzje (wybrać jedną teraz, przed danymi): (a) publikujemy wyższy procent i zmieniamy komunikację kontraktu; (b) zostawiamy publiczny kalkulator na priorach z adnotacją „krzywe z danych dają wyższy scenariusz” i pokazujemy oba; (c) równolegle zastępujemy przeliczniki danymi firm (luka 15), a do tego czasu nie przełączamy krzywych.
4. Każdy wskaźnik raportujemy, także gdy wynik jest niewygodny (brak monotoniczności, brak pytania).
5. Analizę wykonuje osoba, która nie ustala parametrów modelu (psychometra lub analityk Fundacji), a autor dostaje gotową tabelę.

## 10. Kontrole techniczne skryptu

- Zgodność z raportem: odtworzenie co najmniej trzech liczb opublikowanych (71%, 42%, 85% wobec 59%) z dokładnością do 1 pkt proc. przed jakąkolwiek nową analizą. Brak zgodności zatrzymuje analizę do wyjaśnienia z Ipsos.
- Suma wag równa n lub populacji, zgodnie z dokumentacją; brak wag ujemnych i zerowych; raport CV wag i efektu Kisha `1 + CV²`.
- Liczba braków na pozycję; respondenci z jednakowymi odpowiedziami we wszystkich pozycjach indeksu (raportować, nie usuwać bez reguły).
- Ziarno losowania bootstrapu zapisane; 2000 replikacji.
- Wynik bez danych jednostkowych: żadna komórka tabeli z n < 30 nie jest raportowana jako odsetek (tylko „n < 30”).
- Skrót SHA-256 pliku danych wejściowych i pliku wyników.

## 11. Pseudokod

```
wczytaj dane, wagi, księgę kodów
sprawdź: odtworzenie 71%, 42%, 85%/59% (STOP przy niezgodności)
zbuduj indeks wg zapisanej definicji -> s (0–100); indeks reszty dla pozycji wspólnych
raport psychometryczny indeksu (CFA, omega, niezmienność, rozkład)
średnia ważona s, PU95; rozkład 5 przedziałów; decyzja wg sekcji 6
dla każdego wskaźnika m:
    y = koduj(pytanie_m, prog_m)
    dla definicji D1, D2, D3:
        grupy niskie/wysokie -> n, n_eff, s̄, p, PU95
        porównaj z parametrem (low/high) i z model_FNP(s̄); status wg sekcji 5.3
    M1: ważona logistyka y ~ s; bootstrap a, b
    M2: decyle + izotonia; max |M1 − M2|
    M4: logistyka z kontrolami
zapisz JSON + tabele CSV + SHA-256
```
