# Audyt metodologii Jev

Narzędzie offline i CI. Nie jest częścią publicznego bundla na [fnp.silence-tax.com](https://fnp.silence-tax.com).

Jev (TypeSafe, System One) nie liczy złotych i nie kalibruje silnika. Odpowiada na pytania Choice, Noul i Score o spójność tekstów: czy publiczna metodologia, zastrzeżenia i wynik mówią to samo co [PRIORY.md](PRIORY.md).

## Kontrakt epistemiczny

Publiczny wynik jest **scenariuszem skali** przy zadanych założeniach. Nie jest wyceną księgową, prognozą, oszacowaniem przyczynowym ani obietnicą ROI.

Priory w `src/fnpModel.js` i w tej instrukcji to założenia startowe autora. Nie są rozkładem wyestymowanym na próbie polskich firm. Ipsos × FNP 2026 jest kontekstem; audyt tabel pozostaje otwarty. Przeliczniki pieniężne nie pochodzą z tej kalibracji.

Ten skrypt nie zastępuje:

- testów kontraktu w `src/fnp.test.js` i `src/fnpAudit.test.js`,
- kontroli wzorów w `src/logic.test.js`,
- ręcznego audytu tabel Ipsos albo definicji GUS 14,8%.

Zielony audyt Jev oznacza tylko, że model decyzyjny uznał teksty za zgodne z zadanymi pytaniami i progami. To nadal prior aplikacyjny, nie dowód empiryczny.

## Jak uruchomić

Pytania i progi są w `scripts/jev-methodology-audit.config.js`. Zmieniaj je świadomie i zapisuj powód.

```bash
# Bez klucza: zbuduj zadanie i sprawdź źródła.
npm run jev:audit -- --dry-run

# Żywe wywołanie HTTP: POST https://api.typesafe.ai/v1/systemone
# Klucz tylko ze zmiennej środowiskowej. Nie commituj sekretu.
TYPESAFE_API_KEY=... npm run jev:audit
```

Opcjonalnie, jeśli chcesz oficjalne SDK zamiast HTTP:

```bash
npm install --save-dev @typesafe-ai/sdk
TYPESAFE_API_KEY=... npm run jev:audit -- --sdk
```

`npm test` używa atrap API i nie wymaga klucza. Domyślne CI (`lint`, `test`, `build`) nie woła TypeSafe.

Pin modelu: `jev-1.13.0`. Progi `minConfidence` i Noul są polityką tego repozytorium. Dopasuj je do własnych oznaczeń, zanim utrudnisz wdrożenie.

## Źródła w zadaniu

1. `docs/PRIORY.md` jako źródło prawdy dla analityka.
2. Teksty UI: metodologia, zastrzeżenia, wynik, obszary, hero, wydruk, suwak klimatu.

Pierwsze pytanie Choice naśladuje książkę kucharską TypeSafe o cytatach: `supports` / `contradicts` / `says_nothing` względem twierdzenia z priory. Pozostałe pytania pilnują Ipsos, zakresu sumy, 5%, efektu mrożenia, szacunku własnego klimatu i pasma P10–P90.
