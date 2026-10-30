import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { DEFAULT_PARAMS, validateInputs, scenarioSafety } from "./inputs.js";
import * as inputState from "./inputs.js";
import { dataLabel } from "./firm.js";
import Invitation from "./sections/Invitation.jsx";
import Result from "./sections/Result.jsx";
import Hero from "./sections/Hero.jsx";
import Headline from "./sections/Headline.jsx";
import Climate from "./sections/Climate.jsx";
import Diagnosis from "./sections/Diagnosis.jsx";
import Channels from "./sections/Channels.jsx";
import { computeFnpAnalysis } from "./fnpModel.js";

const survey = (extra = {}) => ({ ...DEFAULT_PARAMS, safetySource: "survey", surveySafety: "", surveyScope: "", surveyConfirmed: false, surveyScopeConfirmed: false, ...extra });

describe("manual survey source", () => {
  it("uses a relevant introduction for each path", () => {
    expect(renderToString(createElement(Hero, { survey: true }))).toContain("Wprowadź wynik badania");
    expect(renderToString(createElement(Hero))).toContain("Wybierz zdanie");
  });
  it("preserves the ready default quick estimate", () => {
    expect(validateInputs(DEFAULT_PARAMS)).toEqual({});
    expect(dataLabel(DEFAULT_PARAMS)).toBe("Przykładowa firma");
  });
  it("blocks the example climate from becoming a survey result", () => {
    const errors = validateInputs(survey());
    expect(errors.surveySafety).toBeTruthy();
    expect(errors.surveyScope).toBeTruthy();
    expect(errors.surveyConfirmed).toBeTruthy();
  });
  it.each(["", " ", -1, 101, "abc", true])("rejects invalid survey value %j", value => {
    expect(validateInputs(survey({ surveySafety: value, surveyScope: "part", surveyConfirmed: true, surveyScopeConfirmed: true })).surveySafety).toBeTruthy();
  });
  it.each([0, 50, 100])("accepts a compatible manually entered value %i", value => {
    expect(validateInputs(survey({ surveySafety: value, surveyScope: "part", surveyConfirmed: true, surveyScopeConfirmed: true }))).toEqual({});
  });
  it.each(["part", "unknown"])("blocks %s without matching data scope confirmation", scope => {
    const params = survey({ surveySafety: 50, surveyScope: scope, surveyConfirmed: true, surveyScopeConfirmed: false });
    expect(validateInputs(params).surveyScopeConfirmed).toBeTruthy();
    expect(validateInputs({ ...params, surveyScopeConfirmed: true }).surveyScopeConfirmed).toBeUndefined();
  });
  it("requires renewed scope confirmation after changing firm data or scope", () => {
    expect(typeof inputState.updateParams).toBe("function");
    const params = survey({ surveySafety: 50, surveyScope: "part", surveyConfirmed: true, surveyScopeConfirmed: true });
    expect(inputState.updateParams(params, "employees", 100).surveyScopeConfirmed).toBe(false);
    expect(inputState.updateParams(params, "surveyScope", "unknown").surveyScopeConfirmed).toBe(false);
    expect(inputState.updateParams(params, "surveySafety", 70).surveyScopeConfirmed).toBe(false);
    expect(inputState.updateParams(params, "surveySafety", 70).surveyConfirmed).toBe(false);
    expect(inputState.updateParams(params, "companyName", "Test").surveyScopeConfirmed).toBe(true);
  });
  it("explains the scope confirmation required after editing data", () => {
    const params = survey({ surveySafety: 50, surveyScope: "part", surveyConfirmed: true, surveyScopeConfirmed: false });
    const errors = validateInputs(params);
    const climate = renderToString(createElement(Climate, { params, errors, up: () => {}, safety: 41 }));
    const firm = renderToString(createElement(Diagnosis, { params, errors, up: () => {}, reset: () => {} }));
    expect(climate).toContain("Potwierdź zakres danych, aby zobaczyć wynik.");
    expect(climate).toContain('aria-describedby="survey-scope-confirm-help"');
    expect(firm).toContain("Potwierdź zakres badania w sekcji oceny klimatu");
  });
  it("describes the headline as a model scenario and a simulation range", () => {
    const params = { ...DEFAULT_PARAMS };
    const valuation = computeFnpAnalysis(params).valuation;
    const html = renderToString(createElement(Headline, { valuation, worst: valuation.total.base }));
    expect(html).toContain("Scenariusz modelowy");
    expect(html).toContain("Zakres symulacji");
  });
  it("requires a valid scope and explicit compatible-scale confirmation", () => {
    const errors = validateInputs(survey({ surveySafety: 50, surveyScope: "unrecognized", surveyConfirmed: false }));
    expect(errors.surveyScope).toBeTruthy();
    expect(errors.surveyConfirmed).toBeTruthy();
  });
  it("does not call partially edited example inputs a complete set of company data", () => {
    const params = survey({ employees: 100, surveySafety: 50, surveyScope: "part", surveyConfirmed: true, surveyScopeConfirmed: true });
    expect(dataLabel(params)).toContain("część wartości jak w przykładzie");
    expect(renderToString(createElement(Invitation, { params, valuation: null }))).toContain("część wartości jak w przykładzie");
  });
  it("labels an example firm and a partial survey honestly in result and print", () => {
    const params = survey({ surveySafety: 50, surveyScope: "part", surveyConfirmed: true, surveyScopeConfirmed: true });
    expect(dataLabel(params)).toContain("Przykładowa firma");
    expect(dataLabel(params)).toContain("wynik badania");
    const html = renderToString(createElement(Invitation, { params, valuation: null }));
    expect(html).toContain("części organizacji");
    expect(html).toContain("Przykładowa firma");
    expect(html).not.toContain("szacunek własny, nie pomiar");
  });
  it("uses the survey value consistently for the model, edge case and methodology", () => {
    const params = survey({ surveySafety: 100, surveyScope: "part", surveyConfirmed: true, surveyScopeConfirmed: true });
    const effective = { ...params, safety: scenarioSafety(params) };
    const valuation = computeFnpAnalysis(effective).valuation;
    expect(valuation.total.base).toBe(0);
    expect(renderToString(createElement(Result, { params: effective, valuation }))).toContain("Przy 100/100 nadwyżka wynosi zero");
    expect(renderToString(createElement(Channels, { params: effective, valuation }))).toContain("przy klimacie 100/100");
  });

});
