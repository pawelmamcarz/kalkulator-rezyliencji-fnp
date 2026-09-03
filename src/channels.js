export const CHANNEL_COPY = {
  continuity: {
    title: "Rotacja i utrata wiedzy",
    image: "Najdroższe exit interview to to, które nigdy się nie odbyło.",
    body: "Ludzie, którzy nie mogą mówić, odchodzą, a wiedza odchodzi z nimi. Koszt: rekrutacja, wdrożenie, luka kompetencyjna.",
  },
  operational: {
    title: "Błędy i compliance",
    image: "Każda katastrofa przemysłowa ma w raporcie zdanie „pracownicy wiedzieli wcześniej”.",
    body: "Problemy zgłaszane za późno albo wcale. Drobna usterka staje się reklamacją, karą albo kryzysem.",
  },
  capacity: {
    title: "Wypalenie i pasywność",
    image: "Pensja płacona w 100%, obecność w 60%.",
    body: "Milczenie to praca emocjonalna: tłumienie zdania kosztuje energię, która nie idzie w robotę.",
  },
  contribution: {
    title: "Innowacje i uczenie się",
    image: "Najdroższy pomysł w firmie to ten, który został w czyjejś głowie.",
    body: "Organizacja nie uczy się na błędach, których nikt nie zgłasza, i nie wdraża usprawnień, których nikt nie proponuje.",
  },
  coordination: {
    title: "Koordynacja i hierarchia",
    image: "Głuchy telefon, w którym każdy kolejny szczebel mówi „jest dobrze”.",
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
  return { headline, pending, components };
}
