# Luki 12–15 w Kalkulatorze Rezyliencji FNP: jak je zamknąć

Stan: 4 października 2026 r. Przygotowane przed spotkaniem z Fundacją Nowe Przestrzenie 6 października. Podstawa: kod FNP z 3.10.2026 (`src/logic/constants.js`, `src/logic/modules.js`, `src/fnpModel.js`), dokumenty `docs/PRIORY.md`, `docs/STAN-WIEDZY.md`, `docs/BRIEF-KALKULATOR-ODPOWIEDZI.md`, `docs/WSAD.md`, rejestr 46 źródeł (`podatekodmilczenia/research/REJESTR_ZRODEL_2026-10-03.md`), protokół walidacji (`Papers_2026-09-21/validation_protocol/v1.md`), formularz HR i protokół v2. Liczby dla firmy przykładowej obliczyłem na bieżącym kodzie. Każda liczba ze źródła zewnętrznego ma w spisie na końcu oznaczenie [P] (widziany dokument pierwotny), [A] (abstrakt lub rekord) albo [W] (źródło wtórne).

Pliki towarzyszące: `prosba-o-dane-ipsos.md` (gotowa prośba do Fundacji), `plan-analizy-mikrodanych.md` (specyfikacja analizy dla psychometry i inżyniera), `priory-a-dowody.md` (tabela dowodów dla przeliczników pieniężnych).

## Podsumowanie na jedną stronę

| Luka | Rekomendowane rozwiązanie | Czego potrzeba od Fundacji | Co można potem uczciwie powiedzieć | Pierwszy krok |
|---|---|---|---|---|
| 12. Końce 12 krzywych „przypisane Ipsos” | Audyt na mikrodanych na dwóch poziomach (liczba w kodzie wobec danych; wartość modelu w punkcie średniego klimatu grupy wobec danych), z regułą zgodności ±10 pkt proc. zapisaną przed analizą; równolegle estymacja krzywych regresją logistyczną jako osobny zestaw stałych | mikrodane, wagi, kwestionariusz, definicja indeksu BP i grup, numery tabel; analityk lub psychometra na 1–2 tygodnie | „Każdy z 12 wskaźników porównano z danymi Ipsos × FNP: zgodne X, niezgodne Y, nie do sprawdzenia Z”; po estymacji: „kształt zależności pochodzi z danych 1000 pracowników z Polski, nie z wyboru autora” (związek, nie przyczyna) | wysłać `prosba-o-dane-ipsos.md` z planem analizy i zapisać plan z sumą SHA-256 przed otwarciem danych |
| 13. Średnia 41 i odniesienie rotacji 14,8% | 41: odtworzyć z mikrodanych jako ważoną średnią tego samego indeksu, który dostaną firmy; reguła: 39–43 zostaje, inna wartość zastępuje, brak indeksu usuwa etykietę „polska średnia”. 14,8%: usunąć. Pole rotacji pytać wprost o odejścia z inicjatywy pracownika w 12 miesiącach; GUS pokazywać tylko jako kontekst z pełną definicją | definicja indeksu i mikrodane (wspólne z luką 12) | „Punkt odniesienia klimatu to średnia ważona indeksu Ipsos × FNP 2026 (n, przedział)”; „model nie używa żadnej krajowej stopy rotacji; liczy na Twojej deklaracji” | dziś: zamienić w dokumentach źródło GUS na RSP 2025, tabl. 1 (25); otworzyć zadanie usunięcia 14,8% w silniku źródłowym |
| 14. Wynik ankiety a klimat 0–100 | Opcja (a): indeks jako stała funkcja wybranych pytań Ipsos, liczony identycznie w próbie krajowej i w firmie; wynik firmy na skali benchmarku z definicji. Suwak zostaje tylko w wersji bezpłatnej; w pilotażu zbieramy suwak i ankietę, żeby oszacować różnicę | prawo do użycia brzmienia pytań w płatnej ankiecie; psychometra: struktura, rzetelność, niezmienność według stanowiska, wielkości i branży na danych Ipsos; reguły agregacji | „Wynik firmy liczony jest tymi samymi pytaniami i tą samą regułą co w badaniu krajowym”; po pilotażu: zgodność w zespołach (ICC, rwg) i różnica między oceną kierownictwa a ankietą | poprosić psychometrę o listę pozycji indeksu i regułę liczenia, zanim ktokolwiek zobaczy związki z wynikami |
| 15. Przeliczniki na złote | Dwie kolumny w raporcie płatnym: „Twoje dane” i „założenie autora”, w których dane firmy zastępują priory (koszt odejścia, rotacja dobrowolna, absencja, koszt reklamacji i poprawek). Natychmiast: obniżyć lub opisać jako niezgodne z dowodami dwa priory (zastąpienie 0,75 i wypalenie ok. 0,24 płacy na osobę). Walidacja: 2 firmy to test wykonalności; 15 firm to opis; wniosek potwierdzający wymaga co najmniej 85 firm przy ρ = 0,30 | dostęp do danych HR pilotażowych firm; decyzja, czy pilotaż ma zespoły bez działań; umowa powierzenia | „W tej diagnozie X z Y przeliczników pochodzi z danych firmy”; po 15 firmach: „opis zgodności, bez wniosku o trafności” | poprawić formularz HR (definicje pól, patrz 15.4) i wysłać go dwóm firmom z pytaniem, które pola mają w systemach |

Najważniejsze ryzyka, w jednym zdaniu każde:

- **12:** dane Ipsos, jeśli potwierdzą liczby przypisane modelowi, są około trzy razy bardziej strome niż obecne krzywe przy `K = 0,30`, więc uczciwe podstawienie podniesie sumę (firma przykładowa: 6,68% przychodu przy `K = 1`), co zderza się z kontraktem „do 5%”.
- **13:** jeśli Fundacja nie ma jawnej definicji indeksu, liczba 41 nie jest odtwarzalna i trzeba ją usunąć jako „średnią polską”.
- **14:** badanie krajowe to panel internetowy, a ankieta w firmie jest zlecana przez pracodawcę; ten sam zestaw pytań może dać w firmie wyższe wyniki z powodu ostrożności respondentów, więc porównanie z benchmarkiem jest obciążone.
- **15:** dwa z trzech największych przeliczników są powyżej zakresu, który dają źródła z jawną metodą; 15 firm nie wystarczy, żeby cokolwiek potwierdzić lub obalić.

## Luka 12. Końce krzywych przypisane raportowi Ipsos × FNP

### 12.1 Czego nie wiemy i dlaczego to wpływa na kwotę

Model zamienia klimat 0–100 na 12 wskaźników zachowań (`src/logic/constants.js:3-16`). Trzy z nich bezpośrednio napędzają sumę w nagłówku:

- `teamStability` (59% / 85%) wyznacza modelową stopę odejść, a od niej koszt rotacji (`src/logic/modules.js:62-65`, `125-141`);
- `burnoutRate` (51% / 8%) wyznacza koszt wypalenia, czyli największą część sumy: 1,35 mln z 3,12 mln zł dla firmy przykładowej (`modules.js:143-145`);
- `errorFear` (72% / 5%) i `blameRate` (72% / 2%) wyznaczają odsetek ukrytych błędów (`modules.js:104-119`); do tego `ideaSilence` i `destructiveFear` wchodzą do wzmocnienia rotacji i wypalenia.

Nie wiemy trzech rzeczy:

1. **Czy te liczby w ogóle są w raporcie i do jakich pytań się odnoszą.** Publicznie potwierdzono tylko część (71%, 42%, 56%, 36%, 51%, 59%, 85% wobec 59%; rejestr źródeł, wiersz 37). Według pól `src` w samym kodzie cztery końce „wysokie” są szacunkiem autora, nie liczbą z raportu (`burnoutRate` „est. 8% high”, `passivity`, `errorFear`, `riskAversion` mają w `src` tylko koniec niski). W jednym wskaźniku kod jest wewnętrznie niespójny: `snitchPerc` ma `src: "5% vs 41% neg"`, a parametry 0,55 i 0,10.
2. **Jak zdefiniowano grupy „niskie” i „wysokie” BP.** Komunikaty mówią raz o „ćwiartce o najniższym BP”, raz o „zespołach o niskim BP”, raz o miejscach, „gdzie króluje strach”. To mogą być różne grupy.
3. **Jaki kształt ma zależność pośrodku skali.** Środki (`mid`) i stromości (`k`) są autorskie, a globalny mnożnik `K = 0,4` dobrano tak, aby sumy trafiły w docelowe procenty z rozprawy (`constants.js:186-203`); FNP obniża go do 0,30.

