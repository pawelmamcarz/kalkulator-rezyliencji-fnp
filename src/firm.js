import { DEFAULT_PARAMS, INPUT_FIELDS } from "./inputs.js";
import { money, plNumber } from "./format.js";

export const FIRM_KEYS = INPUT_FIELDS.map((field) => field.key);

const differs = (params, keys) => keys.some((key) => !Object.is(params[key], DEFAULT_PARAMS[key]));
// Any change at all (the disc label) or to the firm only (the firm line).
export const isEdited = (params) => differs(params, [...FIRM_KEYS, "safety"]);
export const isFirmEdited = (params) => differs(params, FIRM_KEYS);

// Whose numbers are on screen: the example firm, the example firm with the
// visitor's own climate estimate, or the visitor's firm.
export function dataLabel(params) {
  if (isFirmEdited(params)) return "Twoja firma";
  return differs(params, ["safety"]) ? "Przykładowa firma, Twoja ocena klimatu" : "Przykładowa firma";
}

const shown = (value, format, errors, key) => (errors[key] ? "do poprawy" : format(value));

// "Przykładowa firma: 500 etatów, przychód 100 mln zł, ..." from the current values.
export function firmSummary(params, errors = {}) {
  const parts = [
    `${shown(params.employees, (v) => `${plNumber(v)} etatów`, errors, "employees")}`,
    `przychód ${shown(params.revenue, money, errors, "revenue")}`,
    `koszty ${shown(params.costs, money, errors, "costs")}`,
    `płaca ${shown(params.avgSalary, money, errors, "avgSalary")}`,
    `rotacja ${shown(params.turnoverPct, (v) => `${plNumber(v)}%`, errors, "turnoverPct")}`,
  ];
  return `${dataLabel(params)}: ${parts.join(", ")}.`;
}
