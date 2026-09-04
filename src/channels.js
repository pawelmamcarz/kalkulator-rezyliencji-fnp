export const CHANNEL_COPY = {
  continuity: {
    title: "Rotacja i utrata wiedzy",
    image: "Pracownik odchodzi, a zespół potrzebuje czasu na przekazanie obowiązków.",
    body: "W sumie jest scenariusz dodatkowego kosztu rotacji: zastąpienia i wdrożenia pracowników. Utrata wiedzy nie ma osobnej kwoty. Nie każde odejście wynika z klimatu pracy.",
  },
  operational: {
    title: "Błędy i compliance",
    image: "Problem zostaje zgłoszony dopiero wtedy, gdy trudniej go naprawić.",
    body: "W sumie jest dodatkowy koszt opóźnionej reakcji na błędy, według przyjętej częstości i kosztów zdarzeń. Ryzyko compliance opisujemy bez oddzielnej wyceny kar.",
  },
  capacity: {
    title: "Wypalenie i pasywność",
    image: "Praca wymaga coraz więcej wysiłku, a zespół ma mniej zasobów na reagowanie.",
    body: "W sumie jest scenariusz ograniczonej zdolności do pracy związanej z wypaleniem. Pasywność nie jest doliczana osobno. Kalkulator nie diagnozuje zdrowia pracowników.",
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

export function splitChannel(channel) {
  const components = channel.components || [];
  const headline = components
    .filter((c) => c.inHeadline)
    .reduce((sum, c) => sum + c.value, 0);
  const pending = components
    .filter((c) => !c.inHeadline && !c.analyticsOnly)
    .reduce((sum, c) => sum + c.value, 0);
  return { headline, pending, components, inSum: components.some((component) => component.inHeadline) };
}
