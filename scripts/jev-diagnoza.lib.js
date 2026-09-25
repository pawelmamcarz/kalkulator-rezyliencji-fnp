import { choice, noul, score, toApiQuestions } from "./jev-methodology-audit.lib.js";

// Prototype: Jev reads anonymous open answers from an FNP diagnosis survey.
// Output is a map of reported silence per team, not a measurement of
// psychological safety and not a money estimate. Offline only.

export const MIN_TEAM_SIZE = 5;

export const AREAS = {
  rotacja: "Rotacja i utrata wiedzy: odejścia, chęć odejścia, znikająca wiedza.",
  bledy: "Błędy i compliance: niezgłaszane błędy, ryzyka, naruszenia procedur.",
  wypalenie: "Wypalenie i pasywność: zmęczenie, rezygnacja, robienie minimum.",
  innowacje: "Innowacje i uczenie się: niezgłaszane pomysły, brak eksperymentów.",
  koordynacja: "Koordynacja i hierarchia: informacja nie płynie między działami lub w górę do przełożonych; brak okazji, by zgłosić sprawę; do kierownictwa docierają tylko dobre wiadomości.",
  brak: "Wypowiedź nie opisuje żadnego z tych obszarów.",
};

export const CAUSES = {
  lek: "Autor nie zabiera głosu z obawy przed konsekwencjami: oceną, karą, ośmieszeniem, utratą pracy.",
  bezsens: "Autor nie zabiera głosu, bo uważa, że to nic nie zmieni, nikt nie słucha albo nie warto się wychylać; także rezygnacja i robienie tylko swojego.",
  brak_kanalu: "Autor nie ma gdzie, kiedy ani komu zgłosić sprawy albo zgłaszanie jest zbyt pracochłonne (brak kanału, czasu, spotkania, uciążliwa procedura).",
  lojalnosc: "Autor milczy, żeby uchronić przed konsekwencjami konkretne inne osoby: kolegę, zespół, zmianę, przełożonego; także wzajemne krycie się w zespole. Nie chodzi o ochronę wyłącznie samego siebie.",
};

const COMMENT = "`odpowiedz` to anonimowa odpowiedź pracownika na pytanie otwarte w ankiecie diagnozy klimatu pracy.";

export const questions = {
  milczenie: noul(`${COMMENT} Czy wypowiedź opisuje, że ważne problemy, błędy, pomysły lub zastrzeżenia nie są zgłaszane: autor lub zespół się wstrzymuje, nie ma okazji ich zgłosić albo do przełożonych docierają tylko wybrane informacje? Nie licz sytuacji, w której problem jest otwarcie zgłaszany, nawet jeśli nie zostaje rozwiązany.`),
  obszar: choice(`${COMMENT} Którego obszaru organizacji dotyczy głównie ta wypowiedź?`, AREAS),
  ...Object.fromEntries(Object.entries(CAUSES).map(([id, text]) => [
    `przyczyna_${id}`,
    noul(`${COMMENT} Czy wypowiedź wskazuje na taką przyczynę milczenia: ${text}`),
  ])),
  nasilenie: score(`${COMMENT} Jak poważny problem z zabieraniem głosu opisuje autor?`, [
    "Brak problemu: autor mówi otwarcie albo opisuje dobrą praktykę.",
    "Sporadycznie: autor czasem się wstrzymuje, w drobnych sprawach.",
    "Często: autor regularnie przemilcza istotne sprawy.",
    "Trwale: w zespole utrwaliła się zasada, że się nie mówi, także o poważnych ryzykach.",
  ]),
};

export function buildRequest(response, model) {
  return { model, state: { odpowiedz: response.text }, questions: toApiQuestions(questions) };
}

export function validateResponses(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return ["Plik musi zawierać niepustą tablicę odpowiedzi."];
  return rows.flatMap((row, i) => (
    row && typeof row.team === "string" && typeof row.text === "string" && row.text.trim()
      ? []
      : [`Wiersz ${i + 1}: wymagane pola team i text.`]
  ));
}

const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;