Ustalenie, którego nie było w dotychczasowych dokumentach: przy `K = 0,30` model **nigdy nie osiąga** końców przypisanych raportowi. `teamStability` przebiega od 0,66 (s = 0) do 0,78 (s = 100), a nie od 0,59 do 0,85; `burnoutRate` od 0,39 do 0,21, a nie od 0,51 do 0,08 (pełna tabela w `plan-analizy-mikrodanych.md`, sekcja 1). Nawet jeśli audyt potwierdzi liczby z raportu, model ich nie odtwarza: jest około trzy razy mniej stromy niż dane, które mu przypisano. Dlatego sam audyt „czy 0,72 jest w tabeli” nie wystarczy; trzeba porównać wartość modelu w punkcie średniego klimatu danej grupy z odsetkiem w danych.

Skutek dla klienta: jeśli dane potwierdzą strome zależności, a przeliczniki zostaną bez zmian, kwota wzrośnie. Dla firmy przykładowej (100 mln zł, 500 FTE, 90 tys. zł, rotacja 16%, s = 41) suma wynosi 3,12% przychodu przy `K = 0,30`, 3,84% przy 0,4, 5,03% przy 0,6 i 6,68% przy `K = 1` (krzywe bez spłaszczenia). Obliczenia: bieżący kod, `computeFnpAnalysis` z override `K_SIGMOID_MULT`.

### 12.2 Opcje

| Opcja | Czego wymaga | Co Fundacja może potem uczciwie powiedzieć | Główna słabość |
|---|---|---|---|
| A. Audyt tabel raportu (bez mikrodanych) | pełny raport PDF lub tabele Ipsos, kwestionariusz, definicje grup; 1–2 dni pracy autora i 1 dzień psychometry; koszt pomijalny | „Liczby w modelu odpowiadają (lub nie) tabelom X–Y raportu” | Sprawdza przepisanie liczb, nie model. Brak przedziałów ufności i brak informacji o środku skali |
| B. Audyt końców na mikrodanych (2 poziomy, 3 definicje grup) | mikrodane, wagi, księga kodów; analityk 3–5 dni; koszt rzędu kilku tysięcy zł, jeśli robi to zewnętrzny analityk | „Końce krzywych i wartości modelu w grupach porównano z danymi Ipsos × FNP; zgodne: …, niezgodne: …, nie do sprawdzenia: …” | Nadal tylko dwa punkty na krzywej; reguła zgodności zależy od marginesu, który trzeba ustalić wcześniej |
| C. Estymacja krzywych na mikrodanych (logistyka + kontrola monotoniczna) | to co B, plus 3–5 dni analityka; inżynier 1–2 dni na wpisanie wyników jako osobnego zestawu stałych | „Kształt zależności między klimatem a zachowaniami pochodzi z danych 1000 pracowników z Polski; mnożnik stromości nie jest już wybierany przez autora” | Związek indywidualny i przekrojowy, z tej samej ankiety. Nie mówi nic o złotych ani o przyczynowości. Prawdopodobnie podniesie sumę |
| D. Rezygnacja z przypisania do Ipsos | decyzja i zmiana opisu (godzina pracy) | „Krzywe są w całości założeniem autora; raport Ipsos jest tylko kontekstem” | Uczciwe, ale traci główny argument partnerstwa z Fundacją, która ma te dane |

### 12.3 Rekomendacja

**Przed pierwszym płatnym klientem: B, a C przygotowane jako wariant równoległy.** Fundacja ma dane, więc opcja A jest zbędnym krokiem pośrednim, chyba że mikrodane będą niedostępne przez tygodnie. B jest małe (kilka dni) i daje jasny wynik dla każdego wskaźnika. C wykonuje ten sam analityk na tych samych danych, ale jego wyniki trafiają do osobnego zestawu stałych i nie zmieniają publicznego kalkulatora, dopóki autor i Fundacja nie wybiorą jednej z decyzji zapisanych w planie analizy (sekcja 9: co robimy, jeśli krzywe z danych podniosą sumę ponad 5%).

Do tego czasu w opisach modelu: „końce krzywych przypisane raportowi, audyt w toku” zostaje, ale trzeba dopisać, że cztery końce są szacunkiem autora według samego kodu i że model przy `K = 0,30` nie osiąga tych wartości.

**W pilotażu:** krzywe z C porównać z danymi firm na poziomie zespołów (czy zespoły z niższym klimatem mają więcej odejść i absencji w rejestrach). To pierwszy sprawdzian, czy związek indywidualny przenosi się na zespół.

### 12.4 Pierwszy krok w poniedziałek

Wysłać do Fundacji prośbę o dane (`prosba-o-dane-ipsos.md`) z planem analizy w załączniku i poprosić o wskazanie analityka. Równolegle zapisać plan z datą i sumą SHA-256 (np. w repozytorium `podatekodmilczenia/research/`), zanim ktokolwiek otworzy dane.

## Luka 13. Dwie liczby odniesienia bez potwierdzonego źródła

### 13.1 Czego nie wiemy i dlaczego to wpływa na kwotę

**Klimat 41/100.** `PL_AVG_SAFETY = 41` (`constants.js:330`) to domyślna wartość suwaka w formularzu (`src/inputs.js:3`) i środek scenariuszy w rozprawie. Komentarz w kodzie mówi, że to „surowa średnia próby Ipsos” (n = 1000), a ważona średnia z pięciu przedziałów `PL_DISTRIBUTION` daje ok. 47 (`constants.js:310-329`). W materiałach publicznych tej liczby nie ma (rejestr, wiersz 37). Nie wiadomo, jaki indeks policzono, czy z wagami, ani czy da się go odtworzyć. Dla klienta: firma przykładowa przy 41 ma 3,12 mln zł, a przy 47 około 2,7 mln zł (sumy dla innych wartości klimatu: 15 → 4,91 mln, 60 → 1,87 mln). Każdy, kto zostawi suwak na wartości domyślnej, dostaje wynik zależny od tej liczby. Dodatkowo hasło „polska średnia 41” jest porównaniem, które firma odczyta jako benchmark.

**Rotacja 14,8%.** `PL_TURNOVER_RATE_GUS = 0,148` (`constants.js:358`) jest wartością domyślną przy pustej deklaracji (`src/fnpModel.js:37`). Nie pochodzi z GUS. W obecnym kodzie dla firmy przykładowej każda deklaracja od 9% do 100%, także pusta, daje tę samą kwotę rotacji (726 649 zł), bo deklaracja działa tylko jako górny limit. Liczba ta zacznie mieć znaczenie, gdy składnik rotacji zostanie przebudowany na proporcjonalny do deklaracji: wtedy wartość domyślna przesuwa wynik liniowo, a różnica między „wszystkimi odejściami” (18,7%) a „wypowiedzeniami przez pracownika” (ok. 2,8%) to prawie siedem razy.

### 13.2 Co faktycznie istnieje: polskie stopy odniesienia dla rotacji

