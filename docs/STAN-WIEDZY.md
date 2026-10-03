# Kalkulator Rezyliencji FNP: co wiemy, czego nie wiemy, co sprawdzi walidacja

Stan na 4 października 2026 r. Jedna strona na spotkanie 6 października. Szczegóły: `docs/BRIEF-KALKULATOR-ODPOWIEDZI.md` i załączniki w `docs/dla-fundacji/`.

## Co to jest

Kalkulator pokazuje **scenariusz skali**: ile mogłyby kosztować rotacja, późno zgłaszane błędy i wypalenie w firmie o podanych danych i podanym klimacie. To nie jest pomiar, wycena, prognoza ani obietnica oszczędności.

## Co wiemy

- **Rachunek jest sprawdzony.** Model ma 283 testy, a 3 października przeszedł przegląd logiki, który naprawił cztery błędy niezależne od danych. Firma przykładowa (500 etatów, 100 mln zł przychodu, klimat 41): 3,12 mln zł, od 2,36 do 3,94 mln zł.
- **Założenia są jawne.** Każda liczba w modelu ma opisany status: założenie autora, wartość przypisana raportowi Ipsos albo wartość o nieustalonym pochodzeniu (Zał. 1).
- **Źródła są sprawdzone.** 46 cytowanych prac zweryfikowano: czy istnieją i czy mówią to, co im przypisano. Badania uzasadniają mechanizm (strach, milczenie, ukrywanie błędów), nie przeliczniki na złote.
- **Narzędzia są gotowe do pilotażu:** kalkulator na stronie, narzędzie do liczenia wielu firm z wyników ankiety i do zestawienia dwóch pomiarów, formularz danych firmy (Zał. 3), demonstracja na konferencję (Rotunda).

## Czego nie wiemy

- **Czy kwoty są trafne.** Modelu nie sprawdzono na danych żadnej firmy. Przeliczniki pieniężne (np. koszt zastąpienia pracownika równy 0,75 rocznej płacy) są założeniami autora.
- **Czy model jest zgodny z tabelami Ipsos.** Końce krzywych przypisano raportowi Ipsos × FNP, ale audytu tabel nie było. Publicznie potwierdzone są tylko niektóre liczby (71%, 42%, 85% wobec 59%).
- **Skąd pochodzi 14,8% rotacji.** Nie z GUS. GUS podaje 19,7% (2023) i 18,7% (2024) dla wszystkich odejść. Model używa 14,8% tylko wtedy, gdy firma nie poda rotacji.
- **Jak przeliczać wynik ankiety na klimat 0–100.** Dziś klimat to szacunek własny jednej osoby. Przeliczenie średniej z ankiety na tę skalę jest założeniem.
- **Jak mierzyć zmianę.** Narzędzie zestawia dwa pomiary, ale metody, która odróżni efekt programu od przypadku, jeszcze nie ma.

## Co sprawdzi walidacja

1. **Czy ankieta mierzy to, co ma mierzyć** na poziomie zespołu (z psychometrą).
2. **Czy scenariusz idzie w parze z danymi firm:** rotacją, absencją, błędami, zgłoszonymi pomysłami (Zał. 2 i 3).
3. **Czy zmiana po działaniach jest widoczna** w ponownym pomiarze, z porównaniem zespołów objętych i nieobjętych.

Plan zakłada 15 firm w pierwszej fazie (wynik orientacyjny) i co najmniej 61 dla wniosku potwierdzającego. Stan: dwie firmy wstępnie zainteresowane, pilotaż nierozpoczęty, protokół niezarejestrowany.

## Decyzje na spotkanie

1. **Skale ankiety:** pytania Ipsos czy skale z literatury. Skala UWES wymaga umowy przy użyciu komercyjnym; dla pozostałych nie znaleziono jawnej licencji.
2. **Prawa do narzędzia:** autor przekazuje Fundacji kalkulator wraz ze swoją pracą w zamian za udział w zyskach i wspiera sprzedaż. Do spisania: umowa i licencja (dziś kod jest na MIT).
3. **Dane:** kto jest administratorem, jak długo je trzymamy, czy mogą zasilać benchmark (Zał. 4).
4. **Pilotaż:** która firma, kiedy, i kto rejestruje protokół.
5. **Tabele Ipsos:** dostęp do pełnego raportu, żeby zamknąć audyt.
