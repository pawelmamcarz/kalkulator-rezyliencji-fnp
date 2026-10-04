import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeCosts, computeFullModelAnalysis, MODULE_INTERACTIONS, PL_AVG_SAFETY, SILENCE_WEIGHTS,
} from "./logic.js";
import { MODULE_INTERACTIONS_LEGACY, TURNOVER_CLIMATE_WEIGHT } from "./logic/constants.js";
import { silenceMixWeight, turnoverClimateShare } from "./logic/modules.js";
import { CHANNEL_COPY, splitChannel } from "./channels.js";
import {
  FNP_MODULE_INTERACTIONS, FNP_PROBLEM_DIST, computeFnpAnalysis, computeFnpClimateSensitivity,
  fnpAnalysisParams, withoutFnpDoubleCounts,
} from "./fnpModel.js";

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
    // Engine audit 2026-10-04: 3_116_935 -> 3_146_247 (proportional turnover
    // rule +160_333; silence-type weights normalised within the headline so
    // they no longer change its sum: -131_021).
    expect(Math.round(costs.totalTax)).toBe(3_146_247);
  });
});

describe("FNP declared turnover: a share of the firm's own exits", () => {
  const input = {
    revenue: 100_000_000,
    employees: 500,
    avgSalary: 90_000,
    safety: PL_AVG_SAFETY,
  };
  const costsAt = (turnoverPct, extra = {}) => computeCosts(fnpAnalysisParams({ ...input, turnoverPct, ...extra }));
  const turnoverAt = (turnoverPct, extra = {}) => costsAt(turnoverPct, extra).components.find((c) => c.id === "turnover").value;
  const k = fnpAnalysisParams({ ...input, turnoverPct: 16 }).overrides.K_SIGMOID_MULT;

  it("is proportional to and strictly increasing in the declared rate, with no kink", () => {
    // Before the silence-type weights the module is exactly proportional.
    // The weights redistribute over all modules with one common factor, so
    // the shown amount deviates from proportional by at most about 3% (at climate 41 and
    // declared 100%: 2.5%); it stays strictly increasing and smooth.
    const turnover = (pct) => costsAt(pct).components.find((c) => c.id === "turnover");
    const preWeight = (pct) => turnover(pct).value / turnover(pct).silenceMultiplier;
    const perPoint = preWeight(1);
    expect(perPoint).toBeGreaterThan(0);
    let previous = 0;
    let maxStep = 0;
    for (let pct = 0.25; pct <= 100; pct += 0.25) {
      expect(preWeight(pct) / (perPoint * pct)).toBeCloseTo(1, 10);
      const value = turnover(pct).value;
      expect(value).toBeGreaterThan(previous);
      expect(value / (turnoverAt(1) * pct)).toBeLessThan(1.035);
      maxStep = Math.max(maxStep, value - previous);
      previous = value;
    }
    // No kink: on a 0.25-point grid every step is close to the average step.
    expect(maxStep).toBeLessThan(1.1 * (turnoverAt(100) / 400));
  });

  it("is zero at declared 0 and at climate 100", () => {
    expect(turnoverAt(0)).toBe(0);
    for (const pct of [3, 16, 100]) expect(turnoverAt(pct, { safety: 100 })).toBe(0);
  });

  it("never exceeds the cost of replacing every declared leaver times the downstream multipliers", () => {
    for (const safety of [0, 10, 41, 70, 99]) {
      for (const pct of [3, 16, 40, 100]) {
        const costs = costsAt(pct, { safety });
        const value = costs.components.find((c) => c.id === "turnover").value;
        const p = fnpAnalysisParams({ ...input, turnoverPct: pct, safety });
        const silence = costs.silenceShares;
        const raw = silenceMixWeight(SILENCE_WEIGHTS.turnover, silence);
        // Hirschman <= 1 + H, silence weight scaled by at most the ratio of
        // the largest to the smallest mix weight, automatic silence <= 1 + penalty.
        const mixes = Object.values(SILENCE_WEIGHTS).map((w) => silenceMixWeight(w, silence));
        const bound = input.employees * (pct / 100) * input.avgSalary * 0.75
          * (1 + p.overrides.HIRSCHMAN_EXIT_AMPLIFIER)
          * (raw / Math.min(...mixes))
          * (1 + p.overrides.AUTOMATIC_SILENCE_PENALTY);
        expect(value).toBeLessThanOrEqual(bound);
      }
    }
  });

  it("applies the voice-blocking amplifier only to the climate share of exits", () => {
    const none = { overrides: { HIRSCHMAN_EXIT_AMPLIFIER: 0 } };
    const withH = turnoverAt(16);
    const withoutH = turnoverAt(16, none);
    expect(withH).toBeGreaterThan(withoutH);
    // Without the amplifier the amount is leavers × weight × share × 0.75 × pay,
    // up to the silence-type and automatic-silence multipliers, which are the
    // same in both runs: the ratio is the amplifier alone.
    const share = turnoverClimateShare(PL_AVG_SAFETY, k);
    const leavers = input.employees * 0.16 * TURNOVER_CLIMATE_WEIGHT * share;
    expect(withoutH / (leavers * 0.75 * input.avgSalary)).toBeGreaterThan(0.8);
    expect(withH / withoutH).toBeLessThanOrEqual(1 + 0.10 + 1e-12);
  });

  it("the share attributed to climate is about 29% at climate 41 and zero at 100", () => {
    expect(turnoverClimateShare(41, k)).toBeGreaterThan(0.28);
    expect(turnoverClimateShare(41, k)).toBeLessThan(0.30);
    expect(turnoverClimateShare(100, k)).toBe(0);
  });

  it.each([undefined, null, "", " ", "\t"])("blank turnover %j throws a Polish TypeError", (blank) => {
    const params = { ...input, turnoverPct: blank };
    if (blank === undefined) delete params.turnoverPct;
    expect(() => fnpAnalysisParams(params)).toThrow(TypeError);
    expect(() => fnpAnalysisParams(params)).toThrow(/Rotacja \(turnoverPct\) jest wymagana/);
  });

  it.each([undefined, null, "", " ", "\t", NaN, "abc", "41%", true, false, [41], {}])("blank or non-numeric climate %j throws", (safety) => {
    expect(() => fnpAnalysisParams({ ...input, turnoverPct: 16, safety })).toThrow(TypeError);
  });

  it.each([NaN, "abc", "16%", Infinity, true, [16]])("non-numeric turnover %j throws", (turnoverPct) => {
    expect(() => fnpAnalysisParams({ ...input, turnoverPct })).toThrow(TypeError);
  });

  it.each([[-1, 16], [101, 16], [41, -0.1], [41, 100.5]])("out-of-range climate %j / turnover %j throws instead of clamping", (safety, turnoverPct) => {
    expect(() => fnpAnalysisParams({ ...input, safety, turnoverPct })).toThrow(RangeError);
  });

  it("accepts trimmed numeric strings", () => {
    const a = computeCosts(fnpAnalysisParams({ ...input, safety: " 41 ", turnoverPct: "16" })).totalTax;
    expect(a).toBe(computeCosts(fnpAnalysisParams({ ...input, turnoverPct: 16 })).totalTax);
  });

  it("no longer reads the old PL_AVG_TURNOVER override (unknown overrides are rejected)", () => {
    expect(() => fnpAnalysisParams({ ...input, turnoverPct: 16, overrides: { PL_AVG_TURNOVER: 0.2 } }))
      .not.toThrow();
    expect(() => computeCosts(fnpAnalysisParams({ ...input, turnoverPct: 16, overrides: { PL_AVG_TURNOVER: 0.2 } })))
      .toThrow(/Unknown override: PL_AVG_TURNOVER/);
  });
});