| Źródło | Wartość | Co mierzy | Publikacja, tabela, rok | Dostęp |
|---|---|---|---|---|
| GUS, współczynnik zwolnień | 19,7% (2023), 18,7% (2024); np. przetwórstwo 17,7%, handel 21,8%, zakwaterowanie i gastronomia 31,3%, informacja i komunikacja 17,2%, usługi administrowania 60,1% (2024) | wszystkie rozwiązania stosunku pracy pełnozatrudnionych (wypowiedzenia obu stron, porozumienia, koniec umów terminowych, emerytury, zgony, przeniesienia), pomniejszone o odejścia na urlop wychowawczy, podzielone przez pełnozatrudnionych 31 XII roku poprzedniego; jednostki od 10 pracujących i sfera budżetowa; liczone zdarzenia, nie osoby | *Rocznik Statystyczny Pracy 2025*, dział III, tabl. 1 (25), s. 71 (według sekcji PKD), tabl. 2 (26) według województw; definicje w uwagach s. 69–70 | bezpłatnie [P] |
| GUS, współczynnik przyjęć | 20,3% (2023), 19,3% (2024) | przyjęcia pełnozatrudnionych na tej samej zasadzie | jw., tabl. 1 (25) | bezpłatnie [P] |
| GUS, zwolnienia według przyczyn | 2024: ogółem 1725,5 tys.; wypowiedzenie przez pracownika 255,6 tys.; przez pracodawcę 120,0 tys.; emerytura, renta, rehabilitacja 126,1 tys.; urlop wychowawczy 23,8 tys. (2023: 1821,8 / 287,4 / 132,6 / 135,3 / 25,0) | odejścia z wypowiedzenia przez pracownika to ok. 2,8% (2024) i ok. 3,2% (2023) zatrudnionych (wyliczone, mianownik odtworzony ze współczynnika; błąd ok. ±0,3 pkt). Porozumienia stron i końce umów terminowych (ok. 1,2 mln) nie są rozbite, więc to **dolna granica** odejść dobrowolnych | *Rocznik Statystyczny Pracy 2025*, tabl. 4 (28), s. 75–76 | bezpłatnie [P] |
| GUS, podział według wielkości firmy | nie znaleziono | | RSP 2025 dzieli tylko według sekcji i województw; Bank Danych Lokalnych nie sprawdzony | |
| PIE na mikrodanych BAEL | 7,5% osób pracujących odeszło z pracy w ciągu roku (2021/22; szczyt 12,8% w 2003/04); 4,1% zmieniło pracodawcę (11,8% na umowach terminowych, 2,6% na stałych) | panel BAEL: osoba pracująca w roku 0, po 12 miesiącach w innej pracy lub bez pracy; wszystkie formy zatrudnienia, główna praca; bez rozróżnienia dobrowolne / wymuszone; autorzy nazywają to dolną granicą | PIE, Working Paper 6/2023 „Rotacja pracowników w Polsce” (marzec 2024) | bezpłatnie [P] |
| Eurostat, przejścia praca–praca | Polska 1% (2022–2025), UE 2–3% | kwartalne prawdopodobieństwo zmiany pracy, 15–74 lata, statystyka eksperymentalna, zaokrąglona do pełnych punktów; to nie jest stopa roczna | `lfsi_long_e07` | bezpłatnie [P] |
| Sedlak & Sedlak, wskaźnikiHR | 2018: 16,2% (w tym samym komunikacie także 16,4%); raport 2026 (dane 2025): średnia 14,4%, mediana 13,2%, kwartyle 7,9% i 19,7% | rotacja ogółem w firmach uczestniczących w badaniu, z ich systemów HR; definicja nie jest widoczna w materiałach bezpłatnych; strona z liczbami 2025 może być przykładowa | komunikat 27.08.2019; broszura raportu 2026 | pełny raport płatny (4000 zł netto dla nieuczestników) [P, tylko broszura i komunikat] |
| Randstad, Monitor Rynku Pracy, 60. edycja | 19% zmieniło pracodawcę w ostatnich 6 miesiącach, 16% stanowisko (komunikat podaje też odwrotnie: 16% i 19%) | deklaracja respondentów, 6 miesięcy, CAWI, n = 1000, 18–64 lata | komunikat z 21.10.2025 | komunikat bezpłatny; pełny raport nie pobrany [P] |
| Hays, Raport Płacowy 2025 | 51% specjalistów i menedżerów rozważa zmianę pracy | zamiar, nie odejście | raport 2025 (kopia na stronie uczelni) | bezpłatnie [P] |
| Gi Group, Barometr Rynku Pracy 2025 | ok. 44% rozważa zmianę pracy | zamiar | relacja prasowa (forsal.pl) | [W] |
| Antal | średnia „attrition” 10,8% | nieznana | strona niedostępna (błąd DNS) | [W] |
| PwC Saratoga (Polska) | brak publicznych liczb | | | płatny benchmark |
| Deloitte, Grant Thornton, HRK, Michael Page | brak stopy rotacji w materiałach publicznych | | | |

Skąd może się brać 14,8%: w RSP 2025 tyle wynosi współczynnik zwolnień w 2024 r. w sekcjach A (rolnictwo) i E (dostawa wody). Żadne krajowe źródło nie podaje 14,8% jako stopy rotacji. Najbliższe są liczby Sedlak & Sedlak (średnia 14,4% w 2025 r., 16,2% w 2018 r.), ale to próba firm uczestniczących w płatnym badaniu, z niejawną definicją.

### 13.3 Opcje

**Dla 41:**

| Opcja | Czego wymaga | Co potem można powiedzieć | Słabość |
|---|---|---|---|
| A. Odtworzyć z mikrodanych (ten sam indeks, który dostaną firmy) | definicja indeksu, mikrodane, wagi; analityk 1 dzień (część planu analizy) | „Średnia ważona indeksu X w badaniu Ipsos × FNP 2026 wynosi Y (95% PU), n = …” | wymaga zgody na indeks; może dać inną liczbę niż 41 |
| B. Przyjąć liczbę z raportu z numerem tabeli | pełny raport | „Wartość z raportu, tabela N” | nie wiadomo, jak policzona; nie da się policzyć firmy tak samo |
| C. Usunąć „średnią polską” | decyzja, zmiana tekstów, nowa wartość startowa suwaka | „Wartość startowa suwaka nie jest średnią” | firma traci punkt odniesienia |

**Dla rotacji:**

| Opcja | Czego wymaga | Co potem można powiedzieć | Słabość |
|---|---|---|---|
| A. Krajowe odniesienie GUS (18,7%, 2024) | zmiana stałej i opisu | „Współczynnik zwolnień GUS 2024, wszystkie odejścia” | mierzy wszystkie odejścia, nie dobrowolne; użyty jako domyślna deklaracja zawyży składnik rotacji po przebudowie |
| B. Odniesienie według sekcji PKD (tabl. 1 (25)) | pole „branża” w formularzu, tabela 20 sekcji w kodzie, coroczna aktualizacja | „Współczynnik zwolnień GUS w Twojej sekcji” | ten sam problem definicji; rozrzut 8,9–60,1% pokazuje, jak mylący jest jeden punkt krajowy |
| C. Usunąć odniesienie z modelu | wymagane pole rotacji w formularzu (już jest), w API i wsadzie brak deklaracji oznacza brak składnika rotacji ze statusem „brak danych” | „Model liczy rotację wyłącznie z danych firmy” | firma bez danych o odejściach nie dostanie tej części wyniku |

### 13.4 Rekomendacja

**41: opcja A, z regułą decyzji zapisaną przed analizą** (plan analizy, sekcja 6): wynik 39–43 zostawia 41 z przypisem; inna wartość ją zastępuje (bez dostrajania innych parametrów, żeby wrócić do starej sumy); brak definicji indeksu oznacza opcję C. Przed pierwszym klientem: do czasu odtworzenia nie pisać „polska średnia 41”, tylko „wartość startowa”. W pilotażu: rozkład wyników firm porównywać z rozkładem krajowym tylko wtedy, gdy psychometra potwierdzi niezmienność pomiaru (luka 14).

**Rotacja: opcja C.** Model jest przebudowywany tak, że składnik rotacji jest proporcjonalny do deklaracji firmy, więc wartość domyślna stałaby się wprost częścią wyniku. Odniesienie krajowe nie mierzy tego, co model potrzebuje (odejść, których firma mogła uniknąć), a podanie ogólnej liczby jako wartości domyślnej zawyżałoby kwotę dla firm, które nic nie wpiszą. Konkretnie:

