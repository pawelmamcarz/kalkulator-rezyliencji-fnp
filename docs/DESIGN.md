# Projekt strony kalkulatora

Ten dokument jest wiążący dla każdej zmiany interfejsu.

## Punkt widzenia

Instrumentem jest zdanie. Gość wybiera zdanie, które brzmi jak jego firma, i widzi, ile to może kosztować. Odbiorca: członek zarządu albo dyrektor HR z telefonem w ręku, dwie minuty. To produkt Fundacji Nowe Przestrzenie: czerń, biel, mocny pomarańcz, jasny błękit Safe Space, piaskowy żółty, krój Outfit, koła i pigułkowe przyciski.

## Kolory (tokeny w `src/index.css`)

| Token | Wartość | Rola | Kontrast |
|---|---|---|---|
| `--ink` | #000000 | tekst, linie | 21:1 na bieli |
| `--paper` | #ffffff | tło strony | |
| `--voice` | #ff511f | wyłącznie koszt: wypełnienie koła | nie jest tłem tekstu ani tekstem (na bieli 3,26:1) |
| `--safe` | #87daf4 | obrys koła przy klimacie 0, znaczniki Safe Space | 1,57:1, element dekoracyjny z tekstowym odpowiednikiem |
| `--sand` | #f6d087 | ciche tło (zapowiedź konferencji) | czarny tekst 14,29:1 |
| `--muted` | #5d6c7b | tekst drugiego planu | 5,39:1 na bieli |
| `--hairline` | #d9d9d9 | obramowania pól, separatory list | nie dla tekstu |

Pomarańcz oznacza tylko koszt. Wybrane zdanie i przycisk „Napisz do Fundacji” mają czarne tło i biały tekst (21:1), fokus to czarna obwódka 3 px. Błąd pola: czarna ramka 2 px, pogrubiony komunikat zaczynający się od „Do poprawy:” i „do poprawy” w wierszu firmy. Test sprawdza, że `var(--voice)` występuje tylko w regule `.disc-fill`.

## Typografia

Outfit (Google Fonts, `display=swap`, wagi 400, 500, 600), zapas: systemowy bezszeryfowy. Wielkość liter jak w zdaniu, nigdy wersaliki. Bez kroju o stałej szerokości. Liczby z cyframi tabelarycznymi (klasa `num`). Skala: 15, 17, 20, `--t-xl` (27–38, nagłówek h1, na desktopie 44), `--t-xxl` (32–52, kwota). Tekst ciągły: interlinia 1,55, wiersz do około 66 znaków.

## Jeden mocny element

Pomarańczowe koło. Jego POLE jest proporcjonalne do kwoty: udział = kwota ÷ kwota tej samej firmy przy klimacie 0 (liczona silnikiem, `src/disc.js`), promień = pierwiastek z udziału. Przy klimacie 0 koło wypełnia błękitny obrys, przy 100 znika, obrys zostaje. Podpis podaje udział słowami. Zmiana rozmiaru tylko po działaniu gościa, krótkie przejście; przy `prefers-reduced-motion` natychmiast. Żadnej animacji przy wejściu.

## Zdania jako drabina

Pięć zdań to typograficzna drabina, nie zestaw przycisków radiowych: pełna szerokość, oddzielone cienką linią, tekst 19 px, wysokość wiersza co najmniej 52 px, bez obramowań i bez kółek. Wybrany wiersz jest odwrócony (czarne tło, biały tekst, zaokrąglenie 10 px) i ma `aria-pressed`. Podświetlenie po najechaniu tylko na urządzeniach z kursorem. Inne przyciski zostają pigułkami.

## Etykieta danych

Nad kwotą i na początku wiersza firmy: „Przykładowa firma” (nic nie zmieniono), „Przykładowa firma, Twoja ocena klimatu” (zmieniono tylko klimat), „Twoja firma” (zmieniono którekolwiek pole firmy). Logika w `src/firm.js` (`dataLabel`).

