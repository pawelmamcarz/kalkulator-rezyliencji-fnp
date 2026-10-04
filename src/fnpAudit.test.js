import { describe, expect, it } from "vitest";
import { computeFnpAnalysis, fnpAnalysisParams, FNP_PROBLEM_DIST } from "./fnpModel.js";
import { DEFAULT_PARAMS, validateInputs } from "./inputs.js";
import { computeCosts } from "./logic/modules.js";

const analyze = (changes = {}, options = {}) => computeFnpAnalysis(
  { ...DEFAULT_PARAMS, ...changes },
  { iterations: 200, ...options },
);
const component = (analysis, id) => analysis.costs.components.find((row) => row.id === id).value;

describe("FNP numerical audit", () => {
  it("starts with only errors, turnover and burnout in the monetary headline", () => {
    const result = analyze();
    expect(result.effectiveParams.scopeMode).toBe("conservative");
    expect(result.costs.components.filter((row) => row.inHeadline).map((row) => row.id))
      .toEqual(["errors", "turnover", "burnout"]);
    expect(result.valuation.ready).toBe(true);
    expect(result.costs.totalTax / DEFAULT_PARAMS.revenue).toBeLessThanOrEqual(0.05);
  });

  it("uses identical random draws for repeated scenarios and permits an explicit research seed", () => {
    const first = analyze();
    expect(analyze().mc).toEqual(first.mc);
    const otherSeed = analyze({}, { seed: 17 });
    expect(otherSeed.costs.totalTax).toBe(first.costs.totalTax);
    expect(otherSeed.mc.seed).toBe(17);
    expect(otherSeed.mc.p90).not.toBe(first.mc.p90);
  });

  it.each([0, 1, 50_000_000, 200_000_000])("revenue %s changes no headline amount or monetary interval", (revenue) => {
    const baseline = analyze();
    const changed = analyze({ revenue });
    expect(changed.valuation.total).toEqual(baseline.valuation.total);
    expect(changed.mc).toEqual(baseline.mc);
  });

  it.each([0, 110_000_000])("annual costs %s do not feed the monetary scenario", (costs) => {
    expect(analyze({ costs }).valuation.total).toEqual(analyze().valuation.total);
  });

  it("scales the entire headline and its interval linearly with FTE", () => {
    const base = analyze();
    const doubled = analyze({ employees: DEFAULT_PARAMS.employees * 2 });
    for (const key of ["low", "base", "high"]) {
      expect(doubled.valuation.total[key]).toBeCloseTo(base.valuation.total[key] * 2, 6);
    }
  });

  // The silence-type weights redistribute the headline between its three
  // areas with one common factor (the sum is unchanged), so the shown split
  // moves together; the pre-weight amounts (value / silenceMultiplier) and
  // the headline sum keep the simple relations.
  const preWeight = (analysis, id) => {
    const row = analysis.costs.components.find((c) => c.id === id);
    return row.value / row.silenceMultiplier;
  };
  const headlineSum = (analysis) => ["errors", "turnover", "burnout"].reduce((sum, id) => sum + preWeight(analysis, id), 0);

  it("uses annual pay only for turnover and burnout in the headline", () => {
    const base = analyze();
    const doubled = analyze({ avgSalary: DEFAULT_PARAMS.avgSalary * 2 });
    expect(preWeight(doubled, "errors")).toBeCloseTo(preWeight(base, "errors"), 6);
    expect(preWeight(doubled, "turnover")).toBeCloseTo(preWeight(base, "turnover") * 2, 6);
    expect(preWeight(doubled, "burnout")).toBeCloseTo(preWeight(base, "burnout") * 2, 6);
    // The headline is the pre-weight sum times the automatic-silence factor.
    const auto = base.costs.totalTax / headlineSum(base);
    expect(doubled.costs.totalTax / headlineSum(doubled)).toBeCloseTo(auto, 12);
    const zeroPay = analyze({ avgSalary: 0 });
    expect(component(zeroPay, "turnover")).toBe(0);
    expect(component(zeroPay, "burnout")).toBe(0);
    expect(zeroPay.costs.totalTax).toBeCloseTo(preWeight(base, "errors") * auto, 6);
  });

  it("zero declared turnover removes turnover without changing the other pre-weight amounts", () => {
    const base = analyze();
    const zeroTurnover = analyze({ turnoverPct: 0 });
    expect(component(zeroTurnover, "turnover")).toBe(0);
    expect(preWeight(zeroTurnover, "errors")).toBeCloseTo(preWeight(base, "errors"), 6);
    expect(preWeight(zeroTurnover, "burnout")).toBeCloseTo(preWeight(base, "burnout"), 6);
    const auto = base.costs.totalTax / headlineSum(base);
    expect(zeroTurnover.costs.totalTax).toBeCloseTo((preWeight(base, "errors") + preWeight(base, "burnout")) * auto, 6);
  });

  it("never increases the headline as climate improves across every slider step", () => {
    let previous = Infinity;
    for (let safety = 0; safety <= 100; safety += 1) {
      const result = computeCosts(fnpAnalysisParams({ ...DEFAULT_PARAMS, safety }));
      expect(Number.isFinite(result.totalTax)).toBe(true);
      expect(result.totalTax).toBeGreaterThanOrEqual(0);
      expect(result.totalTax).toBeLessThanOrEqual(previous);
      previous = result.totalTax;
    }
    expect(previous).toBe(0);
    expect(analyze({ safety: 100 }).valuation.total).toEqual({ low: 0, base: 0, high: 0 });
  });

  it("treats zero concealability as no hidden errors, while absent values retain the fallback", () => {
    const problemDist = FNP_PROBLEM_DIST.map((row) => ({ ...row, concealability: 0 }));
    const noConcealment = analyze({ problemDist });
    expect(noConcealment.costs.hiddenErrors).toBe(0);
    expect(component(noConcealment, "errors")).toBe(0);
    const absent = analyze({ problemDist: problemDist.map((row) => ({ ...row, concealability: undefined })) });
    const explicitDefault = analyze({ problemDist: problemDist.map((row) => ({ ...row, concealability: 0.3 })) });
    expect(component(absent, "errors")).toBeGreaterThan(0);
    expect(component(absent, "errors")).toBe(component(explicitDefault, "errors"));
  });
});

describe("FNP input boundary", () => {
  it("accepts zero revenue, costs, pay, turnover and climate", () => {
    expect(validateInputs({ ...DEFAULT_PARAMS, revenue: 0, costs: 0, avgSalary: 0, turnoverPct: 0, safety: 0 }))
      .toEqual({});
  });

  it.each([
    ["employees", 0], ["employees", -1], ["revenue", -1], ["costs", -1],
    ["avgSalary", -1], ["turnoverPct", -1], ["turnoverPct", 101],
    ["safety", -1], ["safety", 101], ["revenue", Infinity],
    ["avgSalary", NaN], ["costs", ""], ["turnoverPct", null],
    ["safety", " "], ["safety", "\t"], ["safety", true], ["safety", [41]], ["turnoverPct", " "],
    ["turnoverPct", false], ["employees", [500]], ["revenue", "1 000"],
  ])("blocks invalid %s = %s before normalization can silently replace it", (key, value) => {
    expect(validateInputs({ ...DEFAULT_PARAMS, [key]: value })).toHaveProperty(key);
  });
});