1. Usunąć `PL_TURNOVER_RATE_GUS` z drogi obliczeń w silniku źródłowym (`podatekodmilczenia`), potem przenieść do FNP. W API i narzędziu wsadowym brak deklaracji to brak kwoty rotacji ze statusem, a nie 14,8%.
2. Zmienić pytanie w formularzu z „Ile osób na 100 zatrudnionych odeszło w ciągu roku” (`src/inputs.js:12`) na dwa pola: odejścia z inicjatywy pracownika (wypowiedzenie przez pracownika i porozumienie z jego inicjatywy) w ostatnich 12 miesiącach oraz średnie zatrudnienie w tym okresie. To odpowiada polu „Liczba odejść VOLUNTARY” w formularzu HR i zmiennej OV1 protokołu walidacji.
3. Jako kontekst (nie wejście modelu) pokazać obok pola: „Dla porównania: GUS, 2024: współczynnik zwolnień 18,7% (wszystkie odejścia); wypowiedzenia przez pracownika ok. 2,8% zatrudnionych (RSP 2025, tabl. 1 (25) i 4 (28))” oraz wartość dla sekcji firmy, jeśli formularz zna branżę.
4. W dokumentach zastąpić odwołanie do informacji regionalnych GUS Szczecin odwołaniem do krajowej tabeli RSP 2025, tabl. 1 (25).

### 13.5 Pierwszy krok w poniedziałek

Poprawić w `docs/PRIORY.md`, `Methodology.jsx` i Zał. 1 źródło liczb 19,7% / 18,7% na RSP 2025, tabl. 1 (25), s. 71, i dopisać 2,8% jako dolną granicę odejść z inicjatywy pracownika (tabl. 4 (28)). Otworzyć w repozytorium silnika zadanie „usunąć domyślną stopę 14,8% z obliczeń” z opisem zmiany pola formularza.

## Luka 14. Przeliczenie wyniku ankiety na klimat 0–100

### 14.1 Czego nie wiemy i dlaczego to wpływa na kwotę

Dziś klimat to suwak z pięcioma kotwicami zachowań (`src/channels.js:32-38`: 10, 35, 55, 75, 92). Protokół walidacji zakłada skalę Edmondson (PS-7) przeskalowaną liniowo `(średnia − 1) / 6 × 100`, a narzędzie wsadowe tak właśnie przelicza (`docs/WSAD.md`). Brief Fundacji zakłada natomiast pytania Ipsos. Nie wiadomo:

- czy wynik ankiety zespołu leży na tej samej skali co średnia krajowa i co kotwice suwaka;
- czy kilka pozycji tworzy jeden wymiar i czy mierzą to samo w różnych firmach, na różnych stanowiskach i w różnych branżach;
- czy średnia z 5–20 odpowiedzi jest wystarczająco rzetelna, żeby odróżnić zespoły i firmy;
- jak duża jest różnica między oceną kierownika (suwak) a ankietą pracowników.

Dla klienta to bezpośrednio kwota: różnica 10 punktów klimatu w okolicy 41 zmienia sumę firmy przykładowej o ok. 0,6 mln zł (41 → 3,12 mln, 60 → 1,87 mln zł).

### 14.2 Opcje pomiaru

| Opcja | Założenia | Minimalne dowody psychometryczne przed sprzedażą | Realne liczebności | Słabość |
|---|---|---|---|---|
| (a) Indeks jako stała funkcja wybranych pytań Ipsos, liczony identycznie w próbie krajowej i w firmie | te same pytania, ta sama kolejność i skala odpowiedzi; indeks jednowymiarowy; niezmienność pomiaru między grupami | jednowymiarowość (CFA), rzetelność (omega ≥ 0,80), niezmienność co najmniej metryczna, najlepiej skalarna według stanowiska, wielkości firmy i branży na danych Ipsos; reguły agregacji | Ipsos n ≈ 1000 wystarcza do CFA; grupy w analizie niezmienności po co najmniej ok. 200 osób (stanowisko, 2–3 klasy wielkości); niezmienność między firmami dopiero z pilotażu | tryb badania: panel internetowy wobec ankiety zleconej przez pracodawcę; pytania Ipsos nie były projektowane do diagnozy zespołu; prawa do brzmienia pytań |
| (b) Skala Edmondson (7 pozycji) przeskalowana liniowo | skala mierzy klimat zespołu (konstrukt zespołowy, odpowiedzi na 7-punktowej skali „bardzo niezgodne z prawdą” do „bardzo zgodne”); przeskalowanie liniowe zakłada równe odstępy | polska adaptacja z tłumaczeniem zwrotnym i CFA (brak znanej opublikowanej walidacji polskiej z CFA, protokół, s. 5.1) | adaptacja: kilkaset osób | krajowy punkt odniesienia nie był zbierany tą skalą, więc wynik firmy nie leży na skali benchmarku; brak jawnej licencji na użycie komercyjne (rejestr, wiersz 4) |
| (c) Łączenie skal (equipercentile lub liniowe) między ankietą firmową a rozkładem krajowym | jedna grupa odpowiada na oba narzędzia albo dwie losowo równoważne grupy; stabilna relacja | badanie łączące; błąd łączenia w środku rozkładu | w literaturze przytacza się regułę ok. 1500 osób na grupę dla metody equipercentile (Kolen i Brennan, za Kim i Walker 2021; nie widziałem w oryginale); dla firmy z 20 respondentami łączenie per firma jest niemożliwe, łączy się narzędzie raz | drogie i wolne; przy n firmy 15–20 błąd łączenia ginie w błędzie próby; ma sens tylko, jeśli Fundacja wybierze inną skalę niż Ipsos |
| (d) Mapa przejścia: suwak a wynik ankiety | ocena kierownika i ankieta pracowników mierzą to samo z przesunięciem | porównanie w pilotażu: średnia różnica i granice zgodności (Bland-Altman), korelacja | kilkadziesiąt firm, żeby oszacować przesunięcie z sensownym przedziałem; 2 firmy dają tylko ilustrację | suwak jest szacunkiem jednej osoby; przesunięcie może zależeć od firmy i od tego, kto przesuwa suwak |

Wskaźniki agregacji do zespołu i firmy (dla każdej opcji, która liczy średnią z ankiety):

- **ICC(1):** jaka część zróżnicowania odpowiedzi przypada na przynależność do zespołu; uzasadnia traktowanie klimatu jako cechy zespołu.
- **ICC(2):** rzetelność średniej zespołu; rośnie z liczbą osób. Przy ICC(1) = 0,15 i 5 osobach ICC(2) ≈ 0,47, przy 15 osobach ≈ 0,73, przy 20 osobach ≈ 0,78 (wzór Spearmana-Browna, wyliczone).
- **rwg(j):** zgodność w zespole; konwencjonalny próg 0,70 (Bliese, przewodnik do pakietu `multilevel` w R) [W].
- Źródła metod: Bliese (2000), rozdział w Klein i Kozlowski (red.), s. 349–381; LeBreton i Senter (2008), *Organizational Research Methods* 11(4), 815–852; James, Demaree i Wolf (1984), *Journal of Applied Psychology* 69(1), 85–98; Chan (1998), *Journal of Applied Psychology* 83(2), 234–246 (modele kompozycji). Progi „małe / średnie / duże” dla ICC(1) i przedziały rwg często przypisywane LeBretonowi i Senterowi widziałem tylko wtórnie; psychometra powinien je sprawdzić w oryginale.

### 14.3 Rekomendacja

**Opcja (a).** Fundacja ma pytania i dane, więc jedyną drogą, w której wynik firmy jest na skali benchmarku z konstrukcji, jest liczenie tego samego indeksu z tych samych pytań. Opcja (b) jest poprawna psychometrycznie, ale zrywa związek z benchmarkiem i ma niejasną licencję. Opcja (c) jest za droga na start. Opcja (d) nie zastępuje pomiaru, ale warto ją zbierać w pilotażu, bo wersja bezpłatna zostaje przy suwaku.

**Minimum, które psychometra dostarcza przed pierwszym klientem:**