## Układ

Kolejność w DOM jest kolejnością na telefonie (bez sztuczek z `order`). Telefon (najpierw): nagłówek, h1 i jedno zdanie, koło z kwotą i jednym krótkim podpisem („Koło to N% kwoty przy najniższej ocenie klimatu.”), pytanie z pięcioma zdaniami i suwakiem, pod suwakiem wrażliwość („10 punktów niżej: … 10 wyżej: …”), firma w jednym wierszu z przyciskiem „Zmień dane”, „Co składa się na kwotę”, „Co dalej”, zwinięte „Jak to liczymy”, stopka. Pierwszy ekran 390×844 pokazuje h1, koło z kwotą, pytanie i co najmniej dwa zdania. Gdy pełne koło zniknie z ekranu przy pytaniu lub danych, u góry pojawia się wąski pasek z małym kołem i kwotą. Treść do 680 px szerokości.

Desktop (od 1024 px): dwie kolumny. Lewa: h1, pytanie, firma, co dalej. Prawa: koło z kwotą i zakresem, a zaraz pod nim obszary i zastrzeżenie, bez pustego pola między nimi. Nic nie jest przyklejone; gdy koło zjedzie z ekranu, a pytanie albo dane firmy są widoczne, u góry pojawia się ten sam pasek z kwotą co na telefonie. Poniżej 1024 px obowiązuje układ telefonu w jednej kolumnie. Bez wewnętrznych pasków przewijania.

## Czego nie robimy

Pomarańczu poza kołem, przycisków radiowych przy zdaniach, wewnętrznych obszarów przewijania, kratki w tle, linii ozdobnych, kart z cieniem, gradientów, wersalików, kroju maszynowego, etykiet „Krok n”, ramek wokół każdej grupy pól, motywu zamazanego tekstu, animacji przy wejściu, pomarańczowego drobnego tekstu, katalogu interwencji, ankiety zamiast jednego suwaka.

## Słowa

Wielkość liter jak w zdaniu. Proste słowa, bez żargonu w głównym przebiegu (limit 450 słów przed pierwszą zwiniętą sekcją, test w `src/page.test.jsx`). Przyciski mówią, co robią: „Zmień dane”, „Napisz do Fundacji”, „Przywróć przykład”. Bez strzałek w etykietach i bez długich myślników. Liczby po polsku: „3,15 mln zł”, „od 2,39 do 3,96 mln zł”, spacje nierozdzielające w kwotach (formatter je wstawia). W głównym przebiegu nie używamy słów „model” ani „klimat 0”. Szacunek klimatu zawsze opisany jako szacunek własny, nie pomiar.

## Lista redaktora (przed wydaniem zmiany UI)

1. `npm run build && npx vite preview --port 4180`, sterowanie przez `.claude/skills/verify/cdp.mjs`.
2. `/?konferencja` przy 390×844: czy pierwszy ekran to h1, koło z kwotą, pytanie i dwa zdania?
3. Każde zdanie po kolei i suwak 41, 0, 100, 41: koło, kwota i wybrane zdanie się zgadzają; przy 0 koło wypełnia obrys, przy 100 znika.
4. Pasek u góry pojawia się tylko wtedy, gdy koło zniknęło, i nie zasłania używanej kontrolki.
5. „Zmień dane”: wpisz 2 500 000 000 cyfra po cyfrze, wklej „100.000.000”, wyczyść pole (stan błędu, panel otwarty), „Przywróć przykład”.
6. Wysokość 420 px, poziomo 844×390, 360×640, 768×1024, 1280×800, 1440×900, powiększenie tekstu 200%.
7. Sama klawiatura: kolejność, widoczny fokus, strzałki suwaka, zdania.
8. `#jak-liczymy`, `#efekt-mrozenia`, wydruk (jedna strona, bez koła i paska).
9. Kontrast nowych par kolorów policzony i wpisany do tabeli wyżej.
