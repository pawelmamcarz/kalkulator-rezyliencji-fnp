import { describe, it, expect } from "vitest";
import { computeFullModelAnalysis, PL_AVG_SAFETY } from "./logic.js";
import { CHANNEL_COPY, splitChannel } from "./channels.js";
import { FNP_PROBLEM_DIST, fnpAnalysisParams } from "./fnpModel.js";

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

  it("declared turnover moves the continuity headline and cannot invent extra leavers", () => {
    const input = {
      revenue: 100_000_000,
      employees: 500,
      avgSalary: 90_000,
      safety: PL_AVG_SAFETY,
    };
    const high = computeFullModelAnalysis(fnpAnalysisParams({ ...input, turnoverPct: 16 }), { iterations: 20, seed: 1 });
    const low = computeFullModelAnalysis(fnpAnalysisParams({ ...input, turnoverPct: 3 }), { iterations: 20, seed: 1 });
    const highTurnover = splitChannel(high.valuation.channels.find((ch) => ch.id === "continuity")).headline;
    const lowTurnover = splitChannel(low.valuation.channels.find((ch) => ch.id === "continuity")).headline;
    expect(lowTurnover).toBeLessThan(highTurnover);
    const payroll = input.employees * input.avgSalary;
    expect(lowTurnover).toBeLessThan(payroll * 0.03 * 0.75 * 2);
  });
});
