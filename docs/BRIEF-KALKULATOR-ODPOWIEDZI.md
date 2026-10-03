# Kalkulator: odpowiedzi na pytania z briefu

Stan: 3 października 2026 r. Notatka jest tekstową wersją odpowiedzi wpisanych do pliku „Brief na spotkanie – ankieta i Kalkulator (odp. Pawła).docx”. Podstawa: to repozytorium (`docs/PRIORY.md`, `docs/AUDYT-2026-09-04.md`, `src/fnpModel.js`, `LICENSE`) oraz główne repozytorium silence-tax.com (`podatekodmilczenia`: protokół walidacji, formularz danych, Worker ankiety, `fnp_batch.py`). Wersja kodu FNP: `2026.39.2.1`.

Źródło pytań: „Brief na spotkanie – ankieta i Kalkulator” (Marta, 3.10.2026). Załączniki dla Fundacji: `docs/dla-fundacji/` (Zał. 1–4).

## Najważniejsze w czterech zdaniach

1. Kalkulator istnieje jako działające narzędzie publiczne (https://fnp.silence-tax.com) z opisanym modelem, jawnymi założeniami i testami. Warunek krytyczny 3 jest spełniony w zakresie **scenariusza skali** (Zał. 1).
2. Narzędzie nie robi jeszcze tego, co zakłada ścieżka: nie jest powiązane z ankietą w interfejsie, nie liczy zmiany przed i po, nie rozróżnia zespołów. Plan testu na danych firm istnieje (protokół walidacji, Zał. 2), wyników jeszcze nie ma.
3. W głównym repozytorium jest gotowa infrastruktura badania walidacyjnego: Worker ankiety, formularz danych firmy, szablon zgody i skrypt łączący ankietę z modelem w trybie wsadowym.
4. Prawa nie są rozstrzygnięte na korzyść Fundacji: oba repozytoria są na licencji MIT, a autorem jest Paweł Mamcarz (pkt 14).

## Badanie i metodyka (pytania, które dotychczas były otwarte)

**9. Pilotaż (150–300 osób).** Protokół walidacji zakłada fazę A na 15 firmach (co najmniej 50 FTE) z minimum 15 ważnymi odpowiedziami na firmę, docelowo 20, czyli około 225–300 osób. To mieści się w proponowanym zakresie. Zbieranie planowano na IV kwartał 2026 – III kwartał 2027, rejestrację wstępną na III kwartał 2026. **Do uzupełnienia:** status rejestracji, liczba zgłoszonych firm, firma pilotażowa i termin. Zał. 2.

**11. Zmienne skutku.** Osiem zmiennych: rotacja dobrowolna, błędy i defekty na 1000 godzin, zgłoszone pomysły, zaangażowanie (UWES-9), absencja, dzielenie się wiedzą (podskala milczenia uległego), narzut kierowniczy, poczucie bezpieczeństwa (PS-7). Większość pochodzi z rejestrów firmy, nie z badania Ipsos, więc spójność z raportem Ipsos sprawdzamy z psychometrą. Zał. 2 i 3.

**12. Długość ankiety.** Wersja badawcza: około 35 pozycji, około 10 minut na osobę. Ostateczną długość ustala twórca narzędzia. Przejście na pytania Ipsos zmieni długość i protokół.

**Uwaga do pytania 10 (skale).** Brief zakłada skalę Ipsos i brak skal z literatury. Protokół w obecnej postaci używa skal z literatury (Edmondson 1999, Van Dyne 2003, UWES-9). To rozbieżność do rozstrzygnięcia z psychometrą, razem z warunkami użycia skal w zastosowaniu komercyjnym.

## Stan prac i model

**14. Co dziś istnieje i do kogo należą prawa?**
Działające narzędzie webowe, silnik z testami (142 w audycie z 4.09.2026) i dokumentacja priorów. Autor: Paweł Mamcarz, kod na licencji MIT, silnik Silence Tax również jest autora. Pełna wersja na silence-tax.com (13 modułów, katalog interwencji z optymalizatorem, materiały akademickie) to osobne repozytorium, także MIT. MIT pozwala każdemu kopiować kod, także komercyjnie, co dotyczy zdania Marty o „podawaniu na tacy”. Nie da się skopiować z repozytorium: neutralności Fundacji, benchmarku Ipsos, danych z diagnoz. **Decyzja z prawnikiem:** licencja osobnego wydania dla ścieżki płatnej, albo pozostanie przy MIT.

**15. Co dokładnie liczy?**
Jeden poziom: scenariusz skali kosztu milczenia dla jednej firmy. Wejścia: przychód, koszty, FTE, średnia roczna płaca, rotacja, klimat (suwak, szacunek własny). Wynik: kwota z pasmem P10–P90 dla trzech obszarów w sumie i dwóch poza sumą. Poziomu „związek w firmie” (BP a rotacja na danych firmy) nie ma. Autor zaznaczył w briefie: „Mogę dodać”.

**16. Założenia i źródła.**
Spisane w `PRIORY.md`; zestawienie z wartościami i statusem: Zał. 1. Kwoty to priory autora, badania uzasadniają mechanizm. Końce krzywych przypisane do Ipsos czekają na audyt tabel, więc nie mówimy, że model jest skalibrowany na Ipsos. Odniesienie rotacji 14,8% (GUS) jest niezweryfikowane.

**17. Przedział czy jedna kwota?**
Kwota z pasmem P10–P90 (2000 losowań). Pasmo to rozrzut przyjętego scenariusza, nie przedział ufności. W głównym repozytorium jest nazywane granicami scenariusza i ten język proponuję w ofercie. Kontrakt produktu zakazuje obietnicy ROI i wyceny księgowej. W ofercie dla zarządu: granice scenariusza i procent przychodu, nie kwota środkowa.

**18. Badania naukowe.**
Uzasadniają mechanizm (Kiewitz i in. 2016, Adamska 2016, Penney 2016), nie wielkości w złotych. Przełożenie na polskie warunki jest częściowe. W materiałach sprzedażowych nie obiecujemy „bazy opracowań” jako podstawy kwot.

**19. Powiązanie z ankietą.**
W interfejsie Kalkulatora FNP: brak. Klimat to suwak wpisywany przez osobę z firmy. W głównym repozytorium istnieje most wsadowy: skrypt `fnp_batch.py` przelicza wynik ankiety (skala 1–7 lub 0–100) na klimat 0–100 i uruchamia model dla każdej firmy, zapisując predykcje przed porównaniem z wynikami. Działa na pliku CSV. Protokół traktuje wynik PS-7 przeskalowany do 0–100 jako główne wejście modelu. Brakuje: interfejsu łączącego ankietę z Kalkulatorem i agregacji do zespołu.

## Dane i wiarygodność

**20. Dane minimalne.**
Do Kalkulatora: 4 pola (przychód, FTE, średnia płaca, rotacja) i szacunek klimatu. Pełna lista danych (około 50 pól w 6 sekcjach) jest w Zał. 3 z oznaczeniem, które są potrzebne do Kalkulatora. Wariant „brak danych”: rotacja równa odniesieniu 14,8%, klimat jako szacunek własny.

**21. Wielkość firmy (poprawka do wcześniejszej wersji).**
Protokół wskazuje progi: od 50 FTE (poniżej hierarchia jest płytka i silnik prawdopodobnie przeszacowuje) oraz co najmniej 15 ważnych odpowiedzi na firmę do stabilnej średniej firmowej. To progi projektowe autora, nie ustalone przez psychometrę. Zał. 2.

**22. Różnice między zespołami.**
Model kosztów liczy firmę jako całość. Protokół zakłada analizę wielopoziomową (respondenci w firmach, ICC około 0,15, 20 osób na firmę). Próg 5 osób z briefu (zespół) i 15 osób na firmę z protokołu dotyczą różnych poziomów agregacji. Mapa zespołów z kroku 4 wymaga osobnej warstwy.

**23. Test na danych firmy (poprawka do wcześniejszej wersji).**
Plan testu istnieje: protokół walidacji z hipotezami H1–H5 i kryterium obalenia (korelacja poniżej 0,15 przy co najmniej 60 firmach). Faza A na 15 firmach jest dla poziomu firmy eksploracyjna. Wyników na razie nie ma. Pierwsza firma pilotażowa może wejść do fazy A. Zał. 2.

**24. Zmiana przy ponownym pomiarze.**
W narzędziu: brak. Dwa uruchomienia modelu to porównanie scenariuszy, nie dowód efektu. Faza C protokołu opisuje logikę: wyniki pierwotne określone przed wdrożeniem, porównanie w czasie, grupa odniesienia jeśli to możliwe, ROI tylko przy obserwowanych kosztach i efektach. Zaproszenie dla firm przewiduje opcjonalny re-pomiar po 6 miesiącach. Główny protokół jest przekrojowy, więc metoda przed/po wymaga osobnego opisu z psychometrą. Zał. 2, sekcja 7.

## Badanie założycielskie ze sponsorami

**26. Czy badanie założycielskie może być pilotażem.** Tak: faza A walidacji może być wspólnym pilotażem ankiety i Kalkulatora, jeśli Fundacja przyjmie jej zasady (firma od 50 FTE, co najmniej 15 respondentów, dane z rejestrów, zgoda). Firmy w badaniu dostają bezpłatny raport indywidualny, co trzeba uzgodnić z modelem ścieżki płatnej.

**27. Nazwa „Ile kosztuje milczenie w Twojej firmie”.** Obiecuje więcej, niż Kalkulator daje. Propozycja: „Scenariusz skali kosztu milczenia”. Do decyzji Fundacji.

## Platforma, dane i formalności

**28. Platforma.** Działa infrastruktura ankiety: Worker na Cloudflare z magazynem KV (anonimowe odpowiedzi, kody firm, haszowany e-mail zgody, limity zapytań, eksport CSV tylko z tokenem administratora) i czterokrokowy formularz zgłoszenia firmy. Fundacja nie potrzebuje licencji. Bez ustawionej lokalizacji danych w UE i bez automatycznego usuwania po okresie przechowywania; trzeba to wdrożyć albo wybrać inną platformę.

**29. Raporty.** Dziś przygotowuje je autor: skrypt wsadowy, wydruk raportu z przeglądarki, analiza w R zaplanowana w protokole. Nie ma pulpitu (Power BI, Looker Studio). Fundacja powinna wskazać osobę lub wykonawcę.

**30. Umowa powierzenia.** Jest szablon zaproszenia i klauzula RODO dla badania naukowego (autor jako administrator). Wzoru umowy powierzenia nie ma. Projekt zmian i lista decyzji: Zał. 4.

**31. Inspektor ochrony danych.** W materiałach brak. Zaproszenie zawiera stwierdzenie o niskim ryzyku reidentyfikacji, ale odrębnego dokumentu oceny skutków nie znalazłem. Do wskazania w Fundacji.

**33. Własność danych i benchmark (poprawka do wcześniejszej wersji).** Sam Kalkulator FNP nie zbiera danych, ale w głównym repozytorium działa Worker ankiety badania walidacyjnego. Zgoda tam obejmuje cel naukowy, 5 lat przechowywania i zanonimizowany zbiór po publikacji. Nie obejmuje użycia danych z płatnych diagnoz do benchmarku ani rozwoju Kalkulatora: to wymaga zapisu w umowie z klientem (krok 10). Zał. 4.

**36. Czas dopracowania Kalkulatora.** Terminu nie podaję, bo zależy od decyzji nietechnicznych (prawa, powiązanie z ankietą, metoda przed/po). Lista prac: interfejs ankieta–model, metoda przed/po, audyt tabel Ipsos i odniesienia GUS, test na firmie pilotażowej.

**41. Firma pilotażowa.** Z perspektywy protokołu: co najmniej 50 FTE, 15 respondentów, 12 miesięcy danych z rejestrów. Czy pilotem może być sponsor lub partner konferencji, decyduje Fundacja.

## Podsumowanie warunków krytycznych

| Warunek | Stan |
| --- | --- |
| Opisany model i założenia | Tak, dla scenariusza skali (Zał. 1) |
| Wynik da się wyjaśnić zarządowi | Tak, w formie granic scenariusza i priorów, nie wyceny |
| Walidacja ankiety i modelu | Plan i protokół są (Zał. 2); brak wyników; rozbieżność skal (Ipsos czy literatura) |
| Połączenie z ankietą | W trybie wsadowym tak, w interfejsie nie |
| Pomiar przed i po | Opisany w protokole, nie wdrożony |
| Dane osobowe i formalności | Częściowo: szablon zgody i RODO dla badania; brak umowy powierzenia i inspektora (Zał. 4) |
| Prawa Fundacji do narzędzia | Nierozstrzygnięte (MIT, autor Paweł Mamcarz) |

Rekomendowany werdykt z perspektywy Kalkulatora: **„idziemy dalej z warunkami”**, z warunkami: prawa (14), wybór skal z psychometrą (10, 11), plan pilotażu i status rejestracji (9, 23), metoda przed/po (24), dokumenty RODO (30, 31, 33).
