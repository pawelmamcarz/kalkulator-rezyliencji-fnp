import { describe, expect, it } from "vitest";
import { dataLabel } from "./firm.js";
import { DEFAULT_PARAMS, validateInputs } from "./inputs.js";
import { computeFnpAnalysis } from "./fnpModel.js";

describe("wynik badania części organizacji", () => {
  it("nagłówek mówi, że wynik dotyczy części organizacji albo nieustalonej grupy", () => {
    const survey = { ...DEFAULT_PARAMS, safetySource: "survey", surveySafety: 70, surveyConfirmed: true, surveyScopeConfirmed: true };
    expect(dataLabel({ ...survey, surveyScope: "part" })).toContain("części organizacji");
    expect(dataLabel({ ...survey, surveyScope: "unknown" })).toContain("nieustalonej grupy");
    expect(dataLabel({ ...survey, surveyScope: "whole" })).toContain("wprowadzony ręcznie");
  });
});

describe("niepełne etaty", () => {
  it("12,5 etatu jest poprawną daną i daje skończony wynik", () => {
    const params = { ...DEFAULT_PARAMS, employees: 12.5 };
    expect(validateInputs(params)).toEqual({});
    const result = computeFnpAnalysis({ ...params, safety: 41 });
    expect(Number.isFinite(result.costs.totalTax)).toBe(true);
    expect(result.costs.totalTax).toBeGreaterThan(0);
  });
});
