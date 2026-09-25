#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_MODEL, callSystemOne, resolveApiKey } from "./jev-methodology-audit.lib.js";
import { aggregate, buildRequest, formatDetails, formatMarkdown, mapLimit, validateResponses } from "./jev-diagnoza.lib.js";

const HELP = `Użycie: npm run jev:diagnoza -- <plik.json> [--dry-run] [--json] [--szczegoly]

Plik: tablica [{ "team": "...", "text": "..." }] z anonimowymi odpowiedziami.
--dry-run  pokaż zapytanie dla pierwszej odpowiedzi, bez wywołania API
--json     wypisz zagregowane wyniki jako JSON
--szczegoly  dopisz ocenę Jev dla każdej odpowiedzi (zawiera treść, tylko dla analityka)
Klucz: TYPESAFE_API_KEY (tylko zmienna środowiskowa).`;

export async function main({
  argv = process.argv.slice(2),
  env = process.env,
  cwd = process.cwd(),
  stdout = process.stdout,
  stderr = process.stderr,
  fetchImpl,
} = {}) {
  const file = argv.find((a) => !a.startsWith("--"));
  if (!file || argv.includes("--help")) {
    stdout.write(`${HELP}\n`);
    return file ? 0 : 1;
  }
  const rows = JSON.parse(await readFile(path.resolve(cwd, file), "utf8"));
  const errors = validateResponses(rows);
  if (errors.length) {
    stderr.write(`${errors.join("\n")}\n`);
    return 1;
  }
  if (argv.includes("--dry-run")) {
    stdout.write(`${JSON.stringify(buildRequest(rows[0], DEFAULT_MODEL), null, 2)}\n`);
    stdout.write(`\n${rows.length} odpowiedzi, ${new Set(rows.map((r) => r.team)).size} zespołów. Bez wywołania API.\n`);
    return 0;
  }
  const apiKey = resolveApiKey(env);
  if (!apiKey) {
    stderr.write("Brak TYPESAFE_API_KEY. Użyj --dry-run, aby sprawdzić zapytanie.\n");
    return 1;
  }
  const answers = await mapLimit(rows, 4, async (row) => {
    const body = await callSystemOne({ apiKey, ...buildRequest(row, DEFAULT_MODEL), fetchImpl });
    return body.answers;
  });
  const teams = aggregate(rows, answers);
  stdout.write(argv.includes("--json") ? `${JSON.stringify(teams, null, 2)}\n` : `${formatMarkdown(teams)}\n`);
  if (argv.includes("--szczegoly")) stdout.write(`\n${formatDetails(rows, answers)}\n`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().then((code) => process.exit(code), (error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
}