1. Lista pozycji indeksu, kierunek kodowania, reguła braków danych i wzór przeskalowania na 0–100 (zapisane przed analizą związków z wynikami).
2. Na danych Ipsos: CFA jednoczynnikowa z dopasowaniem, omega, rozkład (percentyle ważone), niezmienność według stanowiska i wielkości firmy (co najmniej metryczna).
3. Normy krajowe: ważona średnia i percentyle z przedziałami, zastępujące 41 i `PL_DISTRIBUTION`.
4. Reguły agregacji: minimalna liczba osób w zespole do raportu, sposób łączenia zespołów poniżej progu, które wskaźniki (ICC(1), ICC(2), rwg(j)) raportujemy po zebraniu danych i co robimy, gdy zgodność jest niska (np. rwg(j) < 0,70: raportujemy rozkład, nie tylko średnią).
5. Krótka notatka o różnicy trybu badania (panel CAWI wobec ankiety firmowej) i o tym, jak ją komunikować klientowi.

**Progi anonimowości.** To dwa różne progi i oba warto zachować:
- **5 osób w zespole** (brief Fundacji): próg ochrony anonimowości przy raportowaniu wyniku zespołu. Zespoły poniżej 5 nie są pokazywane osobno; ich odpowiedzi trafiają do wyniku jednostki nadrzędnej lub do grupy „pozostali”. Przy 5 osobach średnia jest mało rzetelna (ICC(2) ok. 0,47 przy ICC(1) = 0,15), więc raport zespołu powinien pokazywać przedział, nie samą liczbę.
- **15 ważnych odpowiedzi na firmę** (protokół): próg stabilności średniej firmowej, która zasila model kosztów.

**Gdy istnieje tylko wynik firmowy:** model liczy na średniej firmy, jak dziś, z adnotacją, że przy dużym rozrzucie między zespołami wynik może być zaniżony (koszty rosną nieliniowo, gdy klimat spada). Gdy są wyniki zespołów ≥ 5 osób, lepiej użyć trybu segmentów, który silnik już ma (`teamSegments`, `src/logic/modules.js:241-251`, `462-489`): każdy zespół liczony jest jako część firmy z własnym klimatem, a zespoły poniżej progu łączone w jeden segment.

**W pilotażu:** w obu firmach zebrać suwak od 2–3 osób z kierownictwa przed ankietą, ankietę ze wszystkich zespołów, policzyć ICC(1), ICC(2), rwg(j) i różnicę suwak minus ankieta. To pierwsza empiryczna informacja o opcji (d) i o sensie agregacji.

### 14.4 Pierwszy krok w poniedziałek

Poprosić psychometrę Fundacji o pisemną propozycję listy pozycji indeksu z kwestionariusza Ipsos i reguły liczenia, z zaznaczeniem, które pozycje są jednocześnie wskaźnikami z tabeli `METRICS` (żeby nie liczyć związku pozycji z samą sobą). Termin: przed otwarciem mikrodanych.

## Luka 15. Przeliczenie na złote nigdy nie było sprawdzone na danych firmy

### 15.1 Czego nie wiemy i dlaczego to wpływa na kwotę

Suma firmy przykładowej (3,12 mln zł) składa się z błędów (1,04 mln), rotacji (0,73 mln) i wypalenia (1,35 mln). Każda z tych części to iloczyn wskaźnika zachowań (luka 12) i przelicznika autora. Nie ma ani jednej firmy, na której porównano by te kwoty z jej rejestrami. Szczegółowa tabela dowodów: `priory-a-dowody.md`. W skrócie:

| Prior | Wartość | Status |
|---|---|---|
| Koszt zastąpienia | 0,75 rocznej płacy | niezgodny z dostępnymi danymi dla przeciętnego etatu (mediany 0,16–0,24 w przeglądach studiów przypadku z USA); mieści się tylko dla specjalistów |
| Wzmocnienie Hirschmana | 0,10 | wiarygodne, bez poparcia; daje 26% kwoty rotacji |
| Stopa odejść z klimatu | `(1 − stabilność) × 0,4 − 0,015`, połowa nadwyżki | wiarygodne, bez poparcia |
| Wypalenie | ok. 0,24 rocznej płacy na każdą dodatkową osobę z wypaleniem | niezgodne z dostępnymi danymi (słabe dowody wskazują 0,05–0,15) |
| Częstości i koszty zdarzeń | 8 / 3 / 0,05 / 0,006 na FTE; 500–250 000 zł | wiarygodne, bez poparcia; zdarzenia „średnie” dają ok. 73% kwoty błędów |
| Mnożniki późnego wykrycia | 1,5–5,0 | wiarygodne, bez poparcia; reguła 1-10-100 nie jest dowodem; w oprogramowaniu od braku efektu do ok. 5:1 dla małych systemów |
| Podatność na ukrycie | 0,60–0,05 | kierunek poparty (niezgłaszanie urazów 81% wobec 47% w złym i dobrym klimacie bezpieczeństwa), wielkość nieporównywalna |
| Korekta nakładania wypalenia | 0,75 | wiarygodne, bez poparcia |

Oba „niezgodne” priory zawyżają kwotę. Przy 0,20 zamiast 0,75 i 0,10 zamiast ok. 0,24 suma firmy przykładowej spadłaby do ok. 1,8 mln zł (wyliczenie proporcjonalne). Estymacja krzywych z danych (luka 12) działa w przeciwną stronę. Dlatego nie należy poprawiać żadnej z tych rzeczy osobno, tylko w jednej, opisanej zmianie.

### 15.2 Opcje

| Opcja | Czego wymaga | Co potem można powiedzieć | Słabość |
|---|---|---|---|
| A. Zastąpić priory zakresami z literatury (domyślnie dolna część zakresu) | zmiana dwóch przeliczników w silniku źródłowym, opis w `PRIORY.md`; 1–2 dni | „Przeliczniki mieszczą się w zakresach z opublikowanych przeglądów (głównie USA)” | dane amerykańskie, nie polskie; nadal nie sprawdzone na żadnej firmie |
| B. Dane firmy zastępują priory w płatnej diagnozie, z dwiema kolumnami | formularz HR z definicjami; logika „override z danych” dla 5–6 pól; prezentacja w raporcie | „W tej diagnozie X przeliczników pochodzi z Twoich danych, Y to założenia autora” | firmy często nie mają policzonego kosztu odejścia ani rejestru błędów |
| C. Walidacja: 2 firmy teraz, 15 później, potwierdzenie dopiero przy 85+ | dane HR, ankieta, protokół zarejestrowany przed zbieraniem, analityk | po 2: „pomiar i proces są wykonalne”; po 15: „opis zgodności z przedziałami”; dopiero przy 85+: test trafności | przez długi czas brak wniosku o trafności; ryzyko, że wyniki z 15 firm będą nadinterpretowane |
| D. Wycofać złote z wersji publicznej, zostawić wskaźniki | decyzja produktowa | „Pokazujemy ryzyko, nie kwotę” | sprzeczne z obecnym produktem i ofertą Fundacji |

### 15.3 Rekomendacja

**Przed pierwszym płatnym klientem: A dla dwóch niezgodnych priorów (albo co najmniej status „niezgodne z dostępnymi danymi” wydrukowany obok nich) oraz B.** Zmianę A trzeba wykonać razem z decyzją o krzywych z luki 12 i opisać jako jedną zmianę modelu, bez celu „zostać poniżej 5%”. **W pilotażu: C.**

**Które pola formularza HR zastępują które priory** (`podatekodmilczenia/research/FORMULARZ_HR.md`):

