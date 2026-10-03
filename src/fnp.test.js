import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeCosts, computeFullModelAnalysis, getMetricValue, MODULE_INTERACTIONS,
  PL_AVG_SAFETY, PL_TURNOVER_RATE_GUS, SILENCE_WEIGHTS,
} from "./logic.js";
import { CHANNEL_COPY, splitChannel } from "./channels.js";
import { FNP_MODULE_INTERACTIONS, FNP_PROBLEM_DIST, fnpAnalysisParams } from "./fnpModel.js";

const srcDir = path.dirname(fileURLToPath(import.meta.url));
const sectionsDir = path.join(srcDir, "sections");
const readSection = (name) => readFileSync(path.join(sectionsDir, name), "utf8");

const FNP_DEFAULTS = fnpAnalysisParams({
  revenue: 100_000_000,
  costs: 92_000_000,
  employees: 500,
  avgSalary: 90_000,
  turnoverPct: 16,
  safety: PL_AVG_SAFETY,
  safetySource: "estimate",
  scopeMode: "conservative",
});

describe("FNP public calculator contract", () => {
  it("exposes five reporting channels with FNP narrative labels", () => {
    expect(Object.keys(CHANNEL_COPY)).toEqual([
      "continuity",
      "operational",
      "capacity",
      "contribution",
      "coordination",
    ]);
    expect(CHANNEL_COPY.continuity.title).toBe("Rotacja i utrata wiedzy");
    expect(CHANNEL_COPY.capacity.title).toBe("Wypalenie i pasywność");
  });

  it("default firm stays at or under 5% of revenue in ostrożny mode", () => {
    const analysis = computeFullModelAnalysis(FNP_DEFAULTS, { iterations: 50, seed: 1 });
    expect(analysis.costs.scopeMode).toBe("conservative");
    expect(analysis.costs.totalTax).toBeGreaterThan(0);
    expect(analysis.costs.totalTax / FNP_DEFAULTS.revenue).toBeLessThanOrEqual(0.05);
    expect(Number.isFinite(analysis.costs.totalTaxFull)).toBe(true);
  });

  it("ready valuation uses estimate source without a 7-item survey", () => {
    const analysis = computeFullModelAnalysis(FNP_DEFAULTS, { iterations: 200, seed: 1 });
    expect(analysis.valuation.ready).toBe(true);
    expect(analysis.valuation.channels).toHaveLength(5);
    expect(analysis.valuation.total.base).toBe(analysis.costs.totalTax);
  });

  it("channel headlines sum to LINE 99 and two areas stay out of the sum", () => {
    const analysis = computeFullModelAnalysis(FNP_DEFAULTS, { iterations: 50, seed: 1 });
    const splits = analysis.valuation.channels.map(splitChannel);
    const headlineSum = splits.reduce((sum, s) => sum + s.headline, 0);
    expect(headlineSum).toBeCloseTo(analysis.costs.totalTax, 6);
    const byId = Object.fromEntries(analysis.valuation.channels.map((ch) => [ch.id, splitChannel(ch)]));
    expect(byId.contribution.headline).toBe(0);
    expect(byId.coordination.headline).toBe(0);
    expect(byId.continuity.headline).toBeGreaterThan(0);
    expect(byId.operational.headline).toBeGreaterThan(0);
    expect(byId.capacity.headline).toBeGreaterThan(0);
  });

  it("uses the FNP problem mix, not the academic per-head critical rate", () => {
    expect(FNP_PROBLEM_DIST.find((d) => d.id === "critical").count).toBeLessThan(0.02);
    expect(FNP_PROBLEM_DIST.find((d) => d.id === "major").count).toBeLessThan(0.1);
  });

  it("default firm: headline is exactly errors + turnover + burnout and stays at or under 5%", () => {
    const costs = computeCosts(FNP_DEFAULTS);
    const value = (id) => costs.components.find((c) => c.id === id).value;
    expect(costs.components.filter((c) => c.inHeadline).map((c) => c.id)).toEqual(["errors", "turnover", "burnout"]);
    expect(costs.totalTax).toBeCloseTo(value("errors") + value("turnover") + value("burnout"), 6);
    expect(costs.totalTax / FNP_DEFAULTS.revenue).toBeLessThanOrEqual(0.05);
    // Pinned so a silent change of the public example is noticed.
    expect(Math.round(costs.totalTax)).toBe(3_116_935);
  });
});

