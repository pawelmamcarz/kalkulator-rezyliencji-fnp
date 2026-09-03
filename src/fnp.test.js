import { describe, it, expect } from "vitest";
import { CALIBRATION_MODES, DEFAULT_PROBLEM_DIST, computeFullModelAnalysis, PL_AVG_SAFETY } from "./logic.js";
import { CHANNEL_COPY, splitChannel } from "./channels.js";

const FNP_DEFAULTS = {
  revenue: 100_000_000,
  employees: 500,
  avgSalary: 90_000,
  safety: PL_AVG_SAFETY,
  problemDist: DEFAULT_PROBLEM_DIST,
  safetySource: "estimate",
  scopeMode: "conservative",
  overrides: CALIBRATION_MODES.conservative.overrides,
};

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

  it("defaults to conservative headline smaller than the full 13-module total", () => {
    const cons = computeFullModelAnalysis(FNP_DEFAULTS, { iterations: 50, seed: 1 });
    const full = computeFullModelAnalysis({ ...FNP_DEFAULTS, scopeMode: "full" }, { iterations: 50, seed: 1 });
    expect(cons.costs.scopeMode).toBe("conservative");
    expect(cons.costs.totalTax).toBeLessThan(full.costs.totalTax);
    expect(cons.costs.totalTax).toBeGreaterThan(0);
  });

  it("ready valuation uses estimate source without a 7-item survey", () => {
    const analysis = computeFullModelAnalysis(FNP_DEFAULTS, { iterations: 200, seed: 1 });
    expect(analysis.valuation.ready).toBe(true);
    expect(analysis.valuation.channels).toHaveLength(5);
    expect(analysis.valuation.total.base).toBe(analysis.costs.totalTax);
  });

  it("splits headline vs pending so unvalidated modules stay off the main number", () => {
    const analysis = computeFullModelAnalysis(FNP_DEFAULTS, { iterations: 50, seed: 1 });
    const splits = analysis.valuation.channels.map(splitChannel);
    const headlineSum = splits.reduce((sum, s) => sum + s.headline, 0);
    expect(headlineSum).toBeCloseTo(analysis.costs.totalTax, 6);
    expect(splits.some((s) => s.pending > 0)).toBe(true);
  });
});