| Pole formularza | Zastępuje lub sprawdza | Jak |
|---|---|---|
| S2 „Liczba odejść VOLUNTARY” i liczba pracowników | deklarację rotacji (zastępuje) | stopa = odejścia z inicjatywy pracownika / średnie zatrudnienie 12 miesięcy; do formularza dodać średnie zatrudnienie i rozbicie: wypowiedzenie przez pracownika, porozumienie z jego inicjatywy |
| S2 „Szacowany koszt jednego odejścia” | przelicznik zastąpienia 0,75 (zastępuje) | koszt / średnia roczna płaca odchodzących; formularz powinien prosić o składniki (rekrutacja, agencja, czas rekrutujących, szkolenie, okres niepełnej wydajności), bo pojedyncza liczba bywa zgadywana |
| S2 „Średni staż odchodzących” | sprawdza zastąpienie | krótki staż odchodzących oznacza niższy koszt utraty wiedzy |
| S3 „Średnia absencja chorobowa (dni)”, „% z absencją > 20 dni”, „liczba L4 z kodem F” | sprawdza składnik wypalenia | koszt absencji = dni × dzienna płaca × udział pracodawcy (pierwsze 33 dni, 14 dla osób po 50. roku życia); porównać z krajowym tłem ZUS: 14,76 dnia na osobę ubezpieczoną zdrowotnie, 14,1% dni z kodem F (2025). Składnik wypalenia w modelu nie powinien bez uzasadnienia przekraczać kilkukrotności całej absencji z kodem F |
| S3 „% pracowników z podwyższonym wypaleniem” (jeśli firma mierzy) | zastępuje modelowy wskaźnik wypalenia w firmie | wymaga podania narzędzia i progu |
| S4 „Liczba reklamacji”, „incydentów jakościowych / rework”, „koszt reklamacji i reworków” | sprawdza i ogranicza kwotę błędów | częstość na FTE dla kategorii, którą firma rejestruje; dodatkowy koszt opóźnienia w modelu nie może przekraczać udokumentowanego całkowitego kosztu błędów firmy (warunek kontrolny) |
| S4 „System near-miss”, „liczba zgłoszeń” | sprawdza mechanizm, nie kwotę | wskaźnik zgłaszania; przy rosnącym zaufaniu liczba zgłoszeń powinna rosnąć |
| S1 płaca średnia i mediana | wejście (zastępuje) | gdy średnia znacząco przewyższa medianę, raportować wrażliwość na medianę |

**Prezentacja w raporcie płatnym:** dla każdego z trzech obszarów tabela z kolumnami „Twoje dane” (wartość, okres, źródło w firmie), „Założenie autora” (wartość i status: zakres poparty / wiarygodne bez poparcia / niezgodne z dostępnymi danymi) i „Użyte w wyniku”. Suma liczona w dwóch wariantach: „z Twoimi danymi tam, gdzie je podałeś” i „na samych założeniach autora”. Liczba przeliczników z danych firmy pokazana w nagłówku (np. „3 z 7 przeliczników z danych firmy”). Dane jednej firmy zmieniają tylko jej raport; wartości domyślne wersji publicznej zmieniają się dopiero po opisanej analizie wielu firm.

**Minimalna uczciwa walidacja:**

*Dwie firmy (teraz).* Można się dowiedzieć: czy firmy mają dane z formularza i jak długo trwa ich zebranie; ile osób odpowiada; czy zespoły mają ≥ 5 osób; ICC(1), ICC(2), rwg(j); różnica suwak minus ankieta; czy w obrębie firmy zespoły z niższym klimatem mają więcej odejść i absencji (związek na poziomie zespołów, opisowo). Nie można: niczego powiedzieć o trafności kwot między firmami; dwie firmy to dwa punkty. Przy 10 zespołach w każdej z dwóch firm (20 zespołów, efekt firmy usunięty) korelacja musi przekroczyć ok. 0,46, żeby była istotna na poziomie 0,05, więc nawet związek zespołowy da tylko kierunek.

*Piętnaście firm po 15–20 osób.* Właściwa analiza: opis zgodności (wykres „model wobec obserwacji”, korelacja z 95% przedziałem, różnica średnia Blanda-Altmana), modele wielopoziomowe tylko opisowo (15 klastrów to za mało do stabilnych błędów standardowych na poziomie firmy; Maas i Hox 2005 wskazują obciążenie przy 50 lub mniej). Moc testu korelacji na poziomie firm przy n = 15: 8% przy ρ = 0,15, 19% przy ρ = 0,30, 48% przy ρ = 0,50 (α = 0,05, dwustronnie). 95% przedział wokół r = 0,30 przy 15 firmach to od −0,25 do 0,70. Wniosek: 15 firm nie potwierdza i nie obala modelu.

*Poprawne progi statystyczne* (wartość krytyczna r Pearsona, test dwustronny, df = n − 2):

| Liczba firm | α = 0,05 | α = 0,10 | moc przy ρ = 0,30 (α = 0,05) |
|---|---:|---:|---:|
| 15 | 0,514 | 0,441 | 19% |
| 30 | 0,361 | 0,306 | 36% |
| 61 | 0,252 | 0,213 | 65% |

Liczba firm potrzebna do mocy 80% przy α = 0,05: 347 dla ρ = 0,15; 194 dla 0,20; 124 dla 0,25; 85 dla 0,30; 62 dla 0,35; 30 dla 0,50 (przybliżenie Fishera). Protokół (s. 6) pisze, że przy ok. 61 firmach i α = 0,10 r = 0,15 jest „na granicy wykrywalności”. To błąd: wartość krytyczna wynosi tam 0,21 (α = 0,10) i 0,25 (α = 0,05), a moc wobec ρ = 0,15 to ok. 21%. Kryterium „r < 0,15 i p > 0,10” oznaczałoby, że prawie każdy wynik między 0,15 a 0,21 jest jednocześnie „nieobalony” i „nieistotny”.

Dla układu w obrębie firm (zespoły, efekt firmy usunięty, df = zespoły − firmy − 1): 16 zespołów w 2 firmach: 0,514 / 0,441; 20 w 2: 0,456 / 0,389; 60 w 15: 0,291 / 0,246; 90 w 15: 0,226 / 0,190 (α = 0,05 / 0,10). Uwaga: wyniki zespołowe z rejestrów (odejścia w zespole 8 osób to zwykle 0–2 rocznie) są bardzo zaszumione; lepiej używać wyników zliczeniowych w modelu Poissona z ekspozycją.

*Kryterium obalenia, statystycznie poprawne.* Brak istotności nie jest dowodem braku związku. Kryterium trzeba sformułować jako test minimalnego efektu: model uznajemy za obalony w swojej obecnej postaci, gdy górna granica jednostronnego 95% przedziału ufności dla ρ jest poniżej z góry ustalonej najmniejszej wartości, którą uznajemy za użyteczną (propozycja: 0,30). Przy 61 firmach oznacza to obserwowane r poniżej ok. 0,09; przy 30 firmach poniżej ok. −0,01; przy 15 firmach ok. −0,16 (więc przy 15 firmach praktycznie nieosiągalne). Szansa takiego rozstrzygnięcia, gdy prawdziwe ρ = 0: 28% przy 15 firmach, 49% przy 30, 76% przy 61. Wniosek potwierdzający: dolna granica 95% przedziału powyżej 0 przy z góry ustalonej liczbie firm (dla ρ = 0,30 i mocy 80%: 85 firm). Dla wykrycia przesunięcia poziomu (rekalibracja) protokół używa analizy Blanda-Altmana; to dobry pomysł, ale wymaga wspólnej skali, której dziś nie ma (model daje złote, wskaźnik złożony daje wyniki standaryzowane).

**Ponowny pomiar po 12 miesiącach: jak odróżnić zmianę od szumu.**

