import { CALIBRATION_MODES, MODULE_INTERACTIONS, PL_TURNOVER_RATE_GUS } from "./logic/constants.js";
import { computeFullModelAnalysis } from "./logic/analysis.js";

// Per-employee yearly rates for the public FNP scenario. Trivial and medium
// stay as operational noise. Major and critical ALSO scale per FTE: at 500
// FTE they imply 25 and 3 events/year before concealment. AUTHOR'S EXTENSION.
export const FNP_PROBLEM_DIST = [
  { id: "trivial", count: 8, cost: 500, lateMultiplier: 1.5, concealability: 0.6 },
  { id: "medium", count: 3, cost: 5_000, lateMultiplier: 2.5, concealability: 0.3 },
  { id: "major", count: 0.05, cost: 50_000, lateMultiplier: 3.5, concealability: 0.15 },
  { id: "critical", count: 0.006, cost: 250_000, lateMultiplier: 5.0, concealability: 0.05 },
];

// In ostrożny mode burnout already has overlap 0.75 because exits sit in
// turnover. Drop the extra burnout → turnover kick so the same people are
// not billed twice in the three-module headline. blameRate already sits
// inside the concealment rate of the errors module, so its extra kick on
// errors is dropped for the same reason.
export const FNP_MODULE_INTERACTIONS = MODULE_INTERACTIONS.filter(
  (row) => !(row.fromMetric === "burnoutRate" && row.toId === "turnover")
    && !(row.fromMetric === "blameRate" && row.toId === "errors"),
);

const isBlank = (value) => value === undefined || value === null || value === "";

export function fnpAnalysisParams(params) {
  // Missing inputs must not turn into extreme scenarios: a blank climate is
  // not climate 0 and a blank turnover is not 0% turnover.
  if (isBlank(params.safety) || !Number.isFinite(Number(params.safety))) {
    throw new TypeError("Klimat (safety) musi być liczbą od 0 do 100.");
  }
  const blankTurnover = isBlank(params.turnoverPct);
  if (!blankTurnover && !Number.isFinite(Number(params.turnoverPct))) {
    throw new TypeError("Rotacja (turnoverPct) musi być liczbą albo pozostać pusta.");
  }
  // No declaration means the reference rate, the same as declaring it.
  const declared = blankTurnover ? PL_TURNOVER_RATE_GUS * 100 : Number(params.turnoverPct);
  return {
    ...params,
    problemDist: params.problemDist || FNP_PROBLEM_DIST,
    scopeMode: params.scopeMode || "conservative",
    safetySource: params.safetySource || "estimate",
    overrides: {
      ...CALIBRATION_MODES.conservative.overrides,
      MODULE_INTERACTIONS: FNP_MODULE_INTERACTIONS,
      SILENCE_WEIGHTS_NORMALIZED: true,
      ...(params.overrides || {}),
      TURNOVER_DECLARED: Math.max(0, declared) / 100,
    },
  };
}

// Common random draws make scenario comparisons reproducible. Revenue is
// only a denominator in FNP; changing it must not change the monetary band.
export function computeFnpAnalysis(params, options = {}) {
  return computeFullModelAnalysis(fnpAnalysisParams(params), { seed: 202636, ...options });
}
