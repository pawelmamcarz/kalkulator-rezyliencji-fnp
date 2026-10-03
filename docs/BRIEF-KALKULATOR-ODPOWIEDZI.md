# Kalkulator: odpowiedzi na pytania z briefu (pkt 14–24, uzupełnienia 27, 33, 36)

Stan: 3 października 2026 r. Podstawa: kod i dokumenty tego repozytorium (`docs/PRIORY.md`, `docs/AUDYT-2026-09-04.md`, `src/fnpModel.js`, `LICENSE`), wersja `2026.39.2.1`. Odpowiedzi opisują to, co **istnieje dziś**. Tam, gdzie brief zakłada coś, czego Kalkulator nie robi, jest to napisane wprost.

Źródło pytań: „Brief na spotkanie – ankieta i Kalkulator” (Marta, 3.10.2026).

## Najważniejsze w trzech zdaniach

1. Kalkulator istnieje jako działające narzędzie publiczne (https://fnp.silence-tax.com) z opisanym modelem, jawnymi założeniami i testami. Warunek krytyczny 3 („opisany model i założenia”) jest spełniony w zakresie **scenariusza skali**.
2. To nie jest narzędzie z briefu w całości: nie jest powiązany z ankietą, nie liczy zmiany przed i po, nie uwzględnia różnic między zespołami i nie był sprawdzony na danych prawdziwej firmy.
3. Prawa nie są dziś rozstrzygnięte na korzyść Fundacji: kod jest na licencji MIT, autorem jest Paweł Mamcarz. To do ustalenia przed sprzedażą (pkt 14).

## Stan prac i model

**14. Co dziś istnieje i do kogo należą prawa?**
Działające narzędzie webowe (React, strona publiczna), silnik obliczeń z testami (142 testy w audycie z 4.09.2026), dokumentacja priorów. Silnik pochodzi z Silence Tax, a wersja FNP dodaje własne priory (`src/fnpModel.js`). Autor: Paweł Mamcarz, kod na licencji MIT (copyright autora), kolaboracja z Fundacją Nowe Przestrzenie. MIT pozwala każdemu używać i kopiować kod, także komercyjnie. Z tego wynika wprost, że „podajemy na tacy model biznesowy innym firmom” dotyczy też kodu. Czego nie da się skopiować z repozytorium: neutralności Fundacji, benchmarku Ipsos, danych z diagnoz. **Decyzja do podjęcia:** czy wersja używana w płatnej ścieżce ma pozostać pod MIT, być osobnym wydaniem z umową licencyjną z Fundacją, czy przejść na inną licencję. Wymaga to prawnika.

**15. Co dokładnie liczy? Które poziomy?**
Liczy jeden poziom: **scenariusz skali kosztu milczenia** dla jednej firmy. Wejścia: przychód, koszty, liczba FTE, średnia roczna płaca brutto, deklarowana rotacja, jeden suwak klimatu 0–100 (szacunek własny, nie pomiar). Wyjście: kwota i P10–P90 dla trzech obszarów wchodzących do sumy (rotacja i utrata wiedzy, błędy i compliance, wypalenie i pasywność) oraz dwa obszary pokazane „poza sumą” (innowacje i uczenie się, koordynacja i hierarchia). Nie potrafię z kodu potwierdzić, jak „cztery poziomy” z dokumentu Marty (koszty bieżące, związek w firmie, scenariusze, koszt milczenia) mapują się na ten kod. Aplikacja realizuje najbliżej poziom „scenariusze/koszt milczenia”. Poziom „związek w firmie” (BP a rotacja na danych firmy) **nie jest zaimplementowany**.

**16. Jakie założenia i skąd?**
Spisane w `docs/PRIORY.md` z wartościami i uzasadnieniem. Najważniejsze: koszt zastąpienia 0,75 rocznej płacy, odniesienie rotacji 14,8% (przypisane do GUS, **niezweryfikowane**), rozkład zdarzeń błędów (cztery kategorie, koszty od 500 do 250 000 zł), koszt wypalenia, korekty nakładania kosztów. Status źródeł jest uczciwy: **środki i stromości krzywych są autorskie**, końce krzywych przypisane do Ipsos × FNP czekają na audyt tabel. Nie wolno komunikować, że model jest skalibrowany na Ipsos. Dla klienta ta tabela jest odpowiedzią na „każde założenie musi mieć źródło”: dziś część ma źródło, a część jest wprost nazwana priorem autora.

**17. Przedział czy jedna kwota?**
Oba, ale nagłówek jest kwotą punktową z pasmem P10–P90 (2000 losowań, stałe ziarno). Pasmo to rozrzut przyjętego scenariusza, **nie przedział ufności** straty firmy; nie obejmuje niepewności klimatu ani priorów. Kontrakt produktu zakazuje obietnicy ROI i wyceny księgowej. Ryzyko z briefu („jedna kwota tworzy oczekiwanie oszczędności”) jest realne: na stronie trzeba utrzymać język „scenariusz skali”. W ofercie dla zarządu proponuję pokazywać wyłącznie pasmo i procent przychodu, nie kwotę środkową.

**18. Na jakich badaniach opiera się model?**
Badania uzasadniają **mechanizm**, nie przeliczniki pieniężne: Kiewitz i in. (2016) o strachu i milczeniu obronnym, Adamska (2016) o rodzajach milczenia, Penney (2016) o efekcie mrożenia (nie przenosimy wielkości efektu na firmy). Wartości w złotych to priory autora. Przełożenie na polskie warunki: częściowo (Ipsos × FNP 2026 jako kontekst polski, audyt tabel w toku). Materiały sprzedażowe nie powinny obiecywać „bazy opracowań naukowych” jako podstawy kwot.

**19. Jak model jest powiązany z ankietą?**
**Nie jest.** Dziś klimat to jeden suwak z kotwicami behawioralnymi, który wpisuje osoba z firmy. Brak mapowania pytań ankiety na wejścia modelu, brak modułu D i filarów. Kontrakt publicznego produktu świadomie wyklucza siedmiopunktową skalę i mini-quiz. To jest główna luka względem briefu: żeby ankieta karmiła Kalkulator, trzeba zaprojektować interfejs danych (które wyniki filarów zastępują suwak, jak agregować do poziomu zespołu) i uzgodnić go z psychometrą.

## Dane i wiarygodność

**20. Jakich danych potrzebuje minimalnie? Co, jeśli ich nie ma?**
Sześć pól: przychód, koszty, FTE, średnia roczna płaca brutto, rotacja, klimat. Przychód jest tylko mianownikiem procentu, koszty tylko marżą. Realnie model napędzają FTE, płaca, klimat i rotacja. Wariant „brak danych”: rotację zastępuje odniesienie 14,8%, a klimat firma może podać tylko jako szacunek własny. Walidacja wejść blokuje wynik przy polach pustych lub niepoprawnych. Nie wymaga danych o absencji, zgłoszeniach ani incydentach: te wskazuje `PRIORY.md` jako dane, które mogłyby zastąpić priory.

**21. Od jakiej wielkości firmy wynik jest wiarygodny?**
**Brak progu.** Model skaluje się liniowo z FTE, formularz odrzuca FTE poniżej 1. Audyt zaznacza, że rzadkie poważne zdarzenia skalowane liniowo mogą nie pasować do małych firm. Próg wiarygodności musi wyznaczyć psychometra lub statystyk; do tego czasu wskazuję tylko, że przykład referencyjny to 500 FTE.

**22. Różnice między zespołami?**
**Nie uwzględnia.** Model liczy jedną firmę jako całość z jednym klimatem. Praca zmianowa, struktura płac i typ pracy nie są parametrami. Mapa zespołów z kroku 4 ścieżki wymaga osobnej warstwy (analiza ankiety per zespół z progiem anonimowości 5 osób), której w repozytorium nie ma.

**23. Czy sprawdzony na prawdziwych danych firmy?**
**Nie.** Testy dowodzą poprawności rachunku (monotoniczność klimatu, zerowa rotacja, skalowanie FTE, kontrola 5% przychodu dla firmy przykładowej), nie trafności kwot. Licencja i audyt mówią to wprost. Rekomendacja: traktować pierwszą firmę pilotażową (pkt 41) jako test, z planem zapisanym przed rozpoczęciem: jakie dane wewnętrzne, jakie porównanie, jakie kryterium „model nie zawodzi”.

**24. Jak liczymy zmianę przy ponownym pomiarze?**
**Nie liczymy; funkcja nie istnieje.** Model nie przechowuje wyników ani nie porównuje dwóch pomiarów. Można technicznie uruchomić go dwa razy z różnymi wejściami (ten sam seed daje porównywalne wyniki), ale to byłoby porównanie scenariuszy, nie dowód efektu programu. Dla kroku 9 ścieżki potrzebna jest osobna metoda przed/po oparta na ankiecie (różnica wyników zespołów, zespoły objęte i nieobjęte działaniami), zaprojektowana z psychometrą. Uczciwy język z kroku 10 („zmiana zbiegła się z…”) jest zgodny z kontraktem produktu.

## Uzupełnienia

**27. Czy nazwa „Ile kosztuje milczenie w Twojej firmie” obiecuje za dużo?**
Tak, w obecnej formie. Kontrakt produktu mówi o scenariuszu skali, nie o koszcie ani wycenie. Publiczny interfejs używa języka „scenariusz”. Nazwa w ofercie powinna go powtarzać, np. „Scenariusz skali kosztu milczenia”. Do decyzji Fundacji.

**33. Własność danych z diagnoz i benchmark.**
Dziś Kalkulator **nie zbiera żadnych danych**: obliczenia są lokalne w przeglądarce. Nie ma więc czego współdzielić ani budować na tym poziomu 2. Jeśli dane z diagnoz mają zasilać benchmark i Kalkulator, potrzebny jest zapis w umowie z klientem oraz architektura zbierania (hosting w UE, umowa powierzenia). To nowy komponent, nie rozszerzenie istniejącego.

**36. Ile czasu zajmie dopracowanie do pierwszego użycia?**
Nie podaję terminu: zależy od decyzji, które nie są techniczne (pkt 14, 19, 24). Technicznie, jako lista pracy: (a) interfejs z ankiety do modelu (pkt 19), (b) metoda przed/po (pkt 24), (c) audyt tabel Ipsos i weryfikacja odniesienia 14,8% GUS (otwarte w audycie), (d) test na danych pilotażowej firmy (pkt 23). Czas każdego z nich do oszacowania z psychometrą i po decyzji o zakresie.

## Podsumowanie dla warunku krytycznego 3

| Warunek | Stan |
| --- | --- |
| Opisany model i założenia | Tak, dla scenariusza skali (`PRIORY.md`) |
| Wynik da się wyjaśnić zarządowi klienta | Tak, w formie pasma i priorów; nie jako wycena |
| Połączenie z ankietą | Nie, wymaga projektu |
| Pomiar przed i po | Nie, wymaga projektu |
| Sprawdzenie na danych firmy | Nie, plan na firmie pilotażowej |
| Prawa Fundacji do narzędzia | Nierozstrzygnięte (MIT, autor Paweł Mamcarz) |

Rekomendowany werdykt z perspektywy Kalkulatora: **„idziemy dalej z warunkami”**, z warunkami z punktów 14, 19, 23 i 24.
