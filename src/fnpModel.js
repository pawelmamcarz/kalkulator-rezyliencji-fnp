import { CALIBRATION_MODES, MODULE_INTERACTIONS, PL_TURNOVER_RATE_GUS } from "./logic/constants.js";

// Per-employee yearly rates for the public FNP scenario. Trivial and medium
// stay as operational noise. Major and critical are scaled to a firm of a
// few hundred people, not to every headcount. AUTHOR'S EXTENSION.
export const FNP_PROBLEM_DIST = [
  { id: "trivial", count: 8, cost: 500, lateMultiplier: 1.5, concealability: 0.6 },
  { id: "medium", count: 3, cost: 5_000, lateMultiplier: 2.5, concealability: 0.3 },
  { id: "major", count: 0.05, cost: 50_000, lateMultiplier: 3.5, concealability: 0.15 },
  { id: "critical", count: 0.006, cost: 250_000, lateMultiplier: 5.0, concealability: 0.05 },
];

// In ostrożny mode burnout already has overlap 0.75 because exits sit in
// turnover. Drop the extra burnout → turnover kick so the same people are
// not billed twice in the three-module headline.
export const FNP_MODULE_INTERACTIONS = MODULE_INTERACTIONS.filter(
  (row) => !(row.fromMetric === "burnoutRate" && row.toId === "turnover"),
);

export function fnpAnalysisParams(params) {
  const declared = Number(params.turnoverPct);
  return {
    ...params,
    problemDist: params.problemDist || FNP_PROBLEM_DIST,
    scopeMode: params.scopeMode || "conservative",
    safetySource: params.safetySource || "estimate",
    overrides: {
      ...CALIBRATION_MODES.conservative.overrides,
      MODULE_INTERACTIONS: FNP_MODULE_INTERACTIONS,
      PL_AVG_TURNOVER: PL_TURNOVER_RATE_GUS,
      ...(params.overrides || {}),
      ...(Number.isFinite(declared) ? { TURNOVER_DECLARED: Math.max(0, declared) / 100 } : {}),
    },
  };
}