// Code owns aggregation and policy; Jev supplies per-answer judgments only.
export function aggregate(rows, answers, { minTeamSize = MIN_TEAM_SIZE, silenceThreshold = 0.5, causeThreshold = 0.5 } = {}) {
  const byTeam = new Map();
  rows.forEach((row, i) => {
    if (!byTeam.has(row.team)) byTeam.set(row.team, []);
    byTeam.get(row.team).push(answers[i]);
  });
  return [...byTeam.entries()].map(([team, list]) => {
    if (list.length < minTeamSize) return { team, n: list.length, suppressed: true };
    const silent = list.filter((a) => a.milczenie.noul >= silenceThreshold);
    const areas = Object.fromEntries(Object.keys(AREAS).map((id) => [id, 0]));
    silent.forEach((a) => { areas[a.obszar.choice] = (areas[a.obszar.choice] || 0) + 1; });
    const causes = Object.fromEntries(Object.keys(CAUSES).map((id) => [
      id, silent.filter((a) => a[`przyczyna_${id}`].noul >= causeThreshold).length,
    ]));
    return {
      team,
      n: list.length,
      suppressed: false,
      silent: silent.length,
      silenceShare: silent.length / list.length,
      severity: mean(list.map((a) => a.nasilenie.score)),
      areas,
      causes,
      lowConfidence: list.filter((a) => (a.obszar.confidence ?? 1) < 0.5).length,
    };
  });
}

const pct = (x) => `${Math.round(100 * x)}%`;

export function formatMarkdown(teams, { minTeamSize = MIN_TEAM_SIZE } = {}) {
  const causeIds = Object.keys(CAUSES);
  const lines = [
    "# Mapa milczenia: prototyp",
    "",
    "Odczyt odpowiedzi otwartych przez Jev. To sygnał do rozmowy w diagnozie, nie pomiar bezpieczeństwa psychologicznego ani wycena kosztów.",
    "",
    `| Zespół | n | Milczy | Nasilenie 0–3 | Główny obszar | ${causeIds.join(" | ")} |`,
    `|---|---|---|---|---|${causeIds.map(() => "---").join("|")}|`,
  ];
  for (const t of teams) {
    if (t.suppressed) {
      lines.push(`| ${t.team} | ${t.n} | ukryte (n < ${minTeamSize}) | | | ${causeIds.map(() => "").join(" | ")} |`);
      continue;
    }
    const top = Object.entries(t.areas).filter(([id]) => id !== "brak").sort((a, b) => b[1] - a[1])[0];
    const area = top && top[1] > 0 ? `${top[0]} (${top[1]})` : "brak";
    lines.push(`| ${t.team} | ${t.n} | ${pct(t.silenceShare)} | ${t.severity.toFixed(1)} | ${area} | ${causeIds.map((id) => `${t.causes[id]}/${t.silent}`).join(" | ")} |`);
  }
  lines.push("", "Przyczyny: liczba odpowiedzi opisujących milczenie, w których Jev wskazał daną przyczynę (prawdopodobieństwo ≥ 0,5). Jedna odpowiedź może mieć kilka przyczyn. Zespoły poniżej progu liczebności są ukryte dla anonimowości.");
  return lines.join("\n");
}

export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

const num = (x) => x.toFixed(2).replace(".", ",");

// Per-answer view for the analyst checking Jev against human reading.
// Contains raw answer text, so it must not leave the diagnosis team.
export function formatDetails(rows, answers) {
  const causeIds = Object.keys(CAUSES);
  const lines = [
    "## Odpowiedzi pojedynczo (tylko dla analityka, zawiera treść odpowiedzi)",
    "",
    `| Zespół | Odpowiedź | Milczy | Obszar (pewność) | ${causeIds.join(" | ")} | Nasilenie |`,
    `|---|---|---|---|${causeIds.map(() => "---").join("|")}|---|`,
  ];
  rows.forEach((row, i) => {
    const a = answers[i];
    const text = row.text.length > 70 ? `${row.text.slice(0, 69)}…` : row.text;
    const conf = a.obszar.confidence == null ? "" : ` (${num(a.obszar.confidence)})`;
    lines.push(`| ${row.team} | ${text.replaceAll("|", "/")} | ${num(a.milczenie.noul)} | ${a.obszar.choice}${conf} | ${causeIds.map((id) => num(a[`przyczyna_${id}`].noul)).join(" | ")} | ${num(a.nasilenie.score)} |`);
  });
  return lines.join("\n");
}