1. *Porównanie.* Zespoły z działaniami i bez nich w tych samych firmach. Najlepiej losowo albo w kolejności (część zespołów dostaje działania od razu, część po drugim pomiarze); jeśli to niemożliwe, z góry zapisana reguła wyboru zespołów i porównanie z zespołami spełniającymi tę samą regułę.
2. *Regresja do średniej.* Zespoły wybrane do działań, bo miały najniższy wynik, poprawią się częściowo same, bo pierwszy pomiar był zaniżony przez przypadek (Barnett, van der Pols i Dobson 2005). Analiza: wynik po działaniach z wynikiem przed jako zmienną kontrolną (ANCOVA) i grupą porównawczą wybraną tą samą regułą; nigdy sama różnica „po minus przed” w zespołach wybranych z dołu.
3. *Wskaźnik rzetelnej zmiany* (Jacobson i Truax 1991) dla zespołu i firmy. Przy SD odpowiedzi indywidualnych 20 punktów na skali 0–100 (założenie do zastąpienia SD z danych Ipsos) i samym błędzie próby (bez błędu pomiaru pozycji i bez zmiany składu): zmiana jest rzetelna dopiero powyżej ok. 25 punktów dla zespołu 5 osób, 20 punktów dla 8 osób, 14 dla 15 osób, 12 dla 20 osób, 9 dla 40 osób (próg 1,96 × √2 × SD / √n). Raport po 12 miesiącach powinien więc dla małych zespołów pokazywać „zmiana w granicach szumu”, a nie strzałki.
4. *Zmiana składu.* Rotacja w ciągu 12 miesięcy zmienia, kto odpowiada; raportować, jaki odsetek respondentów był w zespole w obu pomiarach (bez identyfikacji osób, np. pytanie o staż w zespole).
5. *Więcej zgłoszeń przy rosnącym zaufaniu.* Gdy rośnie bezpieczeństwo, zgłoszeń błędów i zdarzeń niepożądanych zwykle przybywa, bo mniej się ukrywa (Edmondson 1996; Probst i in. 2008). Trzeba to zapisać przed pomiarem: wzrost liczby zgłoszeń nie jest porażką. Lepszy wskaźnik to czas od zdarzenia do zgłoszenia, udział zgłoszeń near-miss wśród wszystkich zgłoszeń i koszt na zdarzenie.
6. *Wyniki pierwotne* (zgodnie z fazą C protokołu v2): zapisać przed wdrożeniem, maksymalnie 2–3, np. klimat zespołu, odejścia z inicjatywy pracownika, absencja; wszystkie pozostałe jako eksploracyjne.

### 15.4 Pierwszy krok w poniedziałek

Poprawić formularz HR: dodać średnie zatrudnienie, rozbicie odejść (wypowiedzenie przez pracownika, porozumienie z jego inicjatywy, przez pracodawcę, koniec umowy), składniki kosztu odejścia, dni absencji pracodawcy i ZUS osobno, okres danych; wysłać go obu firmom z pytaniem, które pola mają w systemach i w jakim czasie mogą je dać. To pokaże, które priory w ogóle da się zastąpić danymi.

## Zdania do zmiany w obecnych materiałach

1. `src/sections/Context.jsx:23`, strona fnp.silence-tax.com: „Kalkulator nie przelicza tych odsetków na złote i nie jest na nich skalibrowany.” **Część pierwsza jest nieprawdziwa** dla co najmniej dwóch liczb z tej samej sekcji: 59% i 85% to parametry `teamStability` (`constants.js:6`), z których model liczy stopę odejść i koszt rotacji, a 51% (wypalenie w zespołach o niskim BP, wymienione w rejestrze jako potwierdzone publicznie) to parametr `burnoutRate`, z którego liczony jest koszt wypalenia. Propozycja: „Kalkulator używa części tych liczb jako założeń o kształcie krzywych (np. 59% i 85% stabilności zespołu), ale nie jest na nich skalibrowany: krzywe są spłaszczone i nie odtwarzają tych odsetków.”
2. `docs/STAN-WIEDZY.md:13`: „46 cytowanych prac zweryfikowano: czy istnieją i czy mówią to, co im przypisano.” Rejestr sam podaje, że treść w dokumencie pierwotnym sprawdzono dla 20 źródeł, ok. 22 tylko na podstawie abstraktu lub rekordu, ok. 8 wtórnie, a kilka było nie do sprawdzenia (rejestr, „Zbiorcze statusy”). Propozycja: „Sprawdziliśmy 46 cytowanych prac: wszystkie istnieją; dla 20 przeczytaliśmy dokument źródłowy, dla pozostałych abstrakt lub opis; wyniki są w rejestrze.”
3. `docs/STAN-WIEDZY.md:19`: „Publicznie potwierdzone są tylko niektóre liczby (71%, 42%, 85% wobec 59%).” Rejestr potwierdza publicznie także 56%, 36%, 51% i 59% („nie warto się wychylać”). Warto dopisać, bo 51% to koniec krzywej wypalenia.
4. `docs/STAN-WIEDZY.md:30`: „co najmniej 61 dla wniosku potwierdzającego”. 61 firm daje moc 80% tylko przy ρ = 0,35. Przy ρ = 0,30 potrzeba 85 firm (protokół, tabela w s. 4, podaje 84). Propozycja: „co najmniej 61 firm, a przy słabszym związku (0,30) około 85”.
5. `docs/BRIEF-KALKULATOR-ODPOWIEDZI.md:102`: „przy około 60 firmach wartość krytyczna korelacji to około 0,21, nie 0,15”. Poprawne tylko przy α = 0,10; przy α = 0,05 wynosi 0,25. Dopisać poziom istotności.
6. `docs/PRIORY.md:13` i komentarz `constants.js:18-20`: „Końce krzywych ... przypisano je do Ipsos × FNP”. Według pól `src` w kodzie końce wysokie czterech wskaźników (`burnoutRate` „est. 8%”, `passivity`, `errorFear`, `riskAversion`) nie mają przypisanej liczby z raportu, a `snitchPerc` ma `src` „5% vs 41%” przy parametrach 0,55 i 0,10. Dopisać, że część końców to szacunek autora, a jeden wskaźnik ma niespójny opis źródła. Dopisać też, że przy `K = 0,30` model nie osiąga tych wartości.
7. `src/sections/Methodology.jsx:31` i `docs/PRIORY.md:34`: opis kosztu zastąpienia przywołuje tylko SHRM „50–200%”. To zestawienie sugeruje, że 0,75 jest ostrożne. Przeglądy z jawną metodą (Boushey i Glynn 2012; Bahn i Sanchez Cumming 2020) dają medianę ok. 21–24% płacy dla większości stanowisk. Propozycja: dopisać „przeglądy studiów przypadku z USA dają medianę ok. 0,2 rocznej płacy dla typowych stanowisk; 0,75 jest bliższe stanowiskom specjalistycznym”.
8. `src/inputs.js:12`, podpowiedź pola rotacji: „Ile osób na 100 zatrudnionych odeszło w ciągu roku.” Liczy wszystkie odejścia (porównywalne z 18,7% GUS), a model interpretuje rotację jako związaną z klimatem. Po przebudowie składnika rotacji podpowiedź powinna pytać o odejścia z inicjatywy pracownika.
9. Odwołania do GUS w `docs/PRIORY.md:51` i `Methodology.jsx:29` są poprawne co do liczb, ale cytują informacje regionalne; krajowa tabela to RSP 2025, tabl. 1 (25).

## Czego nie udało się sprawdzić i co by było potrzebne

- Pełny raport Ipsos × FNP, tabele, kwestionariusz, definicja indeksu i średniej 41: potrzebny dostęp od Fundacji.
- Podział rotacji GUS według wielkości firmy: nie ma go w RSP 2025; do sprawdzenia w Banku Danych Lokalnych lub zapytaniem do GUS.
- Pełne raporty płatne: Sedlak & Sedlak wskaźnikiHR (definicja rotacji dobrowolnej), PwC Saratoga Polska; pełny raport Randstad (plik za duży do pobrania); Antal (strona niedostępna).
- Reguła, którą Eurostat identyfikuje zmianę pracy w `lfsi_long_e07`.
- Polska wycena kosztu zastąpienia pracownika z jawną metodą: nie znaleziono; książka Cascio i dane CIPD nie sprawdzone.
- Pełne teksty: Salvagioni i in. 2017, Ahola i in. 2008, Dewa i in. 2014, Han i in. 2019, Goetzel i in. 2004 (liczby z abstraktów); Edmondson 1996 (liczby błędów, popularne „10 razy więcej” niepotwierdzone); Schiffauerova i Thomson 2006 (procent sprzedaży); ASQ „15–20% sprzedaży” (strona zablokowana); Bossavit (tylko spis treści); Boehm 1981.
- Liczbowe progi metodologiczne w oryginałach: przedziały rwg i progi ICC(1) LeBretona i Sentera, typowe ICC(1) u Bliese 2000, kryteria ΔCFI Chena 2007, reguła 1500 osób u Kolena i Brennana, wzór RCI w oryginale Jacobsona i Truaxa. Widziane tylko wtórnie; psychometra powinien je potwierdzić.
- Polska walidacja skali Edmondson z CFA: nie szukałem szerzej niż rejestr; protokół twierdzi, że jej nie zna.

