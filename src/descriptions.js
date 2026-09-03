// Detailed descriptions for each cost module and behavioral metric

// Source the interpret() figures from the actual model instead of hardcoding
// sigmoids: keeps the UI text in lockstep with computeCosts(). Hardcoded copies
// drifted (e.g. helpComfort used k=0.08/mid=50 while the model uses
// k=0.08*K_SIGMOID_DEFAULT_MULT and the metric's own midpoint), diverging by
// ~15 pp at the extremes.
import {
  getMetricValue,
  alphaFromSafety,
  K_SIGMOID_DEFAULT_MULT,
  LEADER_SILENCE_FREQ_MULT,
} from "./logic.js";

export const COST_DESCRIPTIONS = {
  errors: {
    title: "Ukrywanie błędów",
    what: "Pracownicy, którzy boją się konsekwencji, ukrywają błędy zamiast je zgłaszać. Im dłużej błąd pozostaje niewidoczny, tym droższe jest jego naprawienie, średnio 3.5x więcej niż przy natychmiastowej detekcji.",
    mechanism: `Kultura obwiniania (72% w zespołach o niskim BP vs 2% w wysokim) powoduje, że pracownicy uczą się strategii przetrwania: 'lepiej schować problem niż ryzykować karę'. To milczenie taktyczne, świadoma kalkulacja kosztów i zysków zabierania głosu (Adamska 2016). Błędy kumulują się, a gdy w końcu wychodzą na jaw, koszty naprawy są wielokrotnie wyższe.`,
    example: "Kierowniczka jednego ze sklepów sieci supermarketów przez strach ukrywała pomyłkę, zamówiła 100 zamiast 10 palet śmietany. Bagaż z poprzedniego pracodawcy: 'radź sobie sama, jak nie, kara' (anonimowy case z manuskryptu §12.1).",
    tceConnection: "Gdy ludzie nie zgłaszają błędów dobrowolnie, firma musi budować kosztowne systemy kontroli (audyty, inspekcje, warstwy zatwierdzania). Im mniej zaufania, tym droższy monitoring.",
    interpret: (params, value) => `W Twojej firmie (${params.employees} pracowników, safety: ${params.safety}) koszt ukrywania błędów to ${Math.round(value / 1000)}k PLN/rok, czyli ${Math.round(value / params.employees)} PLN na pracownika. Model uwzględnia 4 kategorie problemów, poważniejsze błędy mają wyższy mnożnik późnej detekcji (do 6x).`,
  },
  innovation: {
    title: "Utrata innowacyjności",
    what: "Gdy ludzie boją się mówić, milczą z pomysłami. 52% pracowników w zespołach o niskim BP nie dzieli się pomysłami usprawnieniowymi. Do tego dochodzi unikanie ryzyka (70% w grupie low), co blokuje wdrażanie nawet tych pomysłów, które się przebijają.",
    mechanism: "Innowacja wymaga dwóch rzeczy: zgłoszenia pomysłu i odwagi wdrożenia. Niskie BP blokuje oba kanały. Firma traci dostęp do pomysłów swoich ludzi, a to oni najlepiej znają procesy, klientów i wąskie gardła.",
    example: "Case Groupon z raportu: brak wysłuchania pomysłu pracownika mógł zablokować 5-10x wzrost wolumenu. Jeden niewypowiedziany pomysł = potencjalne miliony.",
    tceConnection: "Pracownicy znają procesy, klientów i wąskie gardła lepiej niż zarząd, ale gdy milczą, ta wiedza jest zamrożona. Firma płaci za wiedzę (pensje), ale z niej nie korzysta.",
    interpret: (params, value) => `Przy przychodzie ${Math.round(params.revenue / 1e6)}M PLN szacujemy potencjał innowacyjny na ${Math.round(params.revenue * 0.03 / 1e6)}M PLN/rok. Przy safety ${params.safety} tracisz z tego ${Math.round(value / 1e6 * 100) / 100}M PLN, bo pomysły nie docierają do decydentów.`,
  },
  turnover: {
    title: "Nadmierna rotacja",
    what: "Stabilność zespołu w firmach o niskim BP to 59%, vs 85% w wysokim. Każde odejście kosztuje 6-9 miesięcy pensji (rekrutacja, onboarding, utracona produktywność, drain wiedzy). Benchmark rotacji: GUS 2024 – Polska 14,8% / SHRM 2024 – USA 19%.",
    mechanism: "Ludzie nie odchodzą z firm, odchodzą od toksycznych kultur. Gdy brakuje bezpieczeństwa psychologicznego, najlepsi odchodzą pierwsi (mają gdzie). Zostają ci, którzy boją się zmian. To odwrotna selekcja.",
    example: "W zespole 100 osób różnica między 59% a 85% stabilności to ~26 dodatkowych odejść rocznie. Przy średniej pensji 120k PLN i koszcie rotacji 75% pensji = 2.3M PLN rocznie.",
    tceConnection: "Hirschman (1970): gdy ludzie nie mogą mówić (voice), odchodzą (exit). Najlepsi odchodzą pierwsi, bo mają dokąd. Każde odejście to utrata wiedzy, relacji i inwestycji we wdrożenie.",
    interpret: (params, value) => `Twoja firma (${params.employees} osób, śr. pensja ${Math.round(params.avgSalary / 1000)}k PLN) traci szacunkowo ${Math.round(value / 1000)}k PLN/rok na nadmierną rotację. To ${Math.round(value / params.avgSalary)} dodatkowych odejść ponad naturalny poziom.`,
  },
  burnout: {
    title: "Wypalenie / presenteeism",
    what: "51% pracowników w zespołach o niskim BP doświadcza wypalenia, vs ~8% w wysokim. Wypalony pracownik traci ok. 25% produktywności, jest fizycznie obecny, ale mentalnie nieobecny (presenteeism).",
    mechanism: "Ciągły stres, lęk przed błędami, brak wsparcia, poczucie bezsensu, to recepta na wypalenie. Wypaleni pracownicy nie tylko mniej produkują, ale też generują więcej błędów, częściej chorują i obniżają morale zespołu.",
    example: "Badanie Ipsos: w grupie niskiego BP 51% deklaruje objawy wypalenia. To nie jest kwestia 'słabych jednostek', to systemowy problem kultury organizacji.",
    tceConnection: "Wypaleni pracownicy podejmują gorsze decyzje, popełniają więcej błędów i generują dodatkowe koszty w całej organizacji. To nie problem jednostki, to systemowy koszt toksycznej kultury.",
    interpret: (params, value) => `Przy ${params.employees} pracownikach i safety ${params.safety} szacujemy, że ${Math.round(params.employees * 0.51 * (1 - params.safety / 100))} osób doświadcza wypalenia. Koszt utraconej produktywności: ${Math.round(value / 1000)}k PLN/rok.`,
  },
  passivity: {
    title: "Bierność i silosy",
    what: "59% pracowników o niskim BP przyjmuje postawę 'nie wtrącam się'. Dodatkowo 35% uważa, że zgłaszanie usprawnień = bycie donosicielem. To podwójny hamulec: ludzie widzą problemy, ale świadomie milczą.",
    mechanism: `Bierność to klasyczne \u201Ebycie uciszonym\u201D (Adamska 2016), wyuczona bezradność, produkt socjalizacji organizacyjnej. Gdy kilka razy doświadczysz, że Twoje sugestie są ignorowane lub karane, uczysz się nie reagować automatycznie, poniżej progu świadomości. Silosy powstają naturalnie: 'moja działka, nie moja sprawa'. Firma traci tysiące mikro-usprawnień dziennie.`,
    example: "Każdy z 2000 pracowników widzi ~1 usprawnienie na 20 dni pracy. Przy 59% bierności firma traci dostęp do ~14 000 usprawnień rocznie. Nawet jeśli każde jest warte tylko 500 PLN, to 7M PLN niewykorzystanego potencjału.",
    tceConnection: "Bierność to racjonalna reakcja: po kilku zignorowaniach sugestii ludzie uczą się nie reagować. 'Nie moja sprawa' = mechanizm obronny, nie lenistwo. Firma traci tysiące mikro-usprawnień dziennie.",
    interpret: (params, value) => `W Twojej firmie (${params.employees} osób) szacujemy ${Math.round(params.employees * 0.05 * 230)} potencjalnych usprawnień/rok. Przy safety ${params.safety} tracisz dostęp do większości z nich. Koszt: ${Math.round(value / 1000)}k PLN/rok.`,
  },
  help: {
    title: "Deficyt proszenia o pomoc",
    what: "Komfort proszenia o pomoc: 21% w niskim BP vs 99% w wysokim. Gdy ludzie boją się poprosić o pomoc, popełniają zapobiegalne błędy, marnują czas na samodzielne rozwiązywanie problemów i nie uczą się od innych.",
    mechanism: "Proszenie o pomoc wymaga przyznania się do niewiedzy, a to w kulturze obwiniania jest postrzegane jako słabość. Efekt: ludzie spędzają godziny na problemach, które kolega rozwiązałby w minuty. Błędy, które mogłyby być wychwycone, przechodzą dalej.",
    example: "Nowy pracownik nie wie, jak obsłużyć reklamację klienta. W kulturze wysokiego BP pyta kolegę i rozwiązuje w 5 minut. W niskim BP, szuka sam 2 godziny, popełnia błąd, klient odchodzi.",
    tceConnection: "Gdy ludzie boją się przyznać do niewiedzy, nie proszą o pomoc, i marnują godziny na problemy, które kolega rozwiązałby w minuty. Wiedza doświadczonych pracowników nie przepływa do reszty zespołu.",
    interpret: (params, value) => `Przy safety ${params.safety} komfort proszenia o pomoc w Twojej firmie to ok. ${Math.round(getMetricValue("helpComfort", params.safety, K_SIGMOID_DEFAULT_MULT) * 100)}%. Szacowany koszt zapobieganych błędów: ${Math.round(value / 1000)}k PLN/rok.`,
  },
  leader: {
    title: "Milczenie liderów",
    what: "Liderzy też milczą, i to kosztuje najwięcej. Jeden anonimizowany epizod milczenia lidera w raporcie Fundacji Nowe Przestrzenie 2026 wyceniono na 400 000 – 800 000 PLN przez samego respondenta-członka zarządu (n=1, użycie ilustracyjne).",
    mechanism: "Liderzy mają większy kontekst i widzą problemy strategiczne. Gdy milczą z powodu braku BP (np. w relacji z zarządem), konsekwencje dotykają całej organizacji. Decyzje zapadają bez wiedzy o realnym problemie.",
    example: "'Uświadomiłem sobie, że to ja nie poczułem się bezpiecznie i milczałem. Zrobiłem twardy rachunek: to jedno milczenie kosztowało naszą firmę 400 000 – 800 000 złotych.' (cytat z raportu Fundacji Nowe Przestrzenie 2026, anonimizowany w UI; pełna atrybucja zachowana w akademickiej części aplikacji).",
    tceConnection: "Lider, który milczy wobec zarządu, blokuje strategiczne informacje na drodze w górę. Jedna zablokowana decyzja może kosztować firmę setki tysięcy złotych.",
    interpret: (params, value) => `Twoja firma ma ${params.leaders} liderów. Przy safety ${params.safety} szacujemy ${(params.leaders * getMetricValue("destructiveFear", params.safety, K_SIGMOID_DEFAULT_MULT) * LEADER_SILENCE_FREQ_MULT).toFixed(1)} epizodów milczenia/rok. Koszt: ${Math.round(value / 1000)}k PLN/rok.`,
  },
  compliance: {
    title: "Ślepota proceduralna",
    what: "Znajomość procedur: 39% w niskim BP vs 79% w wysokim. Ludzie, którzy nie czują się bezpiecznie, nie pytają o procedury, boją się, że wyjdą na niekompetentnych. Efekt: łamią zasady nieświadomie.",
    mechanism: "Compliance wymaga, żeby ludzie znali zasady i je stosowali. Gdy BP jest niskie, ludzie nie pytają o procedury, nie zgłaszają naruszeń, nie uczestniczą aktywnie w szkoleniach. To tworzy ryzyko regulacyjne i finansowe.",
    example: "Pracownik nie wie, jak prawidłowo archiwizować dane klientów. W wysokim BP pyta. W niskim, robi 'na oko', ryzykując karę RODO, utratę danych lub skargę klienta.",
    tceConnection: "Procedury działają tylko gdy ludzie o nie pytają i je stosują. Przy niskim BP nikt nie pyta, bo boi się wyjść na niekompetentnego. Efekt: łamanie zasad nie ze złej woli, ale z lęku.",
    interpret: (params, value) => `Przy przychodzie ${Math.round(params.revenue / 1e6)}M PLN i safety ${params.safety}, ryzyko compliance szacujemy na ${Math.round(value / 1000)}k PLN/rok. To ${(value / params.revenue * 100).toFixed(3)}% przychodu zagrożonego przez nieznajomość procedur.`,
  },
  hierarchy: {
    title: "Straty informacyjne hierarchii",
    what: "Williamson (1967): Effective Control = alpha^n. Każda warstwa zarządzania filtruje informacje przechodzące w górę. Przy 5 warstwach i niskim BP, tylko 5% krytycznych informacji dociera do decydentów. Złe wieści są filtrowane agresywniej niż dobre (MUM effect, Rosen & Tesser 1970).",
    mechanism: "Informacja musi pokonać kolejne 'bramy' (menedżerów). Na każdej bramie część informacji jest filtrowana, świadomie (strach przed reakcją) lub nieświadomie (uproszczenie, priorytetyzacja). Niskie BP drastycznie obniża 'alpha' (fidelity rate) na każdej bramie, a efekt kumuluje się wykładniczo.",
    example: "Pracownik liniowy widzi ryzyko jakościowe. Mówi kierownikowi zmiany. Kierownik ocenia, że 'to nie tak poważne' i nie eskaluje. Informacja ginie na 2. z 5 warstw. Decyzja strategiczna zapada w ślepym punkcie.",
    tceConnection: "Każda warstwa zarządzania to filtr, część informacji ginie po drodze. Przy 5 warstwach i niskim BP tylko 5% złych wiadomości dociera na górę. Zarząd podejmuje decyzje na podstawie obrazu 3-6x bardziej optymistycznego niż rzeczywistość.",
    interpret: (params, value) => `Twoja firma ma ${params.hierarchyLevels || 5} warstw zarządzania. Przy safety ${params.safety} alpha = ${alphaFromSafety(params.safety).toFixed(2)} na warstwę. Koszt decyzji podejmowanych bez pełnej informacji: ${Math.round(value / 1000)}k PLN/rok.`,
  },
  governance: {
    title: "Narzut governance (TCE)",
    what: "Williamson (1975, 1996): Duże organizacje z wieloma warstwami ponoszą 'podatek biurokratyczny', koszty koordynacji, monitoringu i administracji, które rosną z rozmiarem i głębokością hierarchii. Wysokie BP pozwala zastąpić kosztowny monitoring zaufaniem.",
    mechanism: "Selective intervention puzzle (Williamson): duża firma nie może po prostu replikować efektywności małej, bo hierarchia automatycznie osłabia motywacje i wymaga zastąpienia ich kosztownymi systemami kontroli. Ale wysoki poziom BP częściowo to kompensuje, zaufanie redukuje potrzebę formalnego nadzoru.",
    example: "Firma 50-osobowa: menedżer zna wszystkich, widzi problemy bezpośrednio. Firma 2000-osobowa: potrzebuje systemu raportowania, audytu, compliance, HR, to wszystko 'governance overhead'. Przy niskim BP overhead rośnie jeszcze bardziej, bo ludzie nie komunikują problemów dobrowolnie.",
    tceConnection: "Im większa firma, tym więcej koordynacji, raportowania i kontroli. Wysokie BP pozwala zastąpić część tego nadzoru zaufaniem, ludzie sami zgłaszają problemy. Niskie BP = droższy overhead.",
    interpret: (params, value) => `Governance penalty dla Twojej firmy (${params.employees} osób, ${params.hierarchyLevels || 5} warstw): ${value > 0 ? Math.round(value / 1000) + 'k PLN/rok narzutu ponad baseline małej firmy' : 'minimalny, wysoki safety kompensuje'}. Podniesienie BP pozwala zastąpić monitoring zaufaniem.`,
  },
  learningDeficit: {
    title: "Deficyt uczenia organizacyjnego",
    what: "Zdecydowana mniejszość organizacji z niskim BP faktycznie praktykuje double-loop learning (Argyris 1977), kwestionowanie założeń systemowych, a nie tylko korekcja bieżących błędów.",
    mechanism: "Milczenie blokuje kwestionowanie status quo. Single-loop learning = powtarzanie tych samych błędów. Double-loop wymaga otwartej dyskusji o założeniach, co jest niemożliwe bez bezpieczeństwa psychologicznego.",
    example: "Firma produkcyjna wdraża 'lean' ale nikt nie kwestionuje błędnych KPI, bo to 'pomysł zarządu'. Efekt: pozorne usprawnienia, rzeczywista stagnacja.",
    tceConnection: "Organizacja powtarza te same błędy, bo nikt nie kwestionuje założeń. Single-loop = poprawiamy wykonanie. Double-loop = pytamy 'czy robimy właściwą rzecz?'. Bez BP nie ma double-loop.",
  },
  knowledgeLoss: {
    title: "Blokada spirali wiedzy (Nonaka)",
    what: "Model przyjmuje autorski prior do 40% blokady transferu wiedzy przy niskim BP. Nonaka i Takeuchi (1995) uzasadniają mechanizm SECI, ale nie tę wartość liczbową.",
    mechanism: "Nonaka & Takeuchi (1995): Spirala SECI (Socjalizacja → Eksternalizacja → Kombinacja → Internalizacja) wymaga zaufania na etapie S i E. Milczenie blokuje socjalizację (obserwacja, mentoring) i eksternalizację (artykułowanie wiedzy ukrytej).",
    example: "Doświadczony inżynier odchodzi na emeryturę. Nikt nie nauczył się jego metod diagnostycznych, bo 'nie było czasu' (w rzeczywistości: nie było bezpieczeństwa żeby pytać).",
    tceConnection: "Wiedza praktyczna (jak naprawić maszynę, jak obsłużyć trudnego klienta) żyje w głowach ludzi. Gdy milczą, ta wiedza nie przepływa, odchodzą z nią na emeryturę lub do konkurencji. Firma zaczyna od zera.",
  },
  agencyOverhead: {
    title: "Koszty agencji (monitoring + bonding)",
    what: "Model przyjmuje autorski prior kosztu monitoringu sięgający 8% funduszu płac przy niskim BP. Jensen i Meckling (1976) uzasadniają mechanizm principal-agent, ale nie tę wartość liczbową.",
    mechanism: "Jensen & Meckling (1976): Problem principal-agent, gdy agent (pracownik) ma informację, a principal (zarząd) nie, rodzi się moral hazard. Niskie BP amplifikuje asymetrię informacji → rosną koszty monitoringu (nadzór, audyty, raporty) i bondingu (sygnalizowanie lojalności).",
    example: "Firma wdraża system GPS w samochodach służbowych, kamery w biurze, keyloggery, bo 'nie ufamy pracownikom'. Koszt: 200k PLN/rok + utrata morale.",
    tceConnection: "Gdy firma nie ufa pracownikom, musi ich kontrolować: audyty, raporty, systemy nadzoru. To kosztuje. Wysokie BP pozwala zredukować monitoring, ludzie sami zgłaszają problemy, bo czują się bezpiecznie.",
  },
};

