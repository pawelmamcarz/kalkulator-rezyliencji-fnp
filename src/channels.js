export const CHANNEL_COPY = {
  continuity: {
    title: "Rotacja i utrata wiedzy",
    short: "Rekrutacja i wdrożenie osób na miejsce tych, które odchodzą.",
    image: "Pracownik odchodzi, a zespół potrzebuje czasu na przekazanie obowiązków.",
    body: "Do wyniku wliczamy szacowany dodatkowy koszt rekrutacji i wdrożenia nowych pracowników. Utrata wiedzy nie ma osobnej kwoty. Nie każde odejście wynika z klimatu pracy.",
  },
  operational: {
    title: "Błędy i compliance",
    short: "Problemy zgłaszane za późno, gdy ich naprawa kosztuje więcej.",
    image: "Problem zostaje zgłoszony dopiero wtedy, gdy trudniej go naprawić.",
    body: "Do wyniku wliczamy dodatkowy koszt późnego zgłoszenia błędów. Częstość zdarzeń i koszty ich naprawy są założeniami autora. Nie wyceniamy osobno kar za naruszenie przepisów.",
  },
  capacity: {
    title: "Wypalenie i pasywność",
    short: "Mniejsza zdolność do pracy w przeciążonych zespołach.",
    image: "Przeciążonym pracownikom brakuje sił na rozwiązywanie kolejnych problemów.",
    body: "Szacujemy koszt ograniczonej zdolności do pracy związanej z wypaleniem. Pasywności nie doliczamy osobno. Kalkulator nie diagnozuje zdrowia pracowników.",
  },
  contribution: {
    title: "Innowacje i uczenie się",
    image: "Usprawnienie nie trafia do dyskusji, a błąd powtarza się w kolejnym zespole.",
    body: "Organizacja nie uczy się na błędach, których nikt nie zgłasza, i nie wdraża usprawnień, których nikt nie proponuje.",
  },
  coordination: {
    title: "Koordynacja i hierarchia",
    image: "Raport pomija zastrzeżenia, które były znane osobom wykonującym pracę.",
    body: "Informacja gubi się po drodze do góry. Zarząd decyduje na podstawie wygładzonego obrazu.",
  },
};

export const CLIMATE_ANCHORS = [
  { at: 10, label: "Złe wieści nie wychodzą z zespołu" },
  { at: 35, label: "Mówi się ostrożnie i tylko zaufanym" },
  { at: 55, label: "Czasem ktoś podniesie temat" },
  { at: 75, label: "O problemach mówi się szefowi" },
  { at: 92, label: "O błędach mówi się bez strachu" },
];

export function climateAnchor(safety) {
  if (safety < 25) return CLIMATE_ANCHORS[0];
  if (safety < 45) return CLIMATE_ANCHORS[1];
  if (safety < 65) return CLIMATE_ANCHORS[2];
  if (safety < 85) return CLIMATE_ANCHORS[3];
  return CLIMATE_ANCHORS[4];
}

// The engine's channel aggregates are scope-aware: `base` is the in-headline
// amount and `excluded` the amount left out of the headline. `pending` is the
// excluded amount without analytics-only modules (hierarchy).
export function splitChannel(channel) {
  const components = channel.components || [];
  const pending = components
    .filter((c) => c.inHeadline === false && !c.analyticsOnly)
    .reduce((sum, c) => sum + c.value, 0);
  return { headline: channel.base, pending, components, inSum: Boolean(channel.inHeadline) };
}