## Źródła

Oznaczenia: [P] widziany dokument pierwotny, [A] abstrakt lub rekord, [W] źródło wtórne. Źródła priorów pieniężnych z pełnymi adresami: `priory-a-dowody.md`.

**Statystyka publiczna i raporty rynku pracy**
- GUS (2025). *Rocznik Statystyczny Pracy 2025*, dział III, tabl. 1 (25) s. 71, tabl. 2 (26) s. 72, tabl. 4 (28) s. 75–76, uwagi s. 69–70. https://stat.gov.pl/obszary-tematyczne/roczniki-statystyczne/roczniki-statystyczne/rocznik-statystyczny-pracy-2025,7,9.html ; PDF: https://stat.gov.pl/download/gfx/portalinformacyjny/pl/defaultaktualnosci/5515/7/9/1/rocznik_statystyczny_pracy_2025.pdf ; tablice XLSX: https://stat.gov.pl/download/gfx/portalinformacyjny/pl/defaultaktualnosci/5515/7/9/1/rocznik_statystyczny_pracy_2025_tablice.zip [P]
- GUS, słownik pojęć, „współczynnik zwolnień”. https://stat.gov.pl/metainformacje/slownik-pojec/pojecia-stosowane-w-statystyce-publicznej/715,pojecie.html [P]
- Eurostat, `lfsi_long_e07` (job-to-job transitions). https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/lfsi_long_e07/.T.Y15-74..PL+EU27_2020?format=TSV&startPeriod=2019 ; metadane: https://ec.europa.eu/eurostat/cache/metadata/EN/lfsi_long_esms.htm [P]
- Polski Instytut Ekonomiczny (2024). *Rotacja pracowników w Polsce*, WP 6/2023. https://pie.net.pl/wp-content/uploads/2024/03/WP-6_2023-Rotacja-pracownikow.pdf [P]
- Sedlak & Sedlak. Komunikat 27.08.2019: https://wynagrodzenia.pl/informacje-prasowe/podsumowanie-badania-wskaznikihr-2019/0 [P]; broszura wskaźnikiHR 2026: https://wynagrodzenia.pl/oferta-sprzedazy/raport-wskazniki-hr-2026 [P, płatny raport niewidziany]
- Randstad, Monitor Rynku Pracy, 60. edycja, komunikat: https://info.randstad.pl/hubfs/Monitor%20Rynku%20Pracy%20-%2060%20edycja%20-%20informacja%20prasowa.docx [P]
- Hays, Raport Płacowy 2025 (kopia): https://wab.edu.pl/wp-content/uploads/2025/01/Raport-placowy-2025-HAYS.pdf [P]
- Gi Group, Barometr Rynku Pracy 2025, relacja: https://forsal.pl/praca/aktualnosci/artykuly/9779678,firmy-maja-problem-prawie-45-proc-osob-rozwaza-zmiane-pracy-co-moze.html [W]
- ZUS (2026). *Absencja chorobowa w 2025 roku*. https://www.zus.pl/documents/10182/39590/Raport+Absencja+chorobowa+w+2025+roku.pdf/b2b8893f-049d-0782-1787-415168d381b3 [P]

**Metodologia**
- Edmondson A. C. (1999). Psychological Safety and Learning Behavior in Work Teams. *Administrative Science Quarterly* 44(2), 350–383. https://doi.org/10.2307/2666999 ; https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Group_Performance/Edmondson%20Psychological%20safety.pdf [P]
- Bliese P. D. (2000). Within-group agreement, non-independence, and reliability: Implications for data aggregation and analysis. W: K. J. Klein, S. W. J. Kozlowski (red.), *Multilevel Theory, Research, and Methods in Organizations*, Jossey-Bass, 349–381. [W: bibliografia i definicje w przewodniku Bliese „Multilevel Modeling in R”, https://mirrors.westlake.edu.cn/CRAN/doc/contrib/Bliese_Multilevel.pdf]
- LeBreton J. M., Senter J. L. (2008). Answers to 20 questions about interrater reliability and interrater agreement. *Organizational Research Methods* 11(4), 815–852. https://doi.org/10.1177/1094428106296642 [A]
- James L. R., Demaree R. G., Wolf G. (1984). Estimating within-group interrater reliability with and without response bias. *Journal of Applied Psychology* 69(1), 85–98. https://doi.org/10.1037/0021-9010.69.1.85 [A]
- Chan D. (1998). Functional relations among constructs in the same content domain at different levels of analysis: A typology of composition models. *Journal of Applied Psychology* 83(2), 234–246. https://doi.org/10.1037/0021-9010.83.2.234 [A]
- Kolen M. J., Brennan R. L. (2014). *Test Equating, Scaling, and Linking: Methods and Practices*, wyd. 3, Springer. https://doi.org/10.1007/978-1-4939-0317-7 [A]; reguła 1500 osób za: Kim S., Walker M. E. (2021), ETS RR-21-14, https://files.eric.ed.gov/fulltext/EJ1340809.pdf [P dla źródła wtórnego]
- Vandenberg R. J., Lance C. E. (2000). A review and synthesis of the measurement invariance literature. *Organizational Research Methods* 3(1), 4–70. https://doi.org/10.1177/109442810031002 [A]
- Chen F. F. (2007). Sensitivity of goodness of fit indexes to lack of measurement invariance. *Structural Equation Modeling* 14(3), 464–504. https://doi.org/10.1080/10705510701301834 [A]
- Maas C. J. M., Hox J. J. (2005). Sufficient sample sizes for multilevel modeling. *Methodology* 1(3), 86–92. https://doi.org/10.1027/1614-2241.1.3.86 [A]
- Jacobson N. S., Truax P. (1991). Clinical significance: a statistical approach to defining meaningful change in psychotherapy research. *Journal of Consulting and Clinical Psychology* 59(1), 12–19. https://doi.org/10.1037/0022-006X.59.1.12 [A]
- Barnett A. G., van der Pols J. C., Dobson A. J. (2005). Regression to the mean: what it is and how to deal with it. *International Journal of Epidemiology* 34(1), 215–220. https://doi.org/10.1093/ije/dyh299 [A]
- Kish L. (1992). Weighting for unequal Pi. *Journal of Official Statistics* 8(2), 183–200 (efekt ważenia 1 + CV²). [W: dokumentacja pakietu PracTools, https://search.r-project.org/CRAN/refmans/PracTools/html/deffK.html]

**Dowody dla priorów pieniężnych:** pełny spis w `priory-a-dowody.md` (Boushey i Glynn 2012 [P]; Bahn i Sanchez Cumming 2020 [P]; Hinkin i Tracey 2000 [P]; SHRM 2025 [P]; Gallup 2019 [P]; Oxford Economics 2014 [A/W]; Salvagioni i in. 2017 [A]; Taris 2006 [A]; Goetzel i in. 2004 [A]; Schultz i Edington 2007 [A]; Hassard i in. 2014 [P] i 2018 [A]; Boehm i Basili 2001 [P]; NIST 2002 [P]; Menzies i in. 2017 [P]; Labovitz i in. 1992 [A]; Probst i in. 2008 [A]; Probst i Estrada 2010 [A]; Jung i in. 2021 [A]; Edmondson 1996 [A]).

**Dokumenty wewnętrzne:** rejestr źródeł `podatekodmilczenia/research/REJESTR_ZRODEL_2026-10-03.md` (wiersze 4, 22, 30–33, 37, 42); protokół walidacji `Papers_2026-09-21/validation_protocol/v1.md`; `research/FORMULARZ_HR.md`; `research/PROTOKOL_BADAWCZY.md`.
