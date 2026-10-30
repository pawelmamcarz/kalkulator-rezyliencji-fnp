# Audyt raportu FNP × Ipsos „Ile kosztuje milczenie?”

Data: 30.10.2026. Zakres: zestawienie 78-stronicowego raportu Fundacji Nowe Przestrzenie i Ipsos Polska z `src/logic/constants.js` oraz opisem kalkulatora FNP. Raport jest dostępny w wiadomości Fundacji z 1.04.2026; do weryfikacji użyto prezentacji udostępnionej przez Fundację. Numery poniżej to numery stron prezentacji. [Strona raportu Fundacji](https://www.noweprzestrzenie.pl/raport-bezpieczenstwa-psychologicznego). Link dostępu z wiadomości nie jest publikowany w repozytorium.

**Granica audytu:** przejrzano pełną prezentację i zawarte w niej wykresy oraz opisy. Nie otrzymano osobnego pakietu tabel krzyżowych, mikrodanych, pełnego kwestionariusza ani klucza indeksu. Odnalezienie liczby w prezentacji potwierdza jej opis w raporcie, lecz nie poprawność analizy próby i nie dopasowanie modelu. Nie użyto ani nie podłączono danych ANG.

## Próba i interpretacja

Raport, s. 7, 12 i 14: CAWI w panelu online Ipsos Polska, październik 2025, n = 1000, 18–65 lat, praca w zespołach co najmniej 5-osobowych, co najmniej wykształcenie średnie techniczne. Wyniki ważono według płci, wieku, branży i makroregionu. Próba jest zawężona m.in. do pracy zespołowej i koncepcyjnej, z wyłączeniami opisanymi na s. 12, w tym administracji i służb państwowych. Nie jest to pomiar wszystkich pracujących w Polsce. Siedem wymiarów bezpieczeństwa opisano na s. 10–11, a s. 14 odwołuje się do kwestionariusza Edmondson; brak tu jednak klucza, granic przedziałów, liczebności podgrup i precyzji estymacji.

Na s. 14 pięć kategorii to 14% bardzo niskie, 17% niskie, 40% obniżone, 15% umiarkowane i 14% wysokie. 71% to suma trzech niższych kategorii, a 29% to umiarkowane i wysokie razem. Streszczenie na s. 6 nazywa 29% poziomem wysokim, co nie zgadza się z wykresem. Nie należy przedstawiać 71% jako osób pozbawionych jakiegokolwiek bezpieczeństwa ani 29% jako samego wysokiego poziomu.

## Audyt 12 wskaźników

Wartości `low / high` poniżej są parametrami, a nie wynikami krzywej dla 0 i 100. W FNP `K = 0,30`: krzywe nie dochodzą do asymptot w przedziale 0–100. Zgodność A oznacza jedynie zgodność przepisu z tekstem raportu; walidacja B wymaga porównania wyniku krzywej i obserwacji w tych samych grupach. Różne sformułowania raportu dotyczące niskiego i wysokiego bezpieczeństwa wymagają dodatkowej definicji grup.

| Wskaźnik | Parametry | Weryfikacja raportu i status |
|---|---:|---|
| `blameRate` | 72% / 2% | S. 48: szukanie winnego w grupie niskiego i wysokiego bezpieczeństwa odpowiednio 72% i 2%. Zgodne z opisem A, bez liczebności i progów grup. |
| `errorFear` | 72% / 5% | S. 16: 42% ogółu uważa, że błąd może zostać użyty przeciw pracownikowi. S. 48: 72% dotyczy szukania winnego, nie udokumentowanego odsetka ukrytych błędów. 5% brak potwierdzenia. Przypisanie do ukrywania błędów niezweryfikowane, możliwe powtórzenie tej samej informacji co `blameRate`. |
| `teamStability` | 59% / 85% | S. 24 i 42: deklarowana stabilność zespołu; 59% i 85% odpowiednio dla niskiego i wysokiego bezpieczeństwa. Nie są to zmierzone stopy odejść lub rotacji w FTE. |
| `helpComfort` | 21% / 99% | S. 17: komfort proszenia o pomoc, 21% i 99% w opisanych grupach. Potwierdza kierunek i liczby A; wskaźnik może pokrywać się z elementem konstrukcji indeksu, co trzeba sprawdzić na kwestionariuszu. |
| `burnoutRate` | 51% / 8% | S. 25: 51% grupy niskiego bezpieczeństwa odczuwa wyraźne oznaki wypalenia; 8% to szacunek autora, nie wartość pokazana w tej tabeli. Próg i narzędzie pomiaru nie zostały tu podane. |
| `ideaSilence` | 52% / 10% | S. 51: niedzielenie się pomysłami z obawy przed odrzuceniem, 52% i 10% w opisanych grupach. Zgodne A; nie jest to liczba straconych innowacji ani ich wartość. |
| `passivity` | 59% / 8% | S. 22 i 50: 59% niskiego bezpieczeństwa uważa, że nie warto wychylać się ze zdaniem w sprawach innych. 8% nie ma potwierdzenia w pokazanym wyniku. |
| `riskAversion` | 70% / 15% | S. 16: 56% ogółu obawia się ryzyka podejmowanego w dobrych intencjach. 70% i 15% dla tej zmiennej nie zostały ustalone na podstawie raportu. Nie zastępować 70% wynikiem satysfakcji z pracy ze s. 26. |
| `procedureUse` | 39% / 79% | S. 29 i 32: wiedza, co zrobić, by zgłosić nieprawidłowości, 39% i 79%. To znajomość, nie pomiar korzystania ani skuteczności procedur. S. 32 podaje osobno 27% i 61% dla przekonania o sensie korzystania z nich. |
| `snitchPerc` | 55% / 10% | S. 53: 5% i 41% **zdecydowanie nie** uważa zgłaszania usprawnień pracy innych za donosicielstwo. To nie jest odsetek odpowiedzi przeciwnych i nie można go tak odwrócić bez pełnego rozkładu. S. 22: 35% ogółu zgadza się z takim określeniem; 55% na s. 20 dotyczy obawy, że propozycje zmian odbierane są jako krytyka. Zgodność parametrów 55% / 10% z tym pytaniem niepotwierdzona. |
| `workJoy` | 19% / 70% | S. 26: 19% i 70% ocenia, że pracuje się wspaniale lub bardzo dobrze. Nie zawężać tego progu do samego „wspaniale”. |
| `destructiveFear` | 74% / 19% | S. 23: stale przeżywany lęk w obu grupach 74% i 19%; określenie „destrukcyjny” i użycie w kosztach jest interpretacją modelu, nie podaną skalą diagnostyczną. |

S. 22 podaje 35% ogółu dla postrzegania zgłoszenia usprawnień jako donosicielstwa, a publiczna strona Fundacji 36%. Powód różnicy jest nieznany. W innym pytaniu s. 16 podaje 36% jako sumę 18% dostrzegających umyślne podważanie wartości pracy i 18% niepewnych; to nie ten sam wskaźnik.

## Co raport potwierdza, a czego nie

- Raport opisuje współwystępowanie deklaracji w badaniu przekrojowym. Nie dowodzi, że zmiana bezpieczeństwa spowoduje konkretną zmianę rotacji, liczby błędów, wypalenia lub przychodu. Deklaracja stabilności nie mierzy faktycznej rotacji; 51% objawów nie jest kosztem wynagrodzeń.
- `low` i `high` nie są wartościami wynikowymi dla końców suwaka. Bez granic grup i ich średnich na tej samej skali 0–100 nie da się policzyć różnic między wynikami raportu a modelem w porównywalnych punktach ani potwierdzić `k`, `mid`, przesunięcia +4 i mnożnika 0,30.
- Raport nie wyznacza użytych przeliczników na złote, np. kosztu zastąpienia 0,75 rocznej płacy, udziału klimatu 0,5, częstości i kosztu błędów, kosztu wypalenia czy korekt nakładania. Nie uzasadnia też sumy jako zmierzonej straty, prognozy ani skutku interwencji.
- Część pytań o błąd, pomoc i ryzyko może wchodzić do indeksu, według którego porównywane są grupy. Ocena ich związku z tym indeksem może być częściowo kolista. Weryfikacja wymaga klucza i analizy z wyłączeniem danej pozycji.
- Średniej 41 na skali 0–100 nie udało się odtworzyć z przedstawionych pięciu kategorii. Ich granice, średnie i sposób punktowania nie są w prezentacji podane. Nie uznawać 41 za zweryfikowaną średnią krajową.

## Konsekwencje dla kalkulatora i kolejny etap

1. Skorygować tekst kontekstu: wskazać zawężoną populację, pięć kategorii i interpretację 71%; 42% opisać jako przekonanie o wykorzystywaniu błędu przeciw osobie, a 85/59 jako deklarowaną stabilność. Nie sugerować, że raport pozostaje nieprzeczytany, ani że osobne tabele zostały sprawdzone.
2. Opisać przy pozycjach `errorFear` i `snitchPerc` brak zgodności użytego wskaźnika z jednoznacznie potwierdzonym pytaniem; przy `procedureUse` konsekwentnie mówić o znajomości, nie używaniu. Nie zmieniać automatycznie parametrów liczbowych ani wzorów na podstawie samych slajdów.
3. Uzyskać od autorów/Ipsos kwestionariusz i kodowanie, definicję indeksu i pięciu grup, osobne tabele z nieważonymi liczebnościami i ważeniem oraz, jeśli to możliwe, mikrodane i księgę kodów. Przed analizą uzgodnić plan w `plan-analizy-mikrodanych.md` i oddzielić dopasowanie wartości od walidacji kosztów.
4. Nie integrować wyników ANG bez osobnego uzgodnienia. Badanie FNP × Ipsos nie jest badaniem ANG.