// ═══════════════════════════════════════════════════════════════
// 10 WSKAZÓWEK REDUKCJI PODATKU OD MILCZENIA
// Priorytetyzowane od najwyższego ROI
// ═══════════════════════════════════════════════════════════════
export const REDUCTION_TIPS = [
  {
    num: 1,
    title: "Zacznij od liderów, modeluj otwarte przyznawanie się do błędów",
    desc: "Lider, który publicznie mówi 'pomyliłem się, czego się nauczyłem?' zmienia kulturę szybciej niż każdy program szkoleniowy. Ludzie naśladują zachowania osób o wyższym statusie.",
    source: "Edmondson (1999), case z raportu Fundacji Nowe Przestrzenie 2026 (anonimizowany)",
    impact: "high",
    modules: ["leader", "errors", "help"],
  },
  {
    num: 2,
    title: "Wprowadź blameless postmortems, analiza błędów bez obwiniania",
    desc: "Po każdym incydencie: 'co się stało i dlaczego?' zamiast 'kto zawinił?'. Dokumentuj wnioski, nie winnych. Google, Etsy i Netflix stosują to systemowo.",
    source: "Edmondson (1999), Adamska (2016) milczenie taktyczne",
    impact: "high",
    modules: ["errors", "compliance", "passivity"],
  },
  {
    num: 3,
    title: "Spłaszcz hierarchię tam, gdzie to możliwe",
    desc: "Każda warstwa zarządzania filtruje 40-50% złych wiadomości. Zredukowanie z 6 do 4 warstw podwaja ilość informacji dochodzących do decydentów. Rozważ szerszy span of control i empowerment zespołów.",
    source: "Williamson (1967), Nichols (1962), Likert (1961)",
    impact: "high",
    modules: ["hierarchy", "governance", "innovation"],
  },
  {
    num: 4,
    title: "Stwórz bezpieczne kanały zgłaszania (skip-level meetings, anonimowe ankiety)",
    desc: "Ludzie potrzebują alternatywnych dróg dotarcia z informacją. Skip-level 1:1, anonimowe pulse surveys co 2 tygodnie, 'office hours' z zarządem, każdy kanał omija warstwy filtrowania.",
    source: "Detert & Edmondson (2011), Morrison (2023)",
    impact: "high",
    modules: ["hierarchy", "leader", "passivity"],
  },
  {
    num: 5,
    title: "Nagradzaj zgłaszanie problemów, nie tylko sukces",
    desc: "Publicznie doceniaj osoby, które zgłaszają błędy, ryzyka i obawy, nawet jeśli się mylą. 'Dziękuję, że to podniosłeś' zmienia percepcję z 'donosicielstwo' na 'odpowiedzialność'.",
    source: "Raport Ipsos 2026 (35% usprawnienie = donos)",
    impact: "medium",
    modules: ["passivity", "errors", "help"],
  },
  {
    num: 6,
    title: "Mierz bezpieczeństwo psychologiczne regularnie i reaguj",
    desc: "Kwestionariusz Edmondson (7 skał), badanie co kwartał, wyniki na poziomie zespołu (nie jednostki). Ważne: publikuj wyniki i plan działania. Samo badanie bez follow-up pogarsza sytuację.",
    source: "Edmondson (1999), Fundacja Nowe Przestrzenie",
    impact: "medium",
    modules: ["burnout", "passivity", "compliance"],
  },
  {
    num: 7,
    title: "Szkol liderów w active listening i zadawaniu pytań",
    desc: "Zamiast 'czy są pytania?' (nikt nie odpowie) pytaj 'co może pójść nie tak w tym planie?' lub 'czego nie wiemy?'. Pytania otwierające > pytania zamykające. Cisza po pytaniu: czekaj 10 sekund.",
    source: "Edmondson (1999), Edmondson & Bransby (2023)",
    impact: "medium",
    modules: ["leader", "innovation", "help"],
  },
  {
    num: 8,
    title: "Buduj cross-functional zespoły, przełam silosy i wzmocnij autonomię",
    desc: "Bierność ('nie moja sprawa') kwitnie w silosach. Zespoły mieszane (ops + dev + biznes) naturalnie wymuszają dzielenie się informacją. Rotacja między działami pomaga. Badania pokazują, że większa autonomia pracowników redukuje milczenie (Adamska 2015). Uwaga: przełamanie milczenia nie zawsze daje głos konstruktywny, może też dać głos destrukcyjny (Maynes & Podsakoff 2014). Interwencja musi łączyć otwarcie kanałów z budowaniem kultury konstruktywnego feedbacku.",
    source: "Morrison & Milliken (2000), Adamska (2015), Maynes & Podsakoff (2014)",
    impact: "medium",
    modules: ["passivity", "innovation", "governance"],
  },
  {
    num: 9,
    title: "Zmień narrację o błędach, z 'porażka' na 'dane'",
    desc: "Język ma znaczenie. 'Experiment failed' → 'experiment returned data'. 'Kto zawinił?' → 'co możemy zmienić w procesie?'. Zmiana języka zmienia kulturę szybciej niż zmiana procedur.",
    source: "Edmondson (1999), Sherf, Parke, Isaakyan (2021)",
    impact: "medium",
    modules: ["errors", "burnout", "help"],
  },
  {
    num: 10,
    title: "Monitoruj 'bazę piramidy', sygnały słabe to system wczesnego ostrzegania",
    desc: "Piramida Birda: na 1 katastrofę przypada 600 drobnych sygnałów. Jeśli nie widzisz drobnych problemów, nie znaczy, że ich nie ma. Znaczy, że ludzie milczą. Brak zgłoszeń = alarm, nie sukces.",
    source: "Bird (1974) Management Guide to Loss Control, Institute Press (badanie ICA z 1969)",
    impact: "high",
    modules: ["errors", "compliance", "passivity"],
  },
];

