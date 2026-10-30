import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { DEFAULT_PARAMS, validateInputs, scenarioSafety } from "./inputs.js";
import { dataLabel } from "./firm.js";
import Invitation from "./sections/Invitation.jsx";
import Result from "./sections/Result.jsx";
import Hero from "./sections/Hero.jsx";
import Channels from "./sections/Channels.jsx";
import { computeFnpAnalysis } from "./fnpModel.js";

const survey = (extra = {}) => ({ ...DEFAULT_PARAMS, safetySource: "survey", surveySafety: "", surveyScope: "", surveyConfirmed: false, ...extra });

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
    expect(validateInputs(survey({ surveySafety: value, surveyScope: "part", surveyConfirmed: true })).surveySafety).toBeTruthy();
  });
  it.each([0, 50, 100])("accepts a compatible manually entered value %i", value => {
    expect(validateInputs(survey({ surveySafety: value, surveyScope: "part", surveyConfirmed: true }))).toEqual({});
  });
  it("requires a valid scope and explicit compatible-scale confirmation", () => {
    const errors = validateInputs(survey({ surveySafety: 50, surveyScope: "unrecognized", surveyConfirmed: false }));
    expect(errors.surveyScope).toBeTruthy();
    expect(errors.surveyConfirmed).toBeTruthy();
  });
  it("labels an example firm and a partial survey honestly in result and print", () => {
    const params = survey({ surveySafety: 50, surveyScope: "part", surveyConfirmed: true });
    expect(dataLabel(params)).toContain("Przykładowa firma");
    expect(dataLabel(params)).toContain("wynik badania");
    const html = renderToString(createElement(Invitation, { params, valuation: null }));
    expect(html).toContain("części organizacji");
    expect(html).toContain("Przykładowa firma");
    expect(html).not.toContain("szacunek własny, nie pomiar");
  });
  it("uses the survey value consistently for the model, edge case and methodology", () => {
    const params = survey({ surveySafety: 100, surveyScope: "part", surveyConfirmed: true });
    const effective = { ...params, safety: scenarioSafety(params) };
    const valuation = computeFnpAnalysis(effective).valuation;
    expect(valuation.total.base).toBe(0);
    expect(renderToString(createElement(Result, { params: effective, valuation }))).toContain("Przy 100/100 nadwyżka wynosi zero");
    expect(renderToString(createElement(Channels, { params: effective, valuation }))).toContain("przy klimacie 100/100");
  });

});
