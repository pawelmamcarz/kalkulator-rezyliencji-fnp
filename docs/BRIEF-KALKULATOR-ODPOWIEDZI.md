# Kalkulator: odpowiedzi na pytania z briefu

Stan: 4 października 2026 r. Notatka jest tekstową wersją odpowiedzi wpisanych do pliku „Brief na spotkanie – ankieta i Kalkulator (odp. Pawła).docx”. Podstawa: to repozytorium (`docs/PRIORY.md`, `docs/AUDYT-2026-09-04.md`, `src/fnpModel.js`, `LICENSE`) oraz główne repozytorium silence-tax.com (`podatekodmilczenia`: protokół walidacji, formularz danych, Worker ankiety, `fnp_batch.py`). Wersja kodu FNP: `2026.39.2.1`.

Źródło pytań: „Brief na spotkanie – ankieta i Kalkulator” (Marta, 3.10.2026). Załączniki dla Fundacji: `docs/dla-fundacji/` (Zał. 1–4).

## Najważniejsze w czterech zdaniach

1. Kalkulator istnieje jako działające narzędzie publiczne (https://fnp.silence-tax.com) z opisanym modelem, jawnymi założeniami i testami. Warunek krytyczny 3 jest spełniony w zakresie **scenariusza skali** (Zał. 1).
2. Narzędzie nie robi jeszcze tego, co zakłada ścieżka: nie jest powiązane z ankietą w interfejsie, nie liczy zmiany przed i po, nie rozróżnia zespołów. Plan testu na danych firm istnieje (protokół walidacji, Zał. 2), wyników jeszcze nie ma.
3. W głównym repozytorium są materiały badania walidacyjnego: kod Workera ankiety, formularz danych firmy, szablon zgody i starszy skrypt wsadowy łączący ankietę z modelem. Część pochodzi sprzed przebudowy modelu z lipca 2026 i wymaga aktualizacji.
4. Prawa: autor przekazuje Fundacji kalkulator wraz ze swoją pracą w zamian za udział w zyskach i wspiera sprzedaż. Formę przekazania i licencję trzeba spisać, bo dziś oba repozytoria są na licencji MIT (pkt 14).

## Badanie i metodyka (pytania, które dotychczas były otwarte)

**9. Pilotaż (150–300 osób).** Protokół walidacji zakłada fazę A na 15 firmach (co najmniej 50 FTE) z minimum 15 ważnymi odpowiedziami na firmę, docelowo 20, czyli około 225–300 osób. To mieści się w proponowanym zakresie. Zbieranie planowano na IV kwartał 2026 – III kwartał 2027, rejestrację wstępną na III kwartał 2026. Stan na 3.10.2026: rejestracja wstępna jeszcze niezłożona (do zrobienia przed zbieraniem danych, harmonogram do aktualizacji); wstępnie dwie firmy zainteresowane; pilotaż: jedna firma z kontaktów Emilki i jedna z kontaktów autora (**do potwierdzenia, termin do ustalenia**). Zał. 2.

**11. Zmienne skutku.** Osiem zmiennych: rotacja dobrowolna, błędy i defekty na 1000 godzin, zgłoszone pomysły, zaangażowanie (UWES-9), absencja, dzielenie się wiedzą (podskala milczenia uległego), narzut kierowniczy, poczucie bezpieczeństwa (PS-7). Większość pochodzi z rejestrów firmy, nie z badania Ipsos, więc spójność z raportem Ipsos sprawdzamy z psychometrą. Zał. 2 i 3.

**12. Długość ankiety.** Wersja badawcza: około 35 pozycji, około 10 minut na osobę. Ostateczną długość ustala twórca narzędzia. Przejście na pytania Ipsos zmieni długość i protokół.

**Uwaga do pytania 10 (skale).** Brief zakłada skalę Ipsos i brak skal z literatury. Protokół w obecnej postaci używa skal z literatury (Edmondson 1999, Van Dyne 2003, UWES-9). To rozbieżność do rozstrzygnięcia z psychometrą, razem z warunkami użycia skal w zastosowaniu komercyjnym.

## Stan prac i model

**14. Co dziś istnieje i do kogo należą prawa?**
Działające narzędzie webowe, silnik z testami (283 na 4.10.2026) i dokumentacja priorów. Autor: Paweł Mamcarz, kod na licencji MIT, silnik Silence Tax również jest autora. Pełna wersja na silence-tax.com (13 modułów, katalog interwencji z optymalizatorem, materiały akademickie) to osobne repozytorium, także MIT. MIT pozwala każdemu kopiować kod, także komercyjnie, co dotyczy zdania Marty o „podawaniu na tacy”. Nie da się skopiować z repozytorium: neutralności Fundacji, benchmarku Ipsos, danych z diagnoz. **Ustalenie autora z Fundacją:** autor przekazuje Fundacji kalkulator wraz ze swoją pracą w zamian za udział w zyskach i wspiera sprzedaż. **Do spisania z prawnikiem:** forma przekazania praw i licencja.

**15. Co dokładnie liczy?**
Jeden poziom: scenariusz skali kosztu milczenia dla jednej firmy. Wejścia: przychód, koszty, FTE, średnia roczna płaca, rotacja, klimat (suwak, szacunek własny). Wynik: kwota z pasmem P10–P90 dla trzech obszarów w sumie i dwóch poza sumą. Poziomu „związek w firmie” (BP a rotacja na danych firmy) nie ma. Autor zaznaczył w briefie: „Mogę dodać”.

**16. Założenia i źródła.**
Spisane w `PRIORY.md`; zestawienie z wartościami i statusem: Zał. 1. Kwoty to priory autora, badania uzasadniają mechanizm. Końce krzywych przypisane do Ipsos czekają na audyt tabel, więc nie mówimy, że model jest skalibrowany na Ipsos. Odniesienie rotacji 14,8% ma nieustalone pochodzenie: w publikacji GUS, której je przypisywano, tej wartości nie ma. GUS podaje współczynnik zwolnień 19,7% (2023) i 18,7% (2024), obejmujący wszystkie odejścia.

**17. Przedział czy jedna kwota?**
Kwota z pasmem P10–P90 (2000 losowań). Pasmo to rozrzut przyjętego scenariusza, nie przedział ufności. W głównym repozytorium jest nazywane granicami scenariusza i ten język proponuję w ofercie. Kontrakt produktu zakazuje obietnicy ROI i wyceny księgowej. W ofercie dla zarządu: granice scenariusza i procent przychodu, nie kwota środkowa.

**18. Badania naukowe.**
Uzasadniają mechanizm (Kiewitz i in. 2016, Adamska 2016, Penney 2016), nie wielkości w złotych. Przełożenie na polskie warunki jest częściowe. W materiałach sprzedażowych nie obiecujemy „bazy opracowań” jako podstawy kwot.

**19. Powiązanie z ankietą.**
W interfejsie Kalkulatora FNP: brak. Klimat to suwak wpisywany przez osobę z firmy. Stary skrypt wsadowy z głównego repozytorium (`fnp_batch.py`) liczył inny model niż silnik, więc jego wyników nie używamy. Zastąpiło go narzędzie `npm run fnp:wsad` (opis: `docs/WSAD.md`): bierze plik CSV z wynikami ankiet wielu firm, przelicza wynik (skala 1–7, 1–5 albo 0–100) na klimat 0–100, liczy obecny model FNP, daje powtarzalny wynik ze skrótem SHA-256 i zestawia dwa pomiary tej samej firmy jako różnicę scenariuszy. Protokół traktuje wynik PS-7 przeskalowany do 0–100 jako główne wejście modelu. Brakuje: interfejsu łączącego ankietę z Kalkulatorem i agregacji do zespołu.

## Dane i wiarygodność

**20. Dane minimalne.**
Do Kalkulatora: 4 pola (przychód, FTE, średnia płaca, rotacja) i szacunek klimatu. Pełna lista danych (41 pól w 6 sekcjach) jest w Zał. 3 z oznaczeniem, które są potrzebne do Kalkulatora. Bez podanej rotacji model przyjmuje odniesienie 14,8% (po korekcie modelu z 3.10.2026; wcześniej liczył to inną ścieżką i zawyżał kwotę). Deklarowana rotacja działa tylko jako górne ograniczenie. Klimat bez ankiety to szacunek własny.

**21. Wielkość firmy (poprawka do wcześniejszej wersji).**
Protokół wskazuje progi: od 50 FTE (poniżej hierarchia jest płytka i silnik prawdopodobnie przeszacowuje) oraz co najmniej 15 ważnych odpowiedzi na firmę do stabilnej średniej firmowej. To progi projektowe autora, nie ustalone przez psychometrę. Zał. 2.

**22. Różnice między zespołami.**
Model kosztów liczy firmę jako całość. Protokół zakłada analizę wielopoziomową (respondenci w firmach, ICC około 0,15, 20 osób na firmę). Próg 5 osób z briefu (zespół) i 15 osób na firmę z protokołu dotyczą różnych poziomów agregacji. Mapa zespołów z kroku 4 wymaga osobnej warstwy.

**23. Test na danych firmy (poprawka do wcześniejszej wersji).**
Plan testu istnieje: protokół walidacji z hipotezami H1–H5 i kryterium obalenia (korelacja poniżej 0,15 przy co najmniej 60 firmach). Faza A na 15 firmach jest dla poziomu firmy eksploracyjna. Wyników na razie nie ma. Szczegółowy protokół powstał przed przebudową modelu z lipca 2026 i wymaga aktualizacji. Pierwsza firma pilotażowa może wejść do fazy A. Zał. 2.

**24. Zmiana przy ponownym pomiarze.**
W narzędziu: brak. Dwa uruchomienia modelu to porównanie scenariuszy, nie dowód efektu. Faza C protokołu opisuje logikę: wyniki pierwotne określone przed wdrożeniem, porównanie w czasie, grupa odniesienia jeśli to możliwe, ROI tylko przy obserwowanych kosztach i efektach. Zaproszenie dla firm przewiduje opcjonalny re-pomiar po 6 miesiącach. Główny protokół jest przekrojowy, więc metoda przed/po wymaga osobnego opisu z psychometrą. Zał. 2, sekcja 7.

## Badanie założycielskie ze sponsorami

**26. Czy badanie założycielskie może być pilotażem.** Tak: faza A walidacji może być wspólnym pilotażem ankiety i Kalkulatora, jeśli Fundacja przyjmie jej zasady (firma od 50 FTE, co najmniej 15 respondentów, dane z rejestrów, zgoda). Starszy szablon zaproszenia obiecywał firmom bezpłatny raport indywidualny; trzeba to uzgodnić z modelem ścieżki płatnej.

**27. Nazwa „Ile kosztuje milczenie w Twojej firmie”.** Obiecuje więcej, niż Kalkulator daje. Propozycja: „Scenariusz skali kosztu milczenia”. Do decyzji Fundacji.

## Platforma, dane i formalności

**28. Platforma.** W głównym repozytorium jest kod infrastruktury ankiety (czy jest wdrożona, do potwierdzenia): Worker na Cloudflare z magazynem KV (anonimowe odpowiedzi, kody firm, haszowany e-mail zgody, limity zapytań, eksport CSV tylko z tokenem administratora) i czterokrokowy formularz zgłoszenia firmy. Nie wymaga zakupu licencji, ale działałaby na koncie Cloudflare autora. Bez ustawionej lokalizacji danych w UE i bez automatycznego usuwania po okresie przechowywania; trzeba to wdrożyć albo wybrać inną platformę.

**29. Raporty.** Dziś przygotowuje je autor: skrypt wsadowy, wydruk raportu z przeglądarki, analiza w R zaplanowana w protokole. Nie ma pulpitu (Power BI, Looker Studio). Fundacja powinna wskazać osobę lub wykonawcę.

**30. Umowa powierzenia.** Jest szablon zaproszenia i klauzula RODO dla badania naukowego (autor jako administrator). Wzoru umowy powierzenia nie ma. Projekt zmian i lista decyzji: Zał. 4.

**31. Inspektor ochrony danych.** W materiałach brak. Zaproszenie zawiera stwierdzenie o niskim ryzyku reidentyfikacji, ale odrębnego dokumentu oceny skutków nie znalazłem. Do wskazania w Fundacji.

**33. Własność danych i benchmark (poprawka do wcześniejszej wersji).** Sam Kalkulator FNP nie zbiera danych, ale w głównym repozytorium jest Worker ankiety badania walidacyjnego. Zgoda tam obejmuje cel naukowy, 5 lat przechowywania i zanonimizowany zbiór po publikacji. Nie obejmuje użycia danych z płatnych diagnoz do benchmarku ani rozwoju Kalkulatora: to wymaga zapisu w umowie z klientem (krok 10). Zał. 4.

**36. Czas dopracowania Kalkulatora.** Terminu nie podaję, bo zależy od decyzji nietechnicznych (prawa, powiązanie z ankietą, metoda przed/po). Lista prac: interfejs ankieta–model, metoda przed/po, audyt tabel Ipsos i odniesienia GUS, test na firmie pilotażowej.

**41. Firma pilotażowa.** Z perspektywy protokołu: co najmniej 50 FTE, 15 respondentów, 12 miesięcy danych z rejestrów. Czy pilotem może być sponsor lub partner konferencji, decyduje Fundacja.

## Podsumowanie warunków krytycznych

| Warunek | Stan |
| --- | --- |
| Opisany model i założenia | Tak, dla scenariusza skali (Zał. 1) |
| Wynik da się wyjaśnić zarządowi | Tak, w formie granic scenariusza i priorów, nie wyceny |
| Walidacja ankiety i modelu | Plan i protokół są (Zał. 2); brak wyników; rozbieżność skal (Ipsos czy literatura) |
| Połączenie z ankietą | Nowe narzędzie wsadowe na obecnym modelu (`npm run fnp:wsad`); w interfejsie nie |
| Pomiar przed i po | Opisany w protokole, nie wdrożony |
| Dane osobowe i formalności | Częściowo: szablon zgody i RODO dla badania; brak umowy powierzenia i inspektora (Zał. 4) |
| Prawa Fundacji do narzędzia | Ustalone co do zasady (przekazanie za udział w zyskach); umowa i licencja do spisania |

Rekomendowany werdykt z perspektywy Kalkulatora: **„idziemy dalej z warunkami”**, z warunkami: prawa (14), wybór skal z psychometrą (10, 11), plan pilotażu i status rejestracji (9, 23), metoda przed/po (24), dokumenty RODO (30, 31, 33).

## Aktualizacja z 4 października 2026 r.

- **Model.** Przegląd logiki wykrył i naprawił cztery błędy niezależne od danych (opis: Zał. 1, sekcja 7). Firma przykładowa: 3,12 mln zł zamiast 3,32 mln zł. Silnik jest teraz jeden, wspólny dla kalkulatora FNP i silence-tax.com.
- **Źródła.** Sprawdzono 46 cytowanych źródeł. 14,8% rotacji nie jest liczbą GUS. Na stronie zostały tylko liczby Ipsos potwierdzone publicznie (71%, 42%, 85% wobec 59%); 52%, 72%, 68%, 73% i średnia 41 wymagają pełnego raportu lub tabel Ipsos.
- **Skale (pyt. 10).** UWES jest bezpłatna tylko do celów akademickich; płatna usługa wymaga umowy z autorami. Dla skal Edmondson, Van Dyne i Teppera nie znaleziono jawnej licencji. To nie jest porada prawna.
- **Protokół (pyt. 23).** Kryterium obalenia wymaga przeliczenia: jego uzasadnienie statystyczne było błędne (przy około 60 firmach wartość krytyczna korelacji to około 0,21, nie 0,15).
- **Strona.** Główny przepływ kalkulatora ma 434 słowa zamiast ponad 2300; metodologia jest w zwijanej sekcji „Jak to liczymy”.
- **Rotunda.** Opisy dotyczą zdań, a nie osób czy sali; próg zespołu w heatmapie to 5; kalkulator jest pokazany jako osobna zajawka i nie korzysta z wyników gry.
- **Jedna strona na spotkanie:** `docs/dla-fundacji/Stan-wiedzy-na-spotkanie.docx` oraz `docs/STAN-WIEDZY.md`.