export const METRIC_DESCRIPTIONS = {
  blameRate: {
    title: "Kultura obwiniania",
    what: "Odsetek pracowników, których błędy są wykorzystywane przeciwko nim. W zespołach o niskim BP: 72%, w wysokim: zaledwie 2%.",
    impact: "Gdy błędy są karane, ludzie uczą się je ukrywać. To nie eliminuje błędów, tylko sprawia, że są niewidoczne do momentu, gdy staną się bardzo kosztowne.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Twoja firma (${(yours * 100).toFixed(1)}%) jest POWYŻEJ średniej PL (${(pl * 100).toFixed(1)}%), kultura obwiniania jest silniejsza niż przeciętnie. To wymaga pilnej interwencji.`
      : `Twoja firma (${(yours * 100).toFixed(1)}%) jest poniżej średniej PL (${(pl * 100).toFixed(1)}%), kultura obwiniania jest słabsza niż przeciętnie. Dobry wynik, ale każdy procent ma znaczenie.`,
  },
  errorFear: {
    title: "Ukrywanie błędów",
    what: "Odsetek pracowników, którzy ukrywają błędy ze strachu przed konsekwencjami. 72% w niskim BP, 5% w wysokim.",
    impact: "Ukryte błędy kumulują się i eskalują. Jeden mały błąd ukryty dziś = duży kryzys za miesiąc. Koszt naprawy rośnie wykładniczo z czasem.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Twoja firma (${(yours * 100).toFixed(1)}%) ukrywa więcej błędów niż średnia PL (${(pl * 100).toFixed(1)}%). To jeden z najkosztowniejszych wskaźników, każdy ukryty błąd to potencjalna bomba zegarowa.`
      : `Twoja firma (${(yours * 100).toFixed(1)}%) ukrywa mniej błędów niż średnia PL (${(pl * 100).toFixed(1)}%). Dobrze, ale cel to zejście poniżej 10%.`,
  },
  teamStability: {
    title: "Stabilność zespołu",
    what: "Odsetek pracowników, którzy zostają w firmie. 59% w niskim BP vs 85% w wysokim. Wysoka wartość = mniej rotacji, mniej kosztów rekrutacji.",
    impact: "Każde odejście to koszt 6-9 miesięcy pensji. Ale prawdziwy koszt to utrata wiedzy, relacji z klientami i morale zespołu. Najlepsi odchodzą pierwsi.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Twoja stabilność (${(yours * 100).toFixed(1)}%) jest wyższa niż średnia PL (${(pl * 100).toFixed(1)}%). Zespoły są stabilne, to fundament efektywności.`
      : `Twoja stabilność (${(yours * 100).toFixed(1)}%) jest niższa niż średnia PL (${(pl * 100).toFixed(1)}%). Wysoka rotacja sygnalizuje problem z kulturą, ludzie 'głosują nogami".`,
  },
  helpComfort: {
    title: "Komfort proszenia o pomoc",
    what: "Odsetek pracowników, którzy czują się komfortowo prosząc o pomoc. 21% w niskim BP vs 99% w wysokim.",
    impact: "Brak komfortu = samotne zmaganie się z problemami, marnowanie czasu, zapobiegalne błędy. To też blokuje transfer wiedzy w organizacji.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Komfort proszenia o pomoc (${(yours * 100).toFixed(1)}%) powyżej średniej PL (${(pl * 100).toFixed(1)}%). Ludzie nie boją się przyznać do niewiedzy, to przyspiesza rozwiązywanie problemów.`
      : `Komfort proszenia o pomoc (${(yours * 100).toFixed(1)}%) poniżej średniej PL (${(pl * 100).toFixed(1)}%). Ludzie wolą tracić godziny niż poprosić kolegę o 5 minut pomocy.`,
  },
  burnoutRate: {
    title: "Wypalenie zawodowe",
    what: "Odsetek pracowników z objawami wypalenia. 51% w niskim BP vs 8% w wysokim. Wypalenie to nie lenistwo, to wyczerpanie systemu nerwowego.",
    impact: "Wypalony pracownik traci ~25% produktywności, częściej choruje, popełnia więcej błędów i obniża morale całego zespołu. To efekt domina.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Wskaźnik wypalenia (${(yours * 100).toFixed(1)}%) powyżej średniej PL (${(pl * 100).toFixed(1)}%). Co ${Math.round(100 / (yours * 100))} pracownik jest wypalony, to alarm.`
      : `Wskaźnik wypalenia (${(yours * 100).toFixed(1)}%) poniżej średniej PL (${(pl * 100).toFixed(1)}%). Dobra baza, ale cel to utrzymanie poniżej 15%.`,
  },
  ideaSilence: {
    title: "Milczenie z pomysłami",
    what: "Odsetek pracowników, którzy nie dzielą się pomysłami. 52% w niskim BP vs 10% w wysokim.",
    impact: "Każdy niewypowiedziany pomysł to stracona szansa. Pracownicy na pierwszej linii widzą rzeczy niewidoczne z poziomu zarządu, ale milczą.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Milczenie z pomysłami (${(yours * 100).toFixed(1)}%) powyżej średniej PL (${(pl * 100).toFixed(1)}%). Ponad połowa Twoich ludzi ma pomysły, ale je trzyma dla siebie.`
      : `Milczenie z pomysłami (${(yours * 100).toFixed(1)}%) poniżej średniej PL (${(pl * 100).toFixed(1)}%). Pomysły płyną, to napędza innowację.`,
  },
  passivity: {
    title: "Bierność ('nie wtrącam się')",
    what: "Odsetek pracowników z postawą 'to nie moja sprawa'. 59% w niskim BP vs 8% w wysokim.",
    impact: "Bierność to wyuczona bezradność. Ludzie widzą problemy, zepsuty proces, niezadowolonego klienta, marnotrawstwo, ale milczą, bo 'po co się wychylać'.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Bierność (${(yours * 100).toFixed(1)}%) powyżej średniej PL (${(pl * 100).toFixed(1)}%). Większość ludzi przechodzi obok problemów, to kosztuje tysiące mikro-strat dziennie.`
      : `Bierność (${(yours * 100).toFixed(1)}%) poniżej średniej PL (${(pl * 100).toFixed(1)}%). Ludzie angażują się poza swoim zakresem, to cecha najlepszych organizacji.`,
  },
  riskAversion: {
    title: "Unikanie ryzyka",
    what: "Odsetek pracowników unikających ryzyka. 70% w niskim BP vs 15% w wysokim. Bez ryzyka nie ma innowacji.",
    impact: "Unikanie ryzyka = status quo. Firma, w której nikt nie eksperymentuje, powoli traci konkurencyjność. Rynek nagradza odwagę, nie ostrożność.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Unikanie ryzyka (${(yours * 100).toFixed(1)}%) powyżej średniej PL (${(pl * 100).toFixed(1)}%). Ludzie grają bezpiecznie, firma stoi w miejscu.`
      : `Unikanie ryzyka (${(yours * 100).toFixed(1)}%) poniżej średniej PL (${(pl * 100).toFixed(1)}%). Ludzie próbują nowych rzeczy, to motor wzrostu.`,
  },
  procedureUse: {
    title: "Znajomość procedur",
    what: "Odsetek pracowników znających procedury. 39% w niskim BP vs 79% w wysokim. Wysoka wartość = mniej ryzyka compliance.",
    impact: "Gdy ludzie nie znają procedur, łamią je nieświadomie. To ryzyko regulacyjne (kary, audyty), ale też operacyjne (błędy, wypadki, reklamacje).",
    interpret: (safety, yours, pl) => yours > pl
      ? `Znajomość procedur (${(yours * 100).toFixed(1)}%) powyżej średniej PL (${(pl * 100).toFixed(1)}%). Ludzie znają zasady i czują się bezpiecznie pytając o nie.`
      : `Znajomość procedur (${(yours * 100).toFixed(1)}%) poniżej średniej PL (${(pl * 100).toFixed(1)}%). Ludzie boją się pytać o procedury, ryzyko compliance rośnie.`,
  },
  snitchPerc: {
    title: "Usprawnienie = donosicielstwo",
    what: "Odsetek pracowników postrzegających zgłaszanie usprawnień jako donoszenie. 55% w niskim BP vs 10% w wysokim.",
    impact: "Gdy zgłaszanie problemów = bycie kapusiem, nikt nie zgłasza. Problemy narastają, procesy się degradują, a kultura milczenia się utrwala.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Efekt donosicielstwa (${(yours * 100).toFixed(1)}%) powyżej średniej PL (${(pl * 100).toFixed(1)}%). Ludzie boją się zgłaszać problemy, bo zostaną uznani za donosicieli.`
      : `Efekt donosicielstwa (${(yours * 100).toFixed(1)}%) poniżej średniej PL (${(pl * 100).toFixed(1)}%). Zgłaszanie problemów jest postrzegane pozytywnie, tak powinno być.`,
  },
  workJoy: {
    title: "Pracuje się wspaniale",
    what: "Odsetek pracowników deklarujących satysfakcję z pracy. 19% w niskim BP vs 70% w wysokim.",
    impact: "Zadowoleni pracownicy są bardziej produktywni, kreatywni i lojalni. To nie 'miękki' wskaźnik, to bezpośredni driver wyników biznesowych.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Satysfakcja (${(yours * 100).toFixed(1)}%) powyżej średniej PL (${(pl * 100).toFixed(1)}%). Ludzie lubią tu pracować, to magnes na talenty i fundament retencji.`
      : `Satysfakcja (${(yours * 100).toFixed(1)}%) poniżej średniej PL (${(pl * 100).toFixed(1)}%). Mało kto lubi tu pracować, to sygnał ostrzegawczy.`,
  },
  destructiveFear: {
    title: "Destrukcyjny lęk",
    what: "Odsetek pracowników odczuwających destrukcyjny strach w pracy. 74% w niskim BP vs 19% w wysokim.",
    impact: "Destrukcyjny lęk paraliżuje. Ludzie nie myślą kreatywnie, nie podejmują decyzji, nie komunikują się otwarcie. Mózg w trybie przetrwania nie innowuje.",
    interpret: (safety, yours, pl) => yours > pl
      ? `Destrukcyjny lęk (${(yours * 100).toFixed(1)}%) powyżej średniej PL (${(pl * 100).toFixed(1)}%). Większość ludzi pracuje w trybie przetrwania, to zabija produktywność i innowację.`
      : `Destrukcyjny lęk (${(yours * 100).toFixed(1)}%) poniżej średniej PL (${(pl * 100).toFixed(1)}%). Ludzie czują się bezpiecznie, mogą skupić energię na pracy, nie na obronie.`,
  },
};
