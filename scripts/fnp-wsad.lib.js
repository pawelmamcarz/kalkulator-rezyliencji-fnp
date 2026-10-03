import { createHash } from "node:crypto";
import { computeFnpAnalysis } from "../src/fnpModel.js";
import { INPUT_FIELDS } from "../src/inputs.js";

// Batch run of the public FNP model for a validation study: one row per firm
// and measurement. Output is a scenario of scale per firm, not a valuation,
// forecast or programme effect. Offline only, never in the public bundle.
// Formulas and constants stay in src/; this file only parses, validates and
// formats. Missing inputs are never filled in here; the model itself treats
// a blank turnover as the 14.8% reference (see computeRow).

export const DEFAULT_MIN_N = 15;

// Raw score range per scale and its mapping to the 0–100 climate slider.
export const SCALES = {
  procent: { min: 0, max: 100, toPercent: (x) => x },
  likert7: { min: 1, max: 7, toPercent: (x) => ((x - 1) / 6) * 100 },
  likert5: { min: 1, max: 5, toPercent: (x) => ((x - 1) / 4) * 100 },
};

export const REQUIRED_COLUMNS = ["firma", "klimat", "n", "fte", "placa_roczna"];
export const OPTIONAL_COLUMNS = ["pomiar", "rotacja_proc", "przychod"];

export const OUTPUT_COLUMNS = [
  "firma", "pomiar", "klimat_0_100", "n", "fte", "status", "kwota_zl", "proc_przychodu",
  "p10_zl", "p90_zl", "bledy_zl", "rotacja_zl", "wypalenie_zl", "rotacja_zrodlo", "wersja",
];

export const COMPARE_COLUMNS = [
  "firma", "pomiar_przed", "pomiar_po", "klimat_przed", "klimat_po", "klimat_zmiana",
  "kwota_przed_zl", "kwota_po_zl", "kwota_zmiana_zl",
  "p10_przed_zl", "p90_przed_zl", "p10_po_zl", "p90_po_zl", "wersja",
];

export const STATUS_OK = "ok";
export const STATUS_BELOW_N = "poniżej_progu_n";

// Same limits as the calculator form, so the batch accepts what the UI accepts.
const LIMITS = Object.fromEntries(INPUT_FIELDS.map((f) => [f.key, { min: f.min, max: f.max }]));

export function mapScore(raw, scale) {
  const def = SCALES[scale];
  if (!def) throw new Error(`Nieznana skala: ${scale}. Dozwolone: ${Object.keys(SCALES).join(", ")}.`);
  if (!Number.isFinite(raw) || raw < def.min || raw > def.max) {
    throw new Error(`wynik ${raw} poza zakresem skali ${scale} (${def.min}–${def.max})`);
  }
  return def.toPercent(raw);
}

// Separator is read from the header line: whichever of , or ; occurs more
// often outside quotes.
export function detectSeparator(text) {
  let commas = 0;
  let semis = 0;
  let quoted = false;
  for (const ch of text) {
    if (ch === "\"") quoted = !quoted;
    else if (!quoted && (ch === "\n" || ch === "\r")) break;
    else if (!quoted && ch === ",") commas++;
    else if (!quoted && ch === ";") semis++;
  }
  return semis > commas ? ";" : ",";
}

// Minimal RFC 4180 reader: quoted fields, doubled quotes, CRLF, BOM, blank
// lines skipped. Each record keeps the file line it starts on.
export function parseCsv(input) {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const sep = detectSeparator(text);
  const records = [];
  let fields = [];
  let field = "";
  let quoted = false;
  let wasQuoted = false;
  let line = 1;
  let startLine = 1;
  const endField = () => {
    fields.push(wasQuoted ? field : field.trim());
    field = "";
    wasQuoted = false;
  };
  const endRecord = () => {
    endField();
    if (!(fields.length === 1 && fields[0] === "")) records.push({ line: startLine, fields });
    fields = [];
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === "\"" && text[i + 1] === "\"") { field += "\""; i++; }
      else if (ch === "\"") quoted = false;
      else { if (ch === "\n") line++; field += ch; }
    } else if (ch === "\"" && field.trim() === "") {
      quoted = true;
      wasQuoted = true;
      field = "";
    } else if (ch === sep) {
      endField();
    } else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRecord();
      line++;
      startLine = line;
    } else {
      field += ch;
    }
  }
  if (quoted) throw new Error(`Niezamknięty cudzysłów w rekordzie zaczynającym się w linii ${startLine}.`);
  if (field !== "" || fields.length) endRecord();
  return { sep, records };
}

// Strict number: optional minus, digits, optional fraction. Decimal comma is
// accepted only for ; files, where it cannot collide with the separator.
export function parseNumber(raw, sep) {
  const s = sep === ";" ? raw.replace(",", ".") : raw;
  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
}

