# Wsad: model FNP dla wielu firm

Narzędzie offline do badania walidacyjnego. Dla każdej firmy i pomiaru liczy scenariusz skali bieżącym publicznym modelem (`computeFnpAnalysis` z `src/fnpModel.js`), bez własnej kopii wzorów. Wynik to scenariusz skali, nie wycena księgowa, nie ocena efektu przyczynowego i nie obietnica zwrotu. Narzędzie nie trafia do publicznej aplikacji.

```bash
npm run fnp:wsad -- docs/wsad-przyklad.csv
npm run fnp:wsad -- dane.csv --skala likert7 --out wynik.csv
npm run fnp:wsad -- dane.csv --porownaj
```

## Plik wejściowy

CSV z nagłówkiem, separator `,` albo `;` (wykrywany z nagłówka). Liczby wpisuj bez separatorów tysięcy: same cyfry, opcjonalny minus i jeden znak dziesiętny. W plikach z `,` znakiem dziesiętnym jest kropka, w plikach z `;` przecinek; kropka w pliku z `;` jest błędem (np. `90.000` nie zostanie odczytane jako 90). `90 000`, `1.234,5` i `90,000` są odrzucane. Obsługiwane: pola w cudzysłowach, BOM, CRLF, puste linie.

| Kolumna | Wymagana | Znaczenie |
|---|---|---|
| `firma` | tak | kod firmy, np. firma_017 |
| `pomiar` | nie (tak przy `--porownaj`) | etykieta pomiaru; przy `--porownaj` bez kolumny `kolejnosc` musi być datą ISO `RRRR-MM` albo `RRRR-MM-DD`, np. 2026-10 |
| `kolejnosc` | nie | liczba ustalająca kolejność pomiarów w `--porownaj` (mniejsza = wcześniejszy); gdy kolumna jest, wartość jest wymagana w każdym wierszu i nie może się powtarzać w firmie |
| `klimat` | tak | wynik ankiety w skali z `--skala` |
| `n` | tak | liczba ważnych odpowiedzi za tym wynikiem |
| `fte` | tak | etaty, co najmniej 1 |
| `placa_roczna` | tak | roczna płaca brutto na etat, zł |
| `rotacja_proc` | tak, w każdym wierszu | zadeklarowana roczna rotacja, 0–100%; kwota rotacji rośnie proporcjonalnie do niej |
| `przychod` | nie | przychód roczny, zł; tylko mianownik procentu |

Inne kolumny są pomijane i wypisywane raz na stderr. Limity fte, płacy, rotacji i przychodu są takie same jak w formularzu kalkulatora (`src/inputs.js`).

## Opcje

- `--skala procent|likert7|likert5` (domyślnie procent). likert7: (średnia − 1) / 6 × 100, likert5: (średnia − 1) / 4 × 100. Wynik spoza zakresu skali to błąd.
- `--min-n` (domyślnie 15). Wiersz z mniejszym n zostaje w wyniku ze statusem `poniżej_progu_n` i pustymi kwotami.
- `--out plik.csv` zapisuje CSV oraz `plik.csv.sha256`. Bez tej opcji CSV idzie na stdout.
- `--porownaj` zestawia dokładnie dwa pomiary każdej firmy. Kolejność ustala kolumna `kolejnosc`, a bez niej data ISO w `pomiar`. Etykiety, których nie da się jednoznacznie uporządkować (`przed`/`po`, `9`/`10`, `2026-9`, nieistniejąca data, mieszanie `RRRR-MM` z `RRRR-MM-DD` w jednej firmie), kończą się błędem i niczego nie zapisują: tekstowe sortowanie odwróciłoby znak zmiany.

## Zasady

- Brak danych nie jest uzupełniany. `rotacja_proc` jest wymagana w każdym wierszu: model przypisuje klimatowi część zadeklarowanych odejść firmy, więc bez deklaracji nie ma czego liczyć i nie ma stopy domyślnej. Kwota rotacji rośnie proporcjonalnie do deklaracji, a przy klimacie 100/100 wynosi zero. Bez `przychod` kolumna `proc_przychodu` jest pusta; kwoty się nie zmieniają, bo przychód nie wchodzi do trzech obszarów w sumie.
- Fail closed: jeśli choć jeden wiersz jest błędny, narzędzie wypisuje wszystkie błędy, nic nie zapisuje i kończy się kodem 1.
- Deterministycznie: ten sam plik daje te same bajty i ten sam SHA-256 (stałe ziarno Monte Carlo z modelu FNP). Skrót zawsze trafia na stderr.
- `wersja` pochodzi z `.version`. Kwoty w pełnych złotych, klimat z jednym miejscem po przecinku, procent z dwoma.
- Kwota (`kwota_zl`) to suma trzech obszarów w nagłówku kalkulatora: błędy, rotacja, wypalenie. Obszary poza sumą nie są wypisywane w złotych.
- `p10_zl` i `p90_zl` to granice scenariusza, nie przedziały ufności.
- Wynik ankiety jest przekazywany jako `safetySource: "survey"`. Silnik używa tej wartości tylko do opisu jakości wejścia; kwoty są takie same jak dla `estimate`.

## Porównanie

`--porownaj` wypisuje dla firmy z dwoma pomiarami: oba klimaty i różnicę, obie kwoty i różnicę oraz obie pary granic. Firmy z inną liczbą pomiarów albo z pomiarem poniżej progu n trafiają na stderr z powodem. Jeśli między pomiarami zmieniły się też inne dane wejściowe, stderr to odnotowuje. Różnica to różnica między dwoma scenariuszami skali, nie dowód efektu programu.
