# Wsad: model FNP dla wielu firm

Narzędzie offline do badania walidacyjnego. Dla każdej firmy i pomiaru liczy scenariusz skali bieżącym publicznym modelem (`computeFnpAnalysis` z `src/fnpModel.js`), bez własnej kopii wzorów. Wynik to scenariusz skali, nie wycena księgowa, nie ocena efektu przyczynowego i nie obietnica zwrotu. Narzędzie nie trafia do publicznej aplikacji.

```bash
npm run fnp:wsad -- docs/wsad-przyklad.csv
npm run fnp:wsad -- dane.csv --skala likert7 --out wynik.csv
npm run fnp:wsad -- dane.csv --porownaj
```

## Plik wejściowy

CSV z nagłówkiem, separator `,` albo `;` (wykrywany z nagłówka). Przecinek dziesiętny tylko w plikach z `;`. Obsługiwane: pola w cudzysłowach, BOM, CRLF, puste linie.

| Kolumna | Wymagana | Znaczenie |
|---|---|---|
| `firma` | tak | kod firmy, np. firma_017 |
| `pomiar` | nie (tak przy `--porownaj`) | etykieta pomiaru, np. 2026-10 |
| `klimat` | tak | wynik ankiety w skali z `--skala` |
| `n` | tak | liczba ważnych odpowiedzi za tym wynikiem |
| `fte` | tak | etaty, co najmniej 1 |
| `placa_roczna` | tak | roczna płaca brutto na etat, zł |
| `rotacja_proc` | nie | zadeklarowana roczna rotacja, 0–100% |
| `przychod` | nie | przychód roczny, zł; tylko mianownik procentu |

Inne kolumny są pomijane i wypisywane raz na stderr. Limity fte, płacy, rotacji i przychodu są takie same jak w formularzu kalkulatora (`src/inputs.js`).

## Opcje

- `--skala procent|likert7|likert5` (domyślnie procent). likert7: (średnia − 1) / 6 × 100, likert5: (średnia − 1) / 4 × 100. Wynik spoza zakresu skali to błąd.
- `--min-n` (domyślnie 15). Wiersz z mniejszym n zostaje w wyniku ze statusem `poniżej_progu_n` i pustymi kwotami.
- `--out plik.csv` zapisuje CSV oraz `plik.csv.sha256`. Bez tej opcji CSV idzie na stdout.
- `--porownaj` zestawia dokładnie dwa pomiary każdej firmy (kolejność według `pomiar` jako tekstu).

## Zasady

- Brak danych nie jest uzupełniany, z jednym jawnym wyjątkiem. Bez `rotacja_proc` model przyjmuje stopę odniesienia 14,8%, dokładnie tak, jakby ją zadeklarowano (`rotacja_zrodlo=odniesienie`); z deklaracją używa podanej stopy (`deklaracja`). Deklarowana rotacja działa wyłącznie jako górny limit modelowych odejść: rotacja powyżej odniesienia nie jest przypisywana milczeniu. Bez `przychod` kolumna `proc_przychodu` jest pusta; kwoty się nie zmieniają, bo przychód nie wchodzi do trzech obszarów w sumie.
- Fail closed: jeśli choć jeden wiersz jest błędny, narzędzie wypisuje wszystkie błędy, nic nie zapisuje i kończy się kodem 1.
- Deterministycznie: ten sam plik daje te same bajty i ten sam SHA-256 (stałe ziarno Monte Carlo z modelu FNP). Skrót zawsze trafia na stderr.
- `wersja` pochodzi z `.version`. Kwoty w pełnych złotych, klimat z jednym miejscem po przecinku, procent z dwoma.
- Kwota (`kwota_zl`) to suma trzech obszarów w nagłówku kalkulatora: błędy, rotacja, wypalenie. Obszary poza sumą nie są wypisywane w złotych.
- `p10_zl` i `p90_zl` to granice scenariusza, nie przedziały ufności.
- Wynik ankiety jest przekazywany jako `safetySource: "survey"`. Silnik używa tej wartości tylko do opisu jakości wejścia; kwoty są takie same jak dla `estimate`.

## Porównanie

`--porownaj` wypisuje dla firmy z dwoma pomiarami: oba klimaty i różnicę, obie kwoty i różnicę oraz obie pary granic. Firmy z inną liczbą pomiarów albo z pomiarem poniżej progu n trafiają na stderr z powodem. Jeśli między pomiarami zmieniły się też inne dane wejściowe, stderr to odnotowuje. Różnica to różnica między dwoma scenariuszami skali, nie dowód efektu programu.
