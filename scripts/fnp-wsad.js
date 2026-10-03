#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  COMPARE_DISCLAIMER, DEFAULT_MIN_N, STATUS_OK, compareResults, computeRow, formatComparison,
  formatRows, parseArgs, sha256, validateRows,
} from "./fnp-wsad.lib.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const HELP = `Użycie: npm run fnp:wsad -- <plik.csv> [--skala procent|likert7|likert5] [--min-n ${DEFAULT_MIN_N}] [--out wynik.csv] [--porownaj]

Liczy scenariusz skali publicznego modelu FNP dla każdej firmy i pomiaru.
Kolumny: firma, klimat, n, fte, placa_roczna (wymagane); pomiar, rotacja_proc, przychod (opcjonalne).
--skala     skala kolumny klimat (domyślnie procent 0–100; likert7 1–7; likert5 1–5)
--min-n     minimalna liczba ważnych odpowiedzi na firmę (domyślnie ${DEFAULT_MIN_N}); poniżej progu kwoty zostają puste
--out       zapisz CSV do pliku i skrót do <plik>.sha256; bez tej opcji CSV idzie na stdout
--porownaj  zestaw dwa pomiary tej samej firmy (wymaga kolumny pomiar)
Wynik to scenariusz skali, nie wycena księgowa ani dowód efektu programu.`;

export async function main({
  argv = process.argv.slice(2),
  cwd = process.cwd(),
  stdout = process.stdout,
  stderr = process.stderr,
  versionFile = path.join(REPO_ROOT, ".version"),
} = {}) {
  const { opts, errors: argErrors } = parseArgs(argv);
  if (opts.help) {
    stdout.write(`${HELP}\n`);
    return 0;
  }
  if (argErrors.length || !opts.file) {
    stderr.write(`${[...argErrors, ...(opts.file ? [] : ["Podaj plik CSV."])].join("\n")}\n\n${HELP}\n`);
    return 1;
  }
  const version = (await readFile(versionFile, "utf8")).trim();
  if (!version) {
    stderr.write("Plik .version jest pusty.\n");
    return 1;
  }
  const text = await readFile(path.resolve(cwd, opts.file), "utf8");
  const { rows, errors, ignored } = validateRows(text, { skala: opts.skala, porownaj: opts.porownaj });
  if (ignored.length) stderr.write(`Pominięte nieznane kolumny: ${ignored.join(", ")}.\n`);
  if (errors.length) {
    stderr.write(`Błędy w danych (${errors.length}). Nic nie zapisano.\n${errors.join("\n")}\n`);
    return 1;
  }

  const results = rows.map((row) => computeRow(row, { minN: opts.minN }));
  let csv;
  const summary = [];
  if (opts.porownaj) {
    const { pairs, skipped, notes } = compareResults(results);
    csv = formatComparison(pairs, version);
    summary.push(`Porównano firm: ${pairs.length}. Pominięto: ${skipped.length}.`);
    for (const s of skipped) summary.push(`  pominięta ${s.firma}: ${s.reason}`);
    for (const n of notes) summary.push(`  uwaga ${n.firma}: między pomiarami zmieniły się też dane wejściowe (${n.changed.join(", ")})`);
    summary.push(COMPARE_DISCLAIMER);
  } else {
    csv = formatRows(results, version);
    const below = results.filter((r) => r.status !== STATUS_OK).length;
    summary.push(`Wierszy: ${results.length}, policzonych: ${results.length - below}, poniżej progu n=${opts.minN}: ${below}.`);
    summary.push("Kwoty to scenariusz skali modelu FNP (obszary: błędy, rotacja, wypalenie), nie wycena księgowa. Granice p10–p90 to granice scenariusza, nie przedziały ufności.");
  }
  summary.push(`Skala: ${opts.skala}. Model: ${version}.`);

  const hash = sha256(csv);
  if (opts.out) {
    const outPath = path.resolve(cwd, opts.out);
    await writeFile(outPath, csv, "utf8");
    await writeFile(`${outPath}.sha256`, `${hash}  ${path.basename(outPath)}\n`, "utf8");
    summary.push(`Zapisano: ${opts.out} oraz ${opts.out}.sha256`);
  } else {
    stdout.write(csv);
  }
  summary.push(`SHA-256: ${hash}`);
  stderr.write(`${summary.join("\n")}\n`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().then((code) => process.exit(code), (error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
}
