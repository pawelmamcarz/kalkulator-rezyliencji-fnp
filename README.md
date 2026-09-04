# Kalkulator Rezyliencji FNP

Bezpłatny kalkulator Fundacji Nowe Przestrzenie i Pawła Mamcarza, z silnikiem Silence Tax. Publiczna strona: https://fnp.silence-tax.com.

Wynik jest rocznym scenariuszem skali, nie wyceną księgową, prognozą, oszacowaniem przyczynowym ani obietnicą oszczędności. Rezyliencja oznacza zdolność organizacji do reagowania na trudności i uczenia się. Kalkulator opisuje warunki zabierania głosu, nie mierzy całej rezyliencji.

## Ścieżka użytkownika

Dane organizacji → wynik → pięć obszarów → metodologia i priory → kontakt w sprawie diagnozy lub wydruk/PDF.

Dane: przychody i koszty roczne, średnioroczne FTE, roczna płaca brutto na etat, rotacja oraz własny szacunek klimatu 0–100. Nazwa jest opcjonalna, używana na wydruku. Pola początkowe to przykład. Dane nie są zapisywane ani wysyłane na serwer. Po odświeżeniu wraca przykład. Puste lub błędne dane wstrzymują wynik i możliwość wydruku z przycisku.

Kwota zależy od FTE, płacy, klimatu i deklarowanej rotacji. Przychód służy jako mianownik procentu, koszty do porównania z różnicą przychodów i kosztów. Kwoty nie należy ponownie odejmować od zysku.

## Zakres modelu

1. Rotacja i utrata wiedzy: w sumie tylko rotacja.
2. Błędy i compliance: w sumie tylko błędy.
3. Wypalenie i pasywność: w sumie tylko wypalenie.
4. Innowacje i uczenie się: poza sumą.
5. Koordynacja i hierarchia: poza sumą.

Każdy koszt jest nadwyżką względem modelowego klimatu 100. Przy 100 nadwyżka wynosi 0 z definicji, co nie oznacza organizacji bez kosztów. Zakres P10–P90 obejmuje środkowe 80% symulowanych kosztów; nie wszystkie źródła niepewności ani przedział ufności z badania. Stałe ziarno losowania umożliwia porównanie scenariuszy bez zmiany losowania po zmianie przychodu.

## Badania i priory

[Instrukcja priory dla analityka](docs/PRIORY.md) opisuje wartości, uzasadnienie, źródła danych do aktualizacji i przykład obliczeń. Efekt mrożenia opisujemy na podstawie Kiewitz i in. (2016), Adamskiej (2016), z rozróżnieniem kontekstu badań Penneya (2016). Nie jest osobną pozycją pieniężną ani dodatkowym mnożnikiem rzekomo oszacowanym w tych badaniach.

Przeliczniki pieniężne są autorskie. Końce krzywych przypisane w silniku do Ipsos × FNP mają status oczekujący na audyt źródła. Raport 2026 jest kontekstem, nie potwierdzoną kalibracją. Punkt odniesienia rotacji 14,8% zachowano dla ciągłości modelu, ale przypisanie do konkretnej tabeli GUS wymaga potwierdzenia.

Kod jest otwarty, aby umożliwić kontrolę. Nie stanowi to dowodu empirycznej trafności wyniku. Kontakt: pawel@mamcarz.com. Licencja MIT wraz z zastrzeżeniami w [LICENSE](LICENSE).

## Rozwój i weryfikacja

```bash
npm ci
npm run dev
npm test
npm run lint
npm run build
npm run preview
```

`npm run build` generuje aplikację oraz renderuje tę samą stronę React do HTML. Metodologia i przykład są dostępne bez wykonywania JavaScript; własne obliczenia wymagają JavaScript. Klient nawiązuje działanie na wygenerowanym HTML przez hydration. `public/robots.txt` i `public/sitemap.xml` wskazują kanoniczną stronę. Nieistniejące ścieżki w Cloudflare zwracają 404 z linkiem powrotu.

Weryfikacja routingu odpowiadającego produkcji:

```bash
npx --no-install wrangler dev --local --port 8794
```

Wydanie: `npm run deploy`; push do `main` także uruchamia wdrożenie po testach. Wersja pochodzi z `.version`. Publiczny bundle nie zawiera HiGHS/WASM. Formuły współdzielone są z [Silence Tax](https://github.com/pawelmamcarz/podatekodmilczenia); priory publicznej wersji są w `src/fnpModel.js`.
