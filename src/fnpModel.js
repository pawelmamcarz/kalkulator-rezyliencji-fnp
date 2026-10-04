import { CALIBRATION_MODES, MODULE_INTERACTIONS } from "./logic/constants.js";
import { computeFullModelAnalysis, normalizeFullModelParams } from "./logic/analysis.js";
import { computeCosts, turnoverClimateShare } from "./logic/modules.js";
import { MC_SEED_DEFAULT } from "./logic/monteCarlo.js";
import { finiteOrNull, isBlankInput } from "./logic/numbers.js";

// Per-employee yearly rates for the public FNP scenario. Trivial and medium
// stay as operational noise. Major and critical ALSO scale per FTE: at 500
// FTE they imply 25 and 3 events/year before concealment. AUTHOR'S EXTENSION.
export const FNP_PROBLEM_DIST = [
  { id: "trivial", count: 8, cost: 500, lateMultiplier: 1.5, concealability: 0.6 },
  { id: "medium", count: 3, cost: 5_000, lateMultiplier: 2.5, concealability: 0.3 },
  { id: "major", count: 0.05, cost: 50_000, lateMultiplier: 3.5, concealability: 0.15 },
  { id: "critical", count: 0.006, cost: 250_000, lateMultiplier: 5.0, concealability: 0.05 },
];

// Interaction rows FNP never bills in its headline: burnout → turnover (the
// same people would be counted in turnover and burnout; burnout already has
// overlap 0.75) and blameRate → errors (blame is already inside the
// concealment rate of the errors module). The shared engine dropped both
// from its default list; FNP keeps its own filter so the headline cannot
// regain them if that default changes.
export function withoutFnpDoubleCounts(rows) {
  return rows.filter(
    (row) => !(row.fromMetric === "burnoutRate" && row.toId === "turnover")
      && !(row.fromMetric === "blameRate" && row.toId === "errors"),
  );
}

export const FNP_MODULE_INTERACTIONS = withoutFnpDoubleCounts(MODULE_INTERACTIONS);

// Strict 0–100 input: only finite numbers or trimmed numeric strings count
// (Number(" ") === 0 and Number(true) === 1 must not become a climate or a
// turnover rate), and a value outside the scale is an error, not a clamp.
function percentInput(value, { blank, invalid, range }) {
  if (isBlankInput(value)) throw new TypeError(blank);
  const n = finiteOrNull(value);
  if (n === null) throw new TypeError(invalid);
  if (n < 0 || n > 100) throw new RangeError(range);
  return n;
}

export function fnpAnalysisParams(params) {
  // Missing inputs must not turn into extreme scenarios: a blank climate is
  // not climate 0, and there is no default turnover. The model attributes to
  // climate a share of the firm's OWN exits, so a declared rate is required.
  const safety = percentInput(params.safety, {
    blank: "Klimat (safety) jest wymagany: podaj liczbę od 0 do 100.",
    invalid: "Klimat (safety) musi być liczbą od 0 do 100.",
    range: "Klimat (safety) musi mieścić się w przedziale od 0 do 100.",
  });
  const turnoverPct = percentInput(params.turnoverPct, {
    blank: "Rotacja (turnoverPct) jest wymagana: podaj roczną rotację w procentach, od 0 do 100.",
    invalid: "Rotacja (turnoverPct) musi być liczbą od 0 do 100.",
    range: "Rotacja (turnoverPct) musi mieścić się w przedziale od 0 do 100.",
  });
  const result = {
    ...params,
    safety,
    turnoverPct,
    problemDist: params.problemDist || FNP_PROBLEM_DIST,
    scopeMode: params.scopeMode || "conservative",
    safetySource: params.safetySource || "estimate",
    overrides: {
      ...CALIBRATION_MODES.conservative.overrides,
      MODULE_INTERACTIONS: FNP_MODULE_INTERACTIONS,
      ...(params.overrides || {}),
      TURNOVER_DECLARED: turnoverPct / 100,
    },
  };
  // The leader count is not asked for; the adapter's prior (10% of FTE) is
  // set here so that computeCosts(fnpAnalysisParams(x)) gives the same
  // amounts as computeFnpAnalysis(x). It matters for the headline only
  // through the silence-type weights, which redistribute over all modules.
  return { ...result, leaders: normalizeFullModelParams(result).leaders };
}

// Common random draws make scenario comparisons reproducible. Revenue is
// only a denominator in FNP; changing it must not change the monetary band.
// MC_SEED_DEFAULT is also the engine default; passing it keeps FNP pinned.
export function computeFnpAnalysis(params, options = {}) {
  return computeFullModelAnalysis(fnpAnalysisParams(params), { seed: MC_SEED_DEFAULT, ...options });
}

// Headline amount at the same inputs with the climate 10 points lower and
// 10 points higher. A side that would leave the 0–100 scale is null (not
// clamped), so the copy never says "10 points" for a smaller step.
export const CLIMATE_SENSITIVITY_STEP = 10;

export function computeFnpClimateSensitivity(params) {
  const p = fnpAnalysisParams(params);
  // Same normalisation as computeFnpAnalysis (e.g. the leader prior), so the
  // amounts match what the calculator would show at that climate.
  const at = (safety) => (safety < 0 || safety > 100
    ? null
    : { safety, total: computeCosts(normalizeFullModelParams({ ...p, safety })).totalTax });
  return {
    step: CLIMATE_SENSITIVITY_STEP,
    lower: at(p.safety - CLIMATE_SENSITIVITY_STEP),
    higher: at(p.safety + CLIMATE_SENSITIVITY_STEP),
  };
}

// Share of the firm's exits the engine attributes to climate before the
// weight TURNOVER_CLIMATE_WEIGHT, at FNP's steepness. For copy only.
export function fnpTurnoverClimateShare(safety) {
  const k = CALIBRATION_MODES.conservative.overrides.K_SIGMOID_MULT;
  return turnoverClimateShare(safety, k);
}