describe("FNP declared turnover is only a ceiling", () => {
  const input = {
    revenue: 100_000_000,
    employees: 500,
    avgSalary: 90_000,
    safety: PL_AVG_SAFETY,
  };
  const turnoverAt = (turnoverPct, extra = {}) =>
    computeCosts(fnpAnalysisParams({ ...input, turnoverPct, ...extra })).components
      .find((c) => c.id === "turnover").value;

  // Modelled churn rate in the engine: half of the climate excess on top of
  // the s = 100 churn (src/logic/modules.js), with the FNP steepness.
  const churnAt = (safety, k) => Math.max(0, (1 - getMetricValue("teamStability", safety, k)) * 0.4 - 0.015);
  const k = fnpAnalysisParams({ ...input, turnoverPct: 16 }).overrides.K_SIGMOID_MULT;
  const modelChurn = 0.5 * (churnAt(PL_AVG_SAFETY, k) - churnAt(100, k)) + churnAt(100, k);

  it("is monotone non-decreasing over 0–100% and flat above the modelled churn", () => {
    expect(modelChurn).toBeGreaterThan(0);
    expect(modelChurn).toBeLessThan(PL_TURNOVER_RATE_GUS);
    const ceiling = turnoverAt(100);
    let previous = -Infinity;
    for (let pct = 0; pct <= 100; pct += 0.5) {
      const value = turnoverAt(pct);
      expect(value).toBeGreaterThanOrEqual(previous - 1e-6);
      if (pct / 100 >= modelChurn) expect(value).toBeCloseTo(ceiling, 6);
      previous = value;
    }
    expect(turnoverAt(0)).toBe(0);
    // Just below the modelled churn the declaration still binds.
    expect(turnoverAt(modelChurn * 100 - 0.5)).toBeLessThan(ceiling - 1);
  });

  it("declarations of 16, 30 and 100% give the same turnover amount (no excess-over-reference claim)", () => {
    const at16 = turnoverAt(16);
    expect(at16).toBeGreaterThan(0);
    expect(turnoverAt(30)).toBeCloseTo(at16, 6);
    expect(turnoverAt(100)).toBeCloseTo(at16, 6);
    // Same with the Hirschman amplifier explicitly at its FNP value.
    const hirschman = fnpAnalysisParams({ ...input, turnoverPct: 16 }).overrides.HIRSCHMAN_EXIT_AMPLIFIER;
    expect(hirschman).toBe(0.10);
    const pinned = { overrides: { HIRSCHMAN_EXIT_AMPLIFIER: hirschman } };
    expect(turnoverAt(100, pinned)).toBeCloseTo(turnoverAt(16, pinned), 6);
  });

  it("a declaration lowers the amount but cannot add exits beyond it", () => {
    const high = turnoverAt(16);
    const low = turnoverAt(3);
    expect(low).toBeLessThan(high);
    // With 3% declared, no more than 3% of FTE can be billed as exits, even
    // with the voice-blocking amplifier and silence weights on top.
    const payroll = input.employees * input.avgSalary;
    expect(low).toBeLessThan(payroll * 0.03 * 0.75);
    expect(low).toBeLessThan(high * 0.15);
  });

  it.each([undefined, null, ""])("blank turnover %j equals declaring the 14.8% reference", (blank) => {
    const reference = computeFullModelAnalysis(fnpAnalysisParams({ ...input, turnoverPct: PL_TURNOVER_RATE_GUS * 100 }), { iterations: 50, seed: 1 });
    const params = { ...input, turnoverPct: blank };
    if (blank === undefined) delete params.turnoverPct;
    const result = computeFullModelAnalysis(fnpAnalysisParams(params), { iterations: 50, seed: 1 });
    expect(result.costs.totalTax).toBe(reference.costs.totalTax);
    expect(result.costs.components.map((c) => c.value)).toEqual(reference.costs.components.map((c) => c.value));
    expect(result.mc.p10).toBe(reference.mc.p10);
    expect(result.mc.p90).toBe(reference.mc.p90);
  });

  it.each([undefined, null, "", NaN, "abc", "41%"])("blank or non-numeric climate %j throws", (safety) => {
    expect(() => fnpAnalysisParams({ ...input, turnoverPct: 16, safety })).toThrow(TypeError);
  });

  it.each([NaN, "abc", "16%", Infinity])("non-numeric turnover %j throws", (turnoverPct) => {
    expect(() => fnpAnalysisParams({ ...input, turnoverPct })).toThrow(TypeError);
  });
});