export function parseArgs(argv) {
  const opts = { skala: "procent", minN: DEFAULT_MIN_N, out: null, porownaj: false, help: false, file: null };
  const errors = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const [flag, inline] = arg.startsWith("--") && arg.includes("=") ? arg.split(/=(.*)/s) : [arg, undefined];
    const value = () => (inline !== undefined ? inline : argv[++i]);
    if (flag === "--help") opts.help = true;
    else if (flag === "--porownaj") opts.porownaj = true;
    else if (flag === "--skala") opts.skala = value();
    else if (flag === "--out") opts.out = value();
    else if (flag === "--min-n") {
      const v = value();
      if (!/^\d+$/.test(v ?? "") || Number(v) < 1) errors.push(`--min-n wymaga liczby całkowitej ≥ 1, podano: ${v}`);
      else opts.minN = Number(v);
    } else if (flag.startsWith("--")) errors.push(`Nieznana opcja: ${flag}`);
    else if (opts.file) errors.push(`Podano więcej niż jeden plik: ${arg}`);
    else opts.file = arg;
  }
  if (!SCALES[opts.skala]) errors.push(`Nieznana skala: ${opts.skala}. Dozwolone: ${Object.keys(SCALES).join(", ")}.`);
  if (opts.out === undefined || opts.out === "") errors.push("--out wymaga nazwy pliku.");
  return { opts, errors };
}

// Validates every row and returns all errors at once (fail closed: the caller
// writes nothing if errors is non-empty).
export function validateRows(text, { skala = "procent", porownaj = false } = {}) {
  const errors = [];
  let parsed;
  try {
    parsed = parseCsv(text);
  } catch (error) {
    return { rows: [], errors: [error.message], ignored: [] };
  }
  const { sep, records } = parsed;
  if (!records.length) return { rows: [], errors: ["Plik jest pusty."], ignored: [] };
  const header = records[0].fields.map((h) => h.toLowerCase());
  const known = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];
  const dupes = header.filter((h, i) => header.indexOf(h) !== i);
  if (dupes.length) errors.push(`Powtórzone kolumny w nagłówku: ${[...new Set(dupes)].join(", ")}.`);
  for (const col of REQUIRED_COLUMNS) if (!header.includes(col)) errors.push(`Brak wymaganej kolumny: ${col}.`);
  if (porownaj && !header.includes("pomiar")) errors.push("Tryb --porownaj wymaga kolumny pomiar.");
  const ignored = header.filter((h) => !known.includes(h));
  if (errors.length) return { rows: [], errors, ignored };
  if (records.length === 1) return { rows: [], errors: ["Plik nie zawiera wierszy z danymi."], ignored };

  const rows = [];
  const seen = new Map();
  for (const { line, fields } of records.slice(1)) {
    const where = `Linia ${line}`;
    if (fields.length !== header.length) {
      errors.push(`${where}: ${fields.length} pól, nagłówek ma ${header.length}.`);
      continue;
    }
    const cell = Object.fromEntries(header.map((h, i) => [h, fields[i]]));
    const rowErrors = [];
    const num = (col, { required, min, max, integer = false }) => {
      const raw = cell[col] ?? "";
      if (raw === "") {
        if (required) rowErrors.push(`brak wartości w kolumnie ${col}`);
        return undefined;
      }
      const value = parseNumber(raw, sep);
      if (!Number.isFinite(value)) {
        rowErrors.push(`${col}: „${raw}” nie jest liczbą${sep === "," && raw.includes(",") ? " (przecinek dziesiętny tylko w plikach rozdzielanych średnikiem)" : ""}`);
      } else if (integer && !Number.isInteger(value)) {
        rowErrors.push(`${col}: oczekiwano liczby całkowitej, podano ${raw}`);
      } else if (value < min || value > max) {
        rowErrors.push(`${col}: ${raw} poza zakresem ${min}–${max}`);
      } else {
        return value;
      }
      return undefined;
    };
    const firma = cell.firma ?? "";
    const pomiar = cell.pomiar ?? "";
    if (!firma) rowErrors.push("brak kodu firmy w kolumnie firma");
    if (porownaj && !pomiar) rowErrors.push("brak wartości w kolumnie pomiar (wymagana w trybie --porownaj)");
    const rawScore = num("klimat", { required: true, min: -Infinity, max: Infinity });
    let safety;
    if (rawScore !== undefined) {
      try {
        safety = mapScore(rawScore, skala);
      } catch (error) {
        rowErrors.push(`klimat: ${error.message}`);
      }
    }
    const n = num("n", { required: true, min: 0, max: Number.MAX_SAFE_INTEGER, integer: true });
    const fte = num("fte", { required: true, ...LIMITS.employees });
    const placa = num("placa_roczna", { required: true, ...LIMITS.avgSalary });
    const rotacja = num("rotacja_proc", { required: false, ...LIMITS.turnoverPct });
    const przychod = num("przychod", { required: false, ...LIMITS.revenue });
    const key = `${firma}\u0000${pomiar}`;
    if (firma && seen.has(key)) rowErrors.push(`powtórzona para firma/pomiar (pierwszy raz w linii ${seen.get(key)})`);
    else if (firma) seen.set(key, line);
    if (rowErrors.length) {
      errors.push(`${where} (${firma || "bez kodu"}): ${rowErrors.join("; ")}.`);
      continue;
    }
    rows.push({ line, firma, pomiar, safety, n, fte, placa, rotacja, przychod });
  }
  return { rows, errors, ignored };
}

