import { describe, expect, it } from "vitest";
import { dataLabel } from "./firm.js";
import { DEFAULT_PARAMS } from "./inputs.js";

describe("wynik badania części organizacji", () => {
  it("nagłówek mówi, że wynik dotyczy części organizacji albo nieustalonej grupy", () => {
    const survey = { ...DEFAULT_PARAMS, safetySource: "survey", surveySafety: 70, surveyConfirmed: true, surveyScopeConfirmed: true };
    expect(dataLabel({ ...survey, surveyScope: "part" })).toContain("części organizacji");
    expect(dataLabel({ ...survey, surveyScope: "unknown" })).toContain("nieustalonej grupy");
    expect(dataLabel({ ...survey, surveyScope: "whole" })).toContain("wprowadzony ręcznie");
  });
});


import { etatWord, payrollAboveCosts } from "./firm.js";
describe("odmiana i spójność danych", () => {
  it("odmienia etat po polsku", () => {
    expect([1, 2, 4, 5, 12, 14, 22, 25, 500].map(etatWord)).toEqual(["etat", "etaty", "etaty", "etatów", "etatów", "etatów", "etaty", "etatów", "etatów"]);
  });
  it("płace powyżej kosztów oznaczają niespójne dane, powyżej samych przychodów nie", () => {
    expect(payrollAboveCosts({ ...DEFAULT_PARAMS, employees: 5000 })).toBe(450_000_000);
    expect(payrollAboveCosts(DEFAULT_PARAMS)).toBe(0);
    expect(payrollAboveCosts({ ...DEFAULT_PARAMS, revenue: 0 })).toBe(0);
    expect(payrollAboveCosts({ ...DEFAULT_PARAMS, costs: 0 })).toBe(0);
  });
});

import { inputError, INPUT_FIELDS } from "./inputs.js";
it("ułamek etatu dostaje konkretną wskazówkę zamiast ogólnego błędu", () => {
  const field = INPUT_FIELDS.find((f) => f.key === "employees");
  expect(inputError(NaN, field)).toContain("zaokrąglij");
  expect(inputError(NaN, INPUT_FIELDS.find((f) => f.key === "revenue"))).toBe("Wpisz skończoną liczbę.");
  expect(inputError("13", field)).toBe("");
});