describe("FNP climate sensitivity", () => {
  const input = { revenue: 100_000_000, employees: 500, avgSalary: 90_000, turnoverPct: 16, safety: 41 };

  it("equals the engine headline at climate ±10 for the same inputs", () => {
    const s = computeFnpClimateSensitivity(input);
    expect(s.step).toBe(10);
    expect(s.lower.safety).toBe(31);
    expect(s.higher.safety).toBe(51);
    expect(s.lower.total).toBe(computeFnpAnalysis({ ...input, safety: 31 }).costs.totalTax);
    expect(s.higher.total).toBe(computeFnpAnalysis({ ...input, safety: 51 }).costs.totalTax);
    expect(s.lower.total).toBeGreaterThan(computeFnpAnalysis(input).costs.totalTax);
  });

  it("leaves out a side that would leave the 0–100 scale", () => {
    expect(computeFnpClimateSensitivity({ ...input, safety: 95 }).higher).toBeNull();
    expect(computeFnpClimateSensitivity({ ...input, safety: 95 }).lower.safety).toBe(85);
    expect(computeFnpClimateSensitivity({ ...input, safety: 4 }).lower).toBeNull();
    expect(computeFnpClimateSensitivity({ ...input, safety: 10 }).lower.safety).toBe(0);
  });
});

describe("FNP interactions and silence weights", () => {
  it("the FNP filter drops blameRate → errors and burnoutRate → turnover, keeps the rest", () => {
    const has = (rows, from, to) => rows.some((r) => r.fromMetric === from && r.toId === to);
    // Checked against the legacy list, which still has both rows, so the
    // filter is exercised (the engine default already lacks them).
    expect(has(MODULE_INTERACTIONS_LEGACY, "blameRate", "errors")).toBe(true);
    expect(has(MODULE_INTERACTIONS_LEGACY, "burnoutRate", "turnover")).toBe(true);
    const filtered = withoutFnpDoubleCounts(MODULE_INTERACTIONS_LEGACY);
    expect(filtered).toHaveLength(MODULE_INTERACTIONS_LEGACY.length - 2);
    expect(has(filtered, "blameRate", "errors")).toBe(false);
    expect(has(filtered, "burnoutRate", "turnover")).toBe(false);
    expect(has(filtered, "destructiveFear", "burnout")).toBe(true);
    expect(FNP_MODULE_INTERACTIONS).toEqual(withoutFnpDoubleCounts(MODULE_INTERACTIONS));
    expect(FNP_DEFAULTS.overrides.MODULE_INTERACTIONS).toBe(FNP_MODULE_INTERACTIONS);
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

  it("says which figures feed the curves, that they are unchecked, and that amounts are not calibrated", () => {
    expect(context).toMatch(/kontekst/i);
    expect(context).toMatch(/wartości końcowe krzywych modelu \(stabilność zespołu 59% i 85%, wypalenie 51%\)/);
    expect(context).toMatch(/nie sprawdzono/);
    expect(context).toMatch(/nie są skalibrowane/);
    expect(context).not.toMatch(/nie przelicza/);
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