describe("FNP interactions and silence weights", () => {
  it("drops blameRate → errors and burnoutRate → turnover, keeps the rest", () => {
    const has = (rows, from, to) => rows.some((r) => r.fromMetric === from && r.toId === to);
    // The shared engine dropped both double counts by default; FNP keeps its
    // own filter so the headline cannot regain them if the default changes.
    for (const rows of [MODULE_INTERACTIONS, FNP_MODULE_INTERACTIONS]) {
      expect(has(rows, "blameRate", "errors")).toBe(false);
      expect(has(rows, "burnoutRate", "turnover")).toBe(false);
    }
    expect(has(FNP_MODULE_INTERACTIONS, "destructiveFear", "burnout")).toBe(true);
    expect(FNP_DEFAULTS.overrides.MODULE_INTERACTIONS).toBe(FNP_MODULE_INTERACTIONS);
  });

  it("normalised silence weights give multiplier 1 for an equal mix of silence types", () => {
    expect(FNP_DEFAULTS.overrides.SILENCE_WEIGHTS_NORMALIZED).toBe(true);
    const normalised = computeCosts(FNP_DEFAULTS);
    const raw = computeCosts({ ...FNP_DEFAULTS, overrides: { ...FNP_DEFAULTS.overrides, SILENCE_WEIGHTS_NORMALIZED: false } });
    for (const id of ["errors", "turnover", "burnout"]) {
      const w = SILENCE_WEIGHTS[id];
      const equalMix = (w.def + w.acq + w.pro) / 3;
      // Normalisation divides the weighted multiplier by its equal-mix value,
      // so the raw / normalised ratio is that value and the normalised
      // multiplier of an equal mix is exactly 1.
      const value = (costs) => costs.components.find((c) => c.id === id).value;
      expect(value(normalised)).toBeGreaterThan(0);
      const engineNorm = value(raw) / value(normalised);
      expect(engineNorm).toBeCloseTo(equalMix, 10);
      const equalMixMultiplier = (w.def / 3 + w.acq / 3 + w.pro / 3) / engineNorm;
      expect(equalMixMultiplier).toBeCloseTo(1, 10);
    }
  });
});

describe("FNP × Ipsos context section copy", () => {
  const context = readSection("Context.jsx");

  it("shows three publicly confirmed report figures", () => {
    for (const figure of ["71%", "42%", "85% / 59%"]) {
      expect(context).toContain(figure);
    }
  });

  it("does not show figures absent from the public report materials", () => {
    // Source register 2026-10-03: 68% and 73% are not in public materials, and
    // the 71% item measures lack of full safety, not silence.
    expect(context).not.toMatch(/"(68|73|52|72)%"/);
    expect(context).not.toMatch(/71%[^}]*milczy/);
  });

  it("names its source: Fundacja Nowe Przestrzenie, Ipsos and the report title", () => {
    expect(context).toMatch(/Fundacj[ai] Nowe Przestrzenie/);
    expect(context).toContain("Ipsos");
    expect(context).toMatch(/Ile kosztuje milczenie\?/);
  });

  it("says the figures are context, not converted to złote and not a calibration base", () => {
    expect(context).toMatch(/kontekst/i);
    expect(context).toMatch(/nie przelicza[^.]*na złote/);
    expect(context).toMatch(/nie jest na nich skalibrowany/);
  });

  it("contains no money amounts, ROI or return claims", () => {
    expect(context).not.toMatch(/\d[\d\s.,]*\s*(zł|PLN|mln|mld|tys\.)/i);
    expect(context).not.toMatch(/\bROI\b/);
    expect(context).not.toMatch(/zwrot/i);
  });

  it("never claims the model is calibrated on Ipsos (negated statement allowed)", () => {
    // Every sentence that mentions calibration must negate it before the verb.
    const sentences = context.split(/(?<=[.!?])\s+/);
    const calibrationSentences = sentences.filter((sentence) => /kalibr/i.test(sentence));
    expect(calibrationSentences.length).toBeGreaterThan(0);
    for (const sentence of calibrationSentences) {
      expect(sentence).toMatch(/\bnie\b[^.!?]*kalibr/i);
    }
    expect(context).not.toMatch(/kalibr\w*\s+(na|na podstawie|w oparciu o)\s+(danych\s+|badaniu\s+|raporcie\s+)?Ipsos/i);
  });
});

describe("public section copy style", () => {
  it("has no em-dash characters in src/sections/*.jsx", () => {
    const files = readdirSync(sectionsDir).filter((f) => f.endsWith(".jsx"));
    expect(files.length).toBeGreaterThan(0);
    const offenders = files.filter((f) => readSection(f).includes("\u2014"));
    expect(offenders).toEqual([]);
  });
});
