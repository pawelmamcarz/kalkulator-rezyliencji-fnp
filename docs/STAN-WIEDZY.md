# Kalkulator Rezyliencji FNP: co wiemy, czego nie wiemy, co sprawdzi walidacja

Stan na 5 października 2026 r. Jedna strona na spotkanie 6 października. Szczegóły: `docs/BRIEF-KALKULATOR-ODPOWIEDZI.md` i załączniki w `docs/dla-fundacji/`.

## Co to jest

Kalkulator pokazuje **scenariusz skali**: ile mogłyby kosztować rotacja, późno zgłaszane błędy i wypalenie w firmie o podanych danych i podanym klimacie. To nie jest pomiar, wycena, prognoza ani obietnica oszczędności.

## Co wiemy

- **Rachunek jest sprawdzony.** Model ma 325 testów i przeszedł dwa niezależne przeglądy logiki (3 i 4 października), które naprawiły błędy niezależne od danych. Firma przykładowa (500 etatów, 100 mln zł przychodu, rotacja 16%, klimat 41): 3,15 mln zł, od 2,39 do 3,96 mln zł. Przy klimacie o 10 punktów niższym 3,79 mln zł, przy wyższym 2,52 mln zł.
- **Założenia są jawne.** Każda liczba w modelu ma opisany status: założenie autora, wartość przypisana raportowi Ipsos albo wartość o nieustalonym pochodzeniu (Zał. 1).
- **Źródła są przejrzane.** Dla 46 cytowanych prac sprawdzono, czy istnieją i czy dane bibliograficzne są poprawne. Treść porównano z dokumentem pierwotnym dla około 20 z nich, dla pozostałych z abstraktem lub źródłem pośrednim. Badania uzasadniają mechanizm (strach, milczenie, ukrywanie błędów), nie przeliczniki na złote.
- **Narzędzia są gotowe do pilotażu:** kalkulator na stronie, narzędzie do liczenia wielu firm z wyników ankiety i do zestawienia dwóch pomiarów, formularz danych firmy (Zał. 3), demonstracja na konferencję (Rotunda).

## Czego nie wiemy

- **Czy kwoty są trafne.** Modelu nie sprawdzono na danych żadnej firmy. Przeliczniki pieniężne są założeniami autora, a dwa z nich są powyżej tego, co dokumentują badania: koszt zastąpienia pracownika (model: 0,75 rocznej płacy; mediany w badaniach z opisaną metodą: około 0,2 dla typowego stanowiska) i koszt wypalenia.
- **Czy model jest zgodny z tabelami Ipsos.** Końce krzywych przypisano raportowi Ipsos × FNP, ale audytu tabel nie było, a model przy obecnym ustawieniu i tak do tych końców nie dochodzi (np. stabilność zespołu 66–78% zamiast 59–85%). Publicznie potwierdzone są tylko niektóre liczby (71%, 42%, 56%, 36%, 51%, 59%, 85% wobec 59%). Plan audytu na surowych danych: `docs/walidacja/`.
- **Jaką część odejść wiązać z klimatem.** Model przypisuje klimatowi część odejść z firmy (przy klimacie 41 około 29%, liczoną z wagą 0,5) i mnoży ją przez rotację podaną przez firmę. Ten udział wynika z krzywej modelu, nie z danych. Krajowego odniesienia 14,8% model już nie używa: okazało się, że nie jest to wskaźnik krajowy GUS.
- **Jak przeliczać wynik ankiety na klimat 0–100.** Dziś klimat to szacunek własny jednej osoby. Przeliczenie średniej z ankiety na tę skalę jest założeniem.
- **Jak mierzyć zmianę.** Narzędzie zestawia dwa pomiary, ale metody, która odróżni efekt programu od przypadku, jeszcze nie ma.

## Co sprawdzi walidacja

1. **Czy ankieta mierzy to, co ma mierzyć** na poziomie zespołu (z psychometrą).
2. **Czy scenariusz idzie w parze z danymi firm:** rotacją, absencją, błędami, zgłoszonymi pomysłami (Zał. 2 i 3).
3. **Czy zmiana po działaniach jest widoczna** w ponownym pomiarze, z porównaniem zespołów objętych i nieobjętych.

Plan zakłada 15 firm w pierwszej fazie. To wystarcza do opisu, nie do potwierdzenia ani obalenia modelu (moc testu około 19%). Wniosek potwierdzający wymaga około 61 firm przy silnym związku albo około 85 przy umiarkowanym. Dwie firmy pozwalają sprawdzić wykonalność i związki między zespołami wewnątrz firmy. Stan: dwie firmy wstępnie zainteresowane, pilotaż nierozpoczęty, protokół niezarejestrowany.

## Decyzje na spotkanie

1. **Skale ankiety:** pytania Ipsos czy skale z literatury. Skala UWES wymaga umowy przy użyciu komercyjnym; dla pozostałych nie znaleziono jawnej licencji.
2. **Prawa do narzędzia:** autor przekazuje Fundacji kalkulator wraz ze swoją pracą w zamian za udział w zyskach i wspiera sprzedaż. Do spisania: umowa i licencja (dziś kod jest na MIT).
3. **Dane:** kto jest administratorem, jak długo je trzymamy, czy mogą zasilać benchmark (Zał. 4).
4. **Pilotaż:** która firma, kiedy, i kto rejestruje protokół.
5. **Dane Ipsos:** dostęp do surowych danych i kwestionariusza, żeby zamknąć audyt (gotowa prośba: `docs/walidacja/prosba-o-dane-ipsos.md`). Przed otwarciem danych trzeba ustalić, co robimy, jeśli dane okażą się bardziej strome niż model: uczciwe dopasowanie mogłoby podnieść kwoty powyżej 5% przychodu.
6. **Przeliczniki na złote:** czy zostają założenia autora z jawnym statusem do czasu pilotażu, czy obniżamy je teraz do wartości udokumentowanych.