// Runs the current public model. Optional inputs are passed only when given:
// no turnover means the reference rate 14.8%, exactly as if it had been
// declared (fnpModel.js); no revenue means the engine's revenue 0, which does
// not enter the three headline areas.
export function computeRow(row, { minN = DEFAULT_MIN_N } = {}) {
  const base = { ...row, rotacjaZrodlo: row.rotacja === undefined ? "odniesienie" : "deklaracja" };
  if (row.n < minN) return { ...base, status: STATUS_BELOW_N };
  const params = {
    employees: row.fte,
    avgSalary: row.placa,
    safety: row.safety,
    scopeMode: "conservative",
    safetySource: "survey",
    ...(row.rotacja !== undefined ? { turnoverPct: row.rotacja } : {}),
    ...(row.przychod !== undefined ? { revenue: row.przychod } : {}),
  };
  const result = computeFnpAnalysis(params);
  const headline = Object.fromEntries(result.costs.components.filter((c) => c.inHeadline).map((c) => [c.id, c.value]));
  return {
    ...base,
    status: STATUS_OK,
    params,
    total: result.costs.totalTax,
    p10: result.mc.p10,
    p90: result.mc.p90,
    errors: headline.errors,
    turnover: headline.turnover,
    burnout: headline.burnout,
  };
}

const money = (x) => (x === undefined || x === null ? "" : String(Math.round(x) || 0));
const fixed = (x, digits) => {
  const s = x.toFixed(digits);
  return /^-0(\.0+)?$/.test(s) ? s.slice(1) : s;
};

function csvCell(value) {
  const s = String(value ?? "");
  return /[",;\r\n]/.test(s) ? `"${s.replaceAll("\"", "\"\"")}"` : s;
}

const csvLine = (cells) => cells.map(csvCell).join(",");

export function formatRows(results, version) {
  const lines = [csvLine(OUTPUT_COLUMNS)];
  for (const r of results) {
    const ok = r.status === STATUS_OK;
    const pct = ok && r.przychod > 0 ? fixed((r.total / r.przychod) * 100, 2) : "";
    lines.push(csvLine([
      r.firma, r.pomiar, fixed(r.safety, 1), r.n, r.fte, r.status,
      ok ? money(r.total) : "", pct,
      ok ? money(r.p10) : "", ok ? money(r.p90) : "",
      ok ? money(r.errors) : "", ok ? money(r.turnover) : "", ok ? money(r.burnout) : "",
      r.rotacjaZrodlo, version,
    ]));
  }
  return `${lines.join("\n")}\n`;
}

const INPUT_LABELS = { fte: "fte", placa: "placa_roczna", rotacja: "rotacja_proc", przychod: "przychod" };

// Pairs exactly two measurements per firm. Everything not paired is returned
// with a reason, never dropped silently.
export function compareResults(results) {
  const byFirm = new Map();
  for (const r of results) {
    if (!byFirm.has(r.firma)) byFirm.set(r.firma, []);
    byFirm.get(r.firma).push(r);
  }
  const pairs = [];
  const skipped = [];
  const notes = [];
  for (const [firma, list] of byFirm) {
    if (list.length !== 2) {
      skipped.push({ firma, reason: `${list.length} pomiar(y), potrzebne dokładnie 2` });
      continue;
    }
    const [before, after] = [...list].sort((a, b) => (a.pomiar < b.pomiar ? -1 : a.pomiar > b.pomiar ? 1 : 0));
    const below = [before, after].filter((r) => r.status !== STATUS_OK);
    if (below.length) {
      skipped.push({ firma, reason: `pomiar ${below.map((r) => `${r.pomiar} (n=${r.n})`).join(", ")} poniżej progu respondentów` });
      continue;
    }
    const changed = Object.entries(INPUT_LABELS).filter(([k]) => before[k] !== after[k]).map(([, label]) => label);
    if (changed.length) notes.push({ firma, changed });
    pairs.push({ firma, before, after });
  }
  return { pairs, skipped, notes };
}

export function formatComparison(pairs, version) {
  const lines = [csvLine(COMPARE_COLUMNS)];
  for (const { firma, before, after } of pairs) {
    const k0 = Math.round(before.safety * 10);
    const k1 = Math.round(after.safety * 10);
    const m0 = Math.round(before.total) || 0;
    const m1 = Math.round(after.total) || 0;
    lines.push(csvLine([
      firma, before.pomiar, after.pomiar,
      fixed(k0 / 10, 1), fixed(k1 / 10, 1), fixed((k1 - k0) / 10, 1),
      m0, m1, (m1 - m0) || 0,
      money(before.p10), money(before.p90), money(after.p10), money(after.p90),
      version,
    ]));
  }
  return `${lines.join("\n")}\n`;
}

export const sha256 = (text) => createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");

export const COMPARE_DISCLAIMER = "To różnica między dwoma scenariuszami skali policzonymi tym samym modelem, nie dowód efektu programu ani oszczędności. Granice p10–p90 to granice scenariusza, nie przedziały ufności.";
