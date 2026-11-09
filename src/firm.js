import { DEFAULT_PARAMS, INPUT_FIELDS } from "./inputs.js";
import { money, plNumber } from "./format.js";

export const FIRM_KEYS = INPUT_FIELDS.map((field) => field.key);

// 1 etat, 2–4 etaty (bez 12–14), pozostałe etatów; ułamek: etatu.
export function etatWord(value) {
  const n = Number(value);
  if (!Number.isInteger(n)) return "etatu";
  if (n === 1) return "etat";
  const last = n % 10, lastTwo = n % 100;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? "etaty" : "etatów";
}

// Etaty × płaca above the stated annual costs means the fields describe
// different scopes or years, so the share of revenue would mislead.
// Payroll above revenue alone is normal for grant-funded organisations.
export function payrollAboveCosts(params) {
  const payroll = Number(params.employees) * Number(params.avgSalary);
  return Number(params.costs) > 0 && payroll > Number(params.costs) ? payroll : 0;
}

const differs = (params, keys) => keys.some((key) => !Object.is(params[key], DEFAULT_PARAMS[key]));
// Any change at all (the disc label) or to the firm only (the firm line).
export const isEdited = (params) => differs(params, [...FIRM_KEYS, "safety", "safetySource", "surveySafety", "surveyScope", "surveyConfirmed", "surveyScopeConfirmed"]);
export const isFirmEdited = (params) => differs(params, FIRM_KEYS);

// Whose numbers are on screen: the example firm, the example firm with the
// visitor's own climate estimate, or the visitor's firm.
export function dataLabel(params) {
  const edited = isFirmEdited(params);
  const someExample = edited && FIRM_KEYS.some((key) => Object.is(params[key], DEFAULT_PARAMS[key]));
  const firmLabel = !edited ? "Przykładowa firma" : someExample ? "Dane firmy, część wartości jak w przykładzie" : "Twoja firma";
  if (params.safetySource === "survey") {
    const scope = { part: ", wynik badania części organizacji", unknown: ", wynik badania nieustalonej grupy" }[params.surveyScope] || ", wynik badania wprowadzony ręcznie";
    return `${firmLabel}${scope}`;
  }
  if (edited) return firmLabel;
  return differs(params, ["safety"]) ? "Przykładowa firma, Twój szacunek klimatu" : "Przykładowa firma";
}

const shown = (value, format, errors, key) => (errors[key] ? "do poprawy" : format(value));

// "Przykładowa firma: 500 etatów, przychód 100 mln zł, ..." from the current values.
export function firmSummary(params, errors = {}) {
  const parts = [
    `${shown(params.employees, (v) => `${plNumber(v)} ${etatWord(v)}`, errors, "employees")}`,
    `przychód ${shown(params.revenue, money, errors, "revenue")}`,
    `koszty ${shown(params.costs, money, errors, "costs")}`,
    `płaca ${shown(params.avgSalary, money, errors, "avgSalary")}`,
    `rotacja ${shown(params.turnoverPct, (v) => `${plNumber(v)}%`, errors, "turnoverPct")}`,
  ];
  return `${dataLabel(params)}: ${parts.join(", ")}.`;
}
