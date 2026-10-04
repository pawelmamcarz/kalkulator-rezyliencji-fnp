import {
  METRICS, FEAR_METRICS, AVAILABILITY_MAX_BOOST, WYSIATI_PREMIUM,
  HIRSCHMAN_EXIT_AMPLIFIER, TURNOVER_CLIMATE_WEIGHT, HIERARCHY_DEPTH_MAX,
  ARGYRIS_DOUBLE_LOOP_LOW, ARGYRIS_DOUBLE_LOOP_HIGH, ARGYRIS_REVENUE_IMPACT,
  NONAKA_SPIRAL_BLOCK_LOW, NONAKA_SPIRAL_BLOCK_HIGH, NONAKA_SALARY_IMPACT,
  AGENCY_MONITORING_HIGH, AGENCY_MONITORING_LOW, AGENCY_BONDING_RATE,
  MODULE_INTERACTIONS, SILENCE_WEIGHTS,
  AUTOMATIC_SILENCE_PENALTY, AUTONOMY_PASSIVITY_DAMPER,
  K_SIGMOID_DEFAULT_MULT, LEADER_SILENCE_FREQ_MULT,
  OVERLAP_CORRECTIONS, MODULE_MATURITY, ANALYTICS_ONLY_WHEN_EXCLUDED,
} from './constants.js';
import { sigmoid, getMetricValue } from './sigmoid.js';
import {
  alphaFromSafety, alphaDown, hierarchyInfoLoss, asymmetricFiltering,
  directiveDistortion, optimalSpan, spanEfficiencyGap, governancePenalty,
  estimateLevelsExact,
} from './williamson.js';
import { silenceDecomposition } from './silence.js';
import { computeWeightedProblemCost, computeTotalProblems } from './problems.js';
import { finiteOrNull, finiteOr, isBlankInput } from './numbers.js';

export const MODULE_IDS = Object.freeze([
  "errors", "innovation", "turnover", "burnout", "passivity", "help", "leader",
  "compliance", "hierarchy", "governance", "learningDeficit", "knowledgeLoss",
  "agencyOverhead",
]);

// Psychological safety drives every module, so a missing or non-numeric value
// must not be silently computed as some climate (it used to become NaN here
// and 0, the most expensive climate, in the UI adapter). Values outside the
// 0–100 scale are clamped to it: the curves are only defined on that scale.
// This clamp is the one the engine keeps for its callers (the ST planner
// lifts and the demo slider rely on it); the FNP API rejects out-of-range
// values before they reach the engine.
export function resolveSafety(value) {
  const n = finiteOrNull(value);
  if (n === null) {
    throw new RangeError("computeCosts: safety must be a finite number on the 0–100 scale");
  }
  return Math.max(0, Math.min(100, n));
}

// ── Override validation ──
// Every override the engine reads, with the range in which the formula is
// meaningful. A null, NaN, string or out-of-range value used to fall back to
// the default silently (K_SIGMOID_MULT: null gave 0.4) or poison the total
// (NaN). Now it throws, as does an unknown key (a typo would otherwise be
// ignored). `undefined` counts as "not given".
const SCALAR_OVERRIDES = {
  K_SIGMOID_MULT: { min: 0, max: 5, minExclusive: true },
  OVERLAP_GLOBAL: { min: 0, max: 10 },
  WYSIATI_PREMIUM: { min: 0, max: 5 },
  HIRSCHMAN_EXIT_AMPLIFIER: { min: 0, max: 5 },
  ARGYRIS_REVENUE_IMPACT: { min: 0, max: 1 },
  NONAKA_SALARY_IMPACT: { min: 0, max: 1 },
  AUTONOMY_PASSIVITY_DAMPER: { min: 0, max: 1 },
  AGENCY_MONITORING_HIGH: { min: 0, max: 1 },
  LEADER_SILENCE_FREQ_MULT: { min: 0, max: 10 },
  AUTOMATIC_SILENCE_PENALTY: { min: 0, max: 5 },
  TURNOVER_DECLARED: { min: 0, max: 1 },
  TURNOVER_CLIMATE_WEIGHT: { min: 0, max: 1 },
};

function checkNumber(name, value, { min, max, minExclusive = false }) {
  const ok = typeof value === "number" && Number.isFinite(value)
    && (minExclusive ? value > min : value >= min) && value <= max;
  if (!ok) {
    throw new RangeError(`overrides.${name} must be a finite number in ${minExclusive ? "(" : "["}${min}, ${max}], got ${String(value)}`);
  }
}

export function validateOverrides(overrides) {
  if (overrides === undefined || overrides === null) return {};
  if (typeof overrides !== "object" || Array.isArray(overrides)) {
    throw new TypeError("overrides must be an object");
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) continue;
    if (SCALAR_OVERRIDES[key]) {
      checkNumber(key, value, SCALAR_OVERRIDES[key]);
    } else if (key === "OVERLAP_CORRECTIONS") {
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("overrides.OVERLAP_CORRECTIONS must be an object");
      for (const [id, factor] of Object.entries(value)) {
        if (!MODULE_IDS.includes(id)) throw new RangeError(`overrides.OVERLAP_CORRECTIONS: unknown module ${id}`);
        checkNumber(`OVERLAP_CORRECTIONS.${id}`, factor, { min: 0, max: 10 });
      }
    } else if (key === "MODULE_INTERACTIONS") {
      if (!Array.isArray(value)) throw new TypeError("overrides.MODULE_INTERACTIONS must be an array");
      value.forEach((row, index) => {
        if (!row || !METRICS[row.fromMetric] || !MODULE_IDS.includes(row.toId)) {
          throw new RangeError(`overrides.MODULE_INTERACTIONS[${index}] needs a known fromMetric and toId`);
        }
        checkNumber(`MODULE_INTERACTIONS[${index}].w`, row.w, { min: 0, max: 10 });
      });
    } else {
      throw new RangeError(`Unknown override: ${key}`);
    }
  }
  return overrides;
}

// Firm-level structure used by every module: hierarchy depth (continuous,
// bounded by HIERARCHY_DEPTH_MAX) and the headcount that sizes governance.
// Segments reuse the firm's structure instead of re-estimating it from their
// own size (organisation-level parameters apply uniformly).
// hierarchyLevels / spanOfControl: missing or 0 means "not provided" (span 7,
// depth estimated from headcount); anything else must be a finite number,
// depth at least 1 and span at least 0.
export function resolveOrganization(params) {
  const employees = Math.max(0, finiteOr(params.employees, 0));
  const spanBlank = isBlankInput(params.spanOfControl);
  const spanN = spanBlank ? null : finiteOrNull(params.spanOfControl);
  if (!spanBlank && (spanN === null || spanN < 0)) {
    throw new RangeError("spanOfControl must be a finite number of at least 0 (0 or empty: not provided)");
  }
  const span = spanN ? spanN : 7;
  const levelsBlank = isBlankInput(params.hierarchyLevels);
  const levelsN = levelsBlank ? null : finiteOrNull(params.hierarchyLevels);
  if (!levelsBlank && (levelsN === null || (levelsN !== 0 && levelsN < 1))) {
    throw new RangeError("hierarchyLevels must be a finite number of at least 1 (0 or empty: estimate from headcount)");
  }
  const declared = levelsN ? levelsN : null;
  const depthRaw = declared ?? estimateLevelsExact(employees, span);
  return {
    employees,
    span,
    depthRaw,
    depth: Math.min(depthRaw, HIERARCHY_DEPTH_MAX),
    depthCapped: depthRaw > HIERARCHY_DEPTH_MAX,
    depthDeclared: declared !== null,
  };
}

// Model metric value on the module path: K multiplier, fear-metric shift and,
// for fear metrics, the recent-trauma boost. Every consumer (modules, voice
// block, interaction severity) reads metrics through this one path.
export function moduleMetricValue(key, safety, kMult, trauma = 0) {
  const v = getMetricValue(key, safety, kMult);
  if (trauma > 0 && FEAR_METRICS.has(key)) {
    const m = METRICS[key];
    return m.positive ? v : Math.min(m.low, v * (1 + AVAILABILITY_MAX_BOOST * trauma));
  }
  return v;
}

// Normalised severity 0–1 of a metric value against the curve's own range at
// the same K (0 at s = 100, 1 at s = 0).
function severityOf(key, value, kMult) {
  const m = METRICS[key];
  const vBest = getMetricValue(key, 100, kMult);
  const vWorst = getMetricValue(key, 0, kMult);
  const range = Math.abs(vWorst - vBest);
  if (range < 0.001) return 0;
  const raw = m.positive ? (vBest - value) / range : (value - vBest) / range;
  return Math.max(0, Math.min(1, raw));
}

// Share-weighted silence-type weight of one module (no normalisation).
export function silenceMixWeight(w, { defensive, acquiescent, prosocial }) {
  return defensive * w.def + acquiescent * w.acq + prosocial * w.pro;
}

// Silence-type multipliers for a list of {id, value} components. Each
// weighted module gets its mix weight times a common factor chosen so that
// the cost-weighted mean multiplier over the weighted modules is exactly 1:
// sum(value × multiplier) = sum(value). The weights therefore only move cost
// between modules. `groupOf` (optional) splits the modules into groups that
// are normalised separately; computeCosts groups by headline scope, so the
// headline and the excluded remainder each keep their sum. Modules without a
// weight get 1.
export function silenceWeightMultipliers(components, shares, groupOf = () => "all") {
  const sums = new Map();
  for (const c of components) {
    const w = SILENCE_WEIGHTS[c.id];
    if (!w) continue;
    const g = groupOf(c);
    const acc = sums.get(g) || { cost: 0, weighted: 0 };
    acc.cost += c.value;
    acc.weighted += c.value * silenceMixWeight(w, shares);
    sums.set(g, acc);
  }
  return Object.fromEntries(components.map((c) => {
    const w = SILENCE_WEIGHTS[c.id];
    if (!w) return [c.id, 1];
    const { cost, weighted } = sums.get(groupOf(c));
    return [c.id, silenceMixWeight(w, shares) * (weighted > 0 ? cost / weighted : 1)];
  }));
}

// Climate-driven annual churn rate used by the turnover module:
// (1 - teamStability(s)) × 0.4 - 0.015, floored at 0. AUTHOR'S EXTENSION
// (0.4 and 0.015 are priors). Not compared with any national average.
export function climateChurnRate(safety, kMult = K_SIGMOID_DEFAULT_MULT, stability = null) {
  const stab = stability ?? getMetricValue("teamStability", safety, kMult);
  return Math.max(0, (1 - stab) * 0.4 - 0.015);
}

// Share of exits the model attributes to climate on the declared-turnover
// path: the part of the model's churn curve above its s = 100 value,
// 1 − churn(100) / churn(s), 0 when churn(s) is 0. Zero at s = 100 by
// construction. Exported so UI copy can quote the engine's share.
export function turnoverClimateShare(safety, kMult = K_SIGMOID_DEFAULT_MULT, stability = null) {
  const churn = climateChurnRate(safety, kMult, stability);
  if (!(churn > 0)) return 0;
  return Math.max(0, 1 - climateChurnRate(100, kMult) / churn);
}

function _rawModules(safety, ctx) {
  // AUTHOR'S EXTENSION: unless resolved from an imported named constant, every
  // numeric conversion in this function is a structural prior. The cited
  // theories justify mechanisms and directions, not monetary magnitudes.
  const { revenue, employees, avgSalary, leaders, dist, org, trauma, autonomy, O, kMult } = ctx;
  const levels = org.depth;
  const WYSIATI = O.WYSIATI_PREMIUM ?? WYSIATI_PREMIUM;
  const HIRSCHMAN = O.HIRSCHMAN_EXIT_AMPLIFIER ?? HIRSCHMAN_EXIT_AMPLIFIER;
  const ARGYRIS = O.ARGYRIS_REVENUE_IMPACT ?? ARGYRIS_REVENUE_IMPACT;
  const NONAKA = O.NONAKA_SALARY_IMPACT ?? NONAKA_SALARY_IMPACT;
  const AUTONOMY_DAMPER = O.AUTONOMY_PASSIVITY_DAMPER ?? AUTONOMY_PASSIVITY_DAMPER;
  const AGENCY_MON_HI = O.AGENCY_MONITORING_HIGH ?? AGENCY_MONITORING_HIGH;

  // Leaders are a subset of employees: more leaders than people is not a
  // physical organization, and the leader module is linear in the count.
  const nLeaders = Math.min(Math.max(0, leaders), employees);
  const autonomyClamped = autonomy;
  const mv = (key) => moduleMetricValue(key, safety, kMult, trauma);

  const blameR = mv("blameRate");
  const errorFearR = mv("errorFear");
  const baseFear = errorFearR * (0.3 + 0.7 * blameR);
  const baseFearEff = baseFear * (1 + 0.3 * baseFear);
  let errorConcealmentCost = 0;
  let hiddenErrors = 0;
  for (const d of dist) {
    // Clamp to 1: hideRate is the fraction of errors concealed, so it cannot
    // exceed 1. With the current METRICS endpoints baseFearEff stays below
    // about 0.68, so the clamp only binds for concealability above about 1.47
    // (an invalid input); it is a guard, not an active cap.
    const hideRate = Math.min(1, baseFearEff * (d.concealability ?? 0.3));
    const hiddenInCat = employees * (d.count || 0) * hideRate;
    hiddenErrors += hiddenInCat;
    errorConcealmentCost += hiddenInCat * (d.cost || 0) * ((d.lateMultiplier || 1) - 1);
  }

  const ideaSilR = mv("ideaSilence");
  const riskAvR = mv("riskAversion");
  const innovationLoss = revenue * 0.03 * (ideaSilR * 0.6 + riskAvR * 0.4); // AUTHOR'S EXTENSION

  // Voice block from the same metric path as the modules (trauma included).
  const voiceBlock = severityOf("ideaSilence", mv("ideaSilence"), kMult) * 0.5
    + severityOf("destructiveFear", mv("destructiveFear"), kMult) * 0.5;
  const stabilityR = mv("teamStability");
  let leaverRate;
  if (O.TURNOVER_DECLARED !== undefined) {
    // Declared path (FNP): a share of the firm's own exits, proportional to
    // the declared rate. Zero at s = 100 because the share is zero there, so
    // the s = 100 baseline subtracted below is exactly 0 and leaves no
    // Hirschman remnant. AUTHOR'S EXTENSION (TURNOVER_CLIMATE_WEIGHT).
    const weight = O.TURNOVER_CLIMATE_WEIGHT ?? TURNOVER_CLIMATE_WEIGHT;
    leaverRate = O.TURNOVER_DECLARED * weight * turnoverClimateShare(safety, kMult, stabilityR);
  } else {
    // Undeclared path (Silence Tax): the model's own churn; the s = 100 churn
    // is subtracted as the baseline below.
    leaverRate = climateChurnRate(safety, kMult, stabilityR);
  }
  const turnoverCost = employees * leaverRate * avgSalary * 0.75 // AUTHOR'S EXTENSION
    * (1 + HIRSCHMAN * voiceBlock);

  const burnoutR = mv("burnoutRate");
  const burnoutEff = burnoutR * (1 + 0.5 * burnoutR);
  const burnoutCost = employees * burnoutEff * avgSalary * 0.25; // AUTHOR'S EXTENSION

  const passivR = mv("passivity");
  const snitchR = mv("snitchPerc");
  const passivEff = passivR * (1 + 0.4 * passivR);
  const hourlyRate = avgSalary / 230 / 8;
  const passivityCost = employees * 0.05 * passivEff * hourlyRate * 8 * 230 * (1 + snitchR)
    * (1 - AUTONOMY_DAMPER * autonomyClamped); // Adamska (2015): autonomy reduces passivity

  const helpR = mv("helpComfort");
  const avgProblemCost = computeWeightedProblemCost(dist);
  const helpDeficitCost = employees * (1 - helpR) * 2 * avgProblemCost * 0.5; // AUTHOR'S EXTENSION

  const destructFear = mv("destructiveFear");
  // AUTHOR'S EXTENSION: frequency multiplier tuned for face validity against
  // the dissertation scenario in §4.2.1 (5M PLN przy s=41,
  // 100 liderów × 150K/epizod = 0.33 epizodu/lider/rok; destructFear ≈ 0.52
  // → mnożnik 0.6). Zastąpiony default 2.5 (4× za wysoki vs rozprawa).
  const leaderSilenceFreqMult = O.LEADER_SILENCE_FREQ_MULT ?? LEADER_SILENCE_FREQ_MULT;
  const leaderSilenceFreq = destructFear * leaderSilenceFreqMult;
  const leaderSilenceCost = nLeaders * leaderSilenceFreq * 150_000; // AUTHOR'S EXTENSION

  const complianceRiskCost = revenue * 0.005 * (1 - mv("procedureUse")); // AUTHOR'S EXTENSION

  // ── Williamson hierarchy module - HEURISTIC, not direct measurement ──
  // Williamson's α^n is a fidelity coefficient (probability in [0,1]). It is
  // dimensionally NOT a wage multiplier. The two scalars below - 0.005 of
  // revenue (bottom-up) and 0.15 of payroll × 0.20 distortion (top-down) -
  // carry the actual magnitude. They are author-assigned conversions from
  // information-fidelity loss to złoty. Treat the result as a Williamson-
  // INSPIRED estimate of the cost channel's order of magnitude, not as an
  // empirically calibrated price tag on lost signal.
  const filtering = asymmetricFiltering(levels, safety);
  const infoLoss = hierarchyInfoLoss(levels, safety);
  const bottomUpCost = revenue * 0.005 * infoLoss * (1 - filtering.badNewsReaching) * (1 + WYSIATI);

  const dirLoss = directiveDistortion(levels, safety);
  const topDownCost = employees * 0.15 * avgSalary * dirLoss * 0.20;

  // Akerlof adverse-selection premium was retired post-audit (redundant with
  // the alpha^n information-loss channel), see rozprawa section 4.2.3a.
  const hierarchyLossCost = bottomUpCost + topDownCost;

  const govPenalty = governancePenalty(org.employees, levels);
  const safetyGovReduction = sigmoid(safety, 0.2, 0.8);
  const bureaucraticOverhead = employees * avgSalary * 0.02 * Math.max(0, govPenalty - 1) * (1 - safetyGovReduction); // AUTHOR'S EXTENSION

  const opportunismRate = sigmoid(safety, 0.25, 0.03);
  const opportunismCost = employees * opportunismRate * avgSalary * 0.05; // AUTHOR'S EXTENSION

  const spanGap = spanEfficiencyGap(org.span, safety);
  const spanCost = spanGap > 0 ? employees * avgSalary * 0.01 * spanGap * levels : 0; // AUTHOR'S EXTENSION

  const governanceOverhead = bureaucraticOverhead + opportunismCost + spanCost;

  const doubleLoopRate = sigmoid(safety, ARGYRIS_DOUBLE_LOOP_LOW, ARGYRIS_DOUBLE_LOOP_HIGH);
  const learningDeficitCost = revenue * ARGYRIS * (1 - doubleLoopRate);

  const spiralBlock = sigmoid(safety, NONAKA_SPIRAL_BLOCK_LOW, NONAKA_SPIRAL_BLOCK_HIGH);
  const knowledgeLossCost = employees * avgSalary * NONAKA * spiralBlock;

  const monitoringRate = sigmoid(safety, AGENCY_MON_HI, AGENCY_MONITORING_LOW);
  const bondingCost = employees * avgSalary * AGENCY_BONDING_RATE * (1 - safety / 100);
  const agencyOverheadCost = employees * avgSalary * monitoringRate * 0.15 + bondingCost;

  // ── Overlap correction (DECORRELATION) ──
  // The 13 modules share variance - see OVERLAP_CORRECTIONS in constants.js
  // for the per-module factors and rationale. Applied here so excess()
  // (safety vs safety=100 baseline) consistently nets the correction out.
  // OVERLAP_GLOBAL is a scalar multiplier on the entire correction matrix,
  // exposed via overrides for sensitivity analysis (DK-5 audit).
  // A partial override replaces only the keys it names. Previously a partial
  // object silently reset every unnamed module to 1 (e.g. learningDeficit
  // from 0.40 to 1).
  const oc = { ...OVERLAP_CORRECTIONS, ...(O.OVERLAP_CORRECTIONS || {}) };
  const og = O.OVERLAP_GLOBAL ?? 1;
  return {
    errorConcealmentCost: errorConcealmentCost * (oc.errors ?? 1) * og,
    hiddenErrors,
    innovationLoss:       innovationLoss       * (oc.innovation ?? 1) * og,
    turnoverCost:         turnoverCost         * (oc.turnover ?? 1) * og,
    burnoutCost:          burnoutCost          * (oc.burnout ?? 1) * og,
    passivityCost:        passivityCost        * (oc.passivity ?? 1) * og,
    helpDeficitCost:      helpDeficitCost      * (oc.help ?? 1) * og,
    leaderSilenceCost:    leaderSilenceCost    * (oc.leader ?? 1) * og,
    complianceRiskCost:   complianceRiskCost   * (oc.compliance ?? 1) * og,
    hierarchyLossCost:    hierarchyLossCost    * (oc.hierarchy ?? 1) * og,
    governanceOverhead:   governanceOverhead   * (oc.governance ?? 1) * og,
    learningDeficitCost:  learningDeficitCost  * (oc.learningDeficit ?? 1) * og,
    knowledgeLossCost:    knowledgeLossCost    * (oc.knowledgeLoss ?? 1) * og,
    agencyOverheadCost:   agencyOverheadCost   * (oc.agencyOverhead ?? 1) * og,
  };
}

export function computeCosts(params) {
  // Team-segment mode (Edmondson 1999 is a team-level construct; firm-wide
  // BP averages underestimate cost when inter-team variance is high due to
  // Jensen's inequality on convex cost functions). When the user supplies
  // `teamSegments`, we compute costs per segment and sum. Each segment is
  // treated as a sub-organization that inherits all company parameters,
  // including the firm's hierarchy depth and governance size, EXCEPT
  // employees/revenue/leaders/safety, which are scaled to segment size.
  if (!params || typeof params !== "object") throw new TypeError("computeCosts requires a params object");
  validateOverrides(params.overrides);
  if (Array.isArray(params.teamSegments) && params.teamSegments.length > 0) {
    return _computeCostsSegmented(params);
  }
  return _computeCostsAggregate(params, resolveOrganization(params));
}

function requireAmount(params, key) {
  const n = finiteOrNull(params[key]);
  if (n === null || n < 0) {
    throw new RangeError(`computeCosts: ${key} must be a finite number of at least 0`);
  }
  return n;
}

function _computeCostsAggregate(rawParams, org) {
  const safety = resolveSafety(rawParams.safety);
  const params = { ...rawParams, safety };
  const O = params.overrides || {};
  // Multiplier on the sigmoid shape parameter `k` of every METRIC (not the
  // Williamson, governance, Argyris, Nonaka or agency curves). Default
  // K_SIGMOID_DEFAULT_MULT (0.4) is an author's choice, see constants.js.
  const kMult = O.K_SIGMOID_MULT ?? K_SIGMOID_DEFAULT_MULT;
  const employees = requireAmount(params, "employees");
  const ctx = {
    revenue: requireAmount(params, "revenue"),
    employees,
    avgSalary: requireAmount(params, "avgSalary"),
    leaders: finiteOr(params.leaders, 0),
    dist: Array.isArray(params.problemDist) ? params.problemDist : [],
    org,
    trauma: Math.max(0, Math.min(1, finiteOr(params.recentTrauma, 0))),
    autonomy: Math.max(0, Math.min(1, finiteOr(params.autonomy, 0.5))),
    O,
    kMult,
  };
  const levels = org.depth;
  const dist = ctx.dist;

  const at = _rawModules(safety, ctx);
  const base = _rawModules(100, ctx);

  const excess = (key) => Math.max(0, at[key] - base[key]);

  const errorConcealmentCost = excess("errorConcealmentCost");
  const innovationLoss       = excess("innovationLoss");
  const turnoverCost         = excess("turnoverCost");
  const burnoutCost          = excess("burnoutCost");
  const passivityCost        = excess("passivityCost");
  const helpDeficitCost      = excess("helpDeficitCost");
  const leaderSilenceCost    = excess("leaderSilenceCost");
  const complianceRiskCost   = excess("complianceRiskCost");
  const hierarchyLossCost    = excess("hierarchyLossCost");
  const governanceOverhead   = excess("governanceOverhead");
  const learningDeficitCost  = excess("learningDeficitCost");
  const knowledgeLossCost    = excess("knowledgeLossCost");
  const agencyOverheadCost   = excess("agencyOverheadCost");
  const hiddenErrors         = excess("hiddenErrors");

  const filtering = asymmetricFiltering(levels, safety);
  const infoLoss  = hierarchyInfoLoss(levels, safety);
  const dirLoss   = directiveDistortion(levels, safety);
  const govPenalty = governancePenalty(org.employees, levels);
  const sOpt       = optimalSpan(safety);
  const actualSpan = org.span;
  const spanGap    = spanEfficiencyGap(actualSpan, safety);
  const opportunismRate = sigmoid(safety, 0.25, 0.03);
  // Depth is continuous in the cost path; whole levels are for display only.
  const levelsShown = Math.round(levels);

  // Legacy field name: confidenceTier ranks support for the mechanism, not
  // confidence in the monetary amount. A means a comparatively direct
  // mechanism/construct anchor, B a related proxy, and C a theory-inspired
  // hypothesis. Every monetary conversion below still contains author priors.
  const components = [
    { id: "errors",     confidenceTier: "A", label: "Ukrywanie błędów",                labelEn: "Error concealment",           value: errorConcealmentCost, icon: "🚨", color: "#dc2626" },
    { id: "innovation", confidenceTier: "B", label: "Utrata innowacyjności",           labelEn: "Innovation loss",             value: innovationLoss,       icon: "💡", color: "#ea580c" },
    { id: "turnover",   confidenceTier: "A", label: "Nadmierna rotacja",               labelEn: "Excess turnover",             value: turnoverCost,         icon: "🚪", color: "#d97706" },
    { id: "burnout",    confidenceTier: "A", label: "Wypalenie / presenteeism",        labelEn: "Burnout / presenteeism",      value: burnoutCost,          icon: "🔥", color: "#b91c1c" },
    { id: "passivity",  confidenceTier: "B", label: "Bierność i silosy",               labelEn: "Passivity & silos",           value: passivityCost,        icon: "🤐", color: "#9333ea" },
    { id: "help",       confidenceTier: "B", label: "Deficyt proszenia o pomoc",       labelEn: "Help-seeking deficit",        value: helpDeficitCost,      icon: "🆘", color: "#0284c7" },
    { id: "leader",     confidenceTier: "C", label: "Milczenie liderów",               labelEn: "Leader silence",              value: leaderSilenceCost,    icon: "👔", color: "#be185d" },
    { id: "compliance", confidenceTier: "B", label: "Ślepota proceduralna",            labelEn: "Procedure blindness",         value: complianceRiskCost,   icon: "📋", color: "#475569" },
    { id: "hierarchy",  confidenceTier: "C", label: "Straty kontroli Williamson",        labelEn: "Williamson control loss",     value: hierarchyLossCost,    icon: "🏢", color: "#7c3aed",
      sub: `α↑=${alphaFromSafety(safety).toFixed(2)} α↓=${alphaDown(safety).toFixed(2)}, ${levelsShown}L, info↑${(infoLoss * 100).toFixed(0)}% dir↓${(dirLoss * 100).toFixed(0)}%` },
    { id: "governance", confidenceTier: "B", label: "Governance + oportunizm (TCE)",   labelEn: "Governance + opportunism (TCE)", value: governanceOverhead, icon: "⚖️", color: "#0e7490",
      sub: `penalty=${govPenalty.toFixed(1)}x, s*=${sOpt} vs s=${actualSpan}, opp=${(opportunismRate * 100).toFixed(0)}%` },
    { id: "learningDeficit", confidenceTier: "C", label: "Deficyt uczenia się (Argyris)",  labelEn: "Learning deficit (Argyris)",        value: learningDeficitCost,  icon: "🔄", color: "#059669" },
    { id: "knowledgeLoss",   confidenceTier: "C", label: "Blokada spirali wiedzy (Nonaka)", labelEn: "Knowledge spiral block (Nonaka)",   value: knowledgeLossCost,    icon: "🧠", color: "#6366f1" },
    { id: "agencyOverhead",  confidenceTier: "C", label: "Koszty agencji (Jensen-Meckling)", labelEn: "Agency overhead (Jensen-Meckling)", value: agencyOverheadCost,   icon: "🔍", color: "#a21caf" },
  ];

  // Interactions (AUTHOR'S EXTENSION): each row multiplies its target module
  // by (1 + w × severity). Severity reads the source metric through the same
  // path as the modules (moduleMetricValue: K, fear shift, trauma). There is
  // no cutoff: the former `sev <= 0.01` skip made the total jump where the
  // severity crossed 0.01. Amplifications are computed from the
  // pre-interaction values and applied in batch, so the order of the rows
  // does not matter.
  const interactionEffects = [];
  const baseValues = new Map(components.map(c => [c.id, c.value]));
  const amplifications = new Map();
  const interactions = O.MODULE_INTERACTIONS ?? MODULE_INTERACTIONS;
  for (const { fromMetric, toId, w } of interactions) {
    const sev = severityOf(fromMetric, moduleMetricValue(fromMetric, safety, kMult, ctx.trauma), kMult);
    const baseValue = baseValues.get(toId);
    if (baseValue === undefined || !(sev > 0)) continue;
    const amp = baseValue * w * sev;
    amplifications.set(toId, (amplifications.get(toId) || 0) + amp);
    interactionEffects.push({ from: fromMetric, to: toId, sev: sev.toFixed(2), amp });
  }
  for (const comp of components) {
    const totalAmp = amplifications.get(comp.id);
    if (totalAmp) comp.value += totalAmp;
  }

  // Scope is decided before the silence-type weights so that they can be
  // normalised within it (see below).
  const scopeMode = params.scopeMode || "full";
  const inScope = (c) => scopeMode === "full" || MODULE_MATURITY[c.id] === "validated";

  // Silence-type weights redistribute cost between modules: the common factor
  // in silenceWeightMultipliers keeps the sum of each group unchanged. The
  // groups are the headline modules and the excluded ones. In the default
  // 'full' scope that is one group of all 13 modules; in 'conservative'
  // scope the headline (errors, turnover, burnout) keeps its sum, so the
  // weights cannot raise or lower it and the excluded modules (which depend
  // on revenue and on the leader count) cannot leak into it.
  const silence = silenceDecomposition(safety, ctx.autonomy);
  const silenceTotal = silence.defensive + silence.acquiescent + silence.prosocial;
  const silenceShares = silenceTotal > 0.01 ? {
    defensive: silence.defensive / silenceTotal,
    acquiescent: silence.acquiescent / silenceTotal,
    prosocial: silence.prosocial / silenceTotal,
  } : null;
  if (silenceShares) {
    const multipliers = silenceWeightMultipliers(components, silenceShares, (c) => (inScope(c) ? "headline" : "excluded"));
    for (const comp of components) {
      comp.value *= multipliers[comp.id];
      // Exposed for transparency: the factor this run applied to the module.
      comp.silenceMultiplier = multipliers[comp.id];
    }
  }

  // Adamska (2016): automatic silence harder to address → penalty - AUTHOR'S EXTENSION
  const autoSilencePenalty = O.AUTOMATIC_SILENCE_PENALTY ?? AUTOMATIC_SILENCE_PENALTY;
  if (silence.automaticShare > 0.01) {
    for (const comp of components) {
      comp.value *= (1 + autoSilencePenalty * silence.automaticShare);
    }
  }

  const sumBeforePeak = components.reduce((s, c) => s + c.value, 0);
  // Flag the largest cost module (isPeak) for callers that want to highlight
  // it. Nothing is added to the total here.
  const peakModule = components.reduce((max, c) => c.value > max.value ? c : max, components[0]);
  if (peakModule && peakModule.value > 0) peakModule.isPeak = true;

  // ── Maturity / scope layer (AUTHOR'S EXTENSION) ──
  // scopeMode 'full' (default) keeps every module in the headline.
  // 'conservative' keeps only `validated` modules in the headline; beta and
  // experimental are surfaced separately as "potential after validation".
  for (const c of components) {
    c.maturity = MODULE_MATURITY[c.id] || "experimental";
    c.inHeadline = inScope(c);
    c.analyticsOnly = !c.inHeadline && ANALYTICS_ONLY_WHEN_EXCLUDED.has(c.id);
  }

  const totalTax = components.reduce((s, c) => s + (c.inHeadline ? c.value : 0), 0);
  const totalTaxFull = components.reduce((s, c) => s + c.value, 0);
  const betaPotential = components.reduce((s, c) => s + (!c.inHeadline && c.maturity === "beta" ? c.value : 0), 0);
  const experimentalPotential = components.reduce((s, c) => s + (!c.inHeadline && c.maturity === "experimental" ? c.value : 0), 0);

  const coaseBoundaryRatio = ctx.revenue > 0 ? totalTax / (ctx.revenue * 0.05) : 0;

  // Decomposition of safety's effect on the full sum: structural (Williamson
  // α^n) channel vs behavioral (sigmoid metrics) channel.
  const hierarchyComp = components.find(c => c.id === "hierarchy");
  const viaAlpha = hierarchyComp ? hierarchyComp.value : 0;
  const viaInteractions = interactionEffects.reduce((s, e) => s + e.amp, 0);
  const viaDirectMetrics = Math.max(0, sumBeforePeak - viaAlpha - viaInteractions);

  return {
    components, totalTax, hiddenErrors, totalProblems: employees * computeTotalProblems(dist),
    scopeMode, totalTaxFull, betaPotential, experimentalPotential,
    coaseBoundaryRatio,
    peakModule: peakModule?.id,
    decomposition: {
      viaAlpha,
      viaDirectMetrics,
      viaInteractions,
      viaPeakEnd: 0,
    },
    silenceShares: silenceShares || { defensive: 1 / 3, acquiescent: 1 / 3, prosocial: 1 / 3 },
    hierarchyAnalytics: {
      // `levels` is the rounded depth for display; the cost path used
      // `levelsExact`. `levelsCapped` is true when the declared or estimated
      // depth exceeded HIERARCHY_DEPTH_MAX and was costed at the bound.
      levels: levelsShown, levelsExact: levels, levelsRequested: org.depthRaw, levelsCapped: org.depthCapped,
      alphaUp: alphaFromSafety(safety), alphaDown: alphaDown(safety),
      infoLoss, directiveLoss: dirLoss, filtering, govPenalty,
      optimalSpan: sOpt, actualSpan, spanGap, opportunismRate,
    },
    silenceTypes: silence,
    mechanismDimension: { automaticShare: silence.automaticShare, tacticalShare: silence.tacticalShare },
    interactionEffects,
    segmentMode: false,
  };
}

// Normalize teamSegments: compute each segment's headcount and scale the
// whole distribution so that the segment headcounts sum exactly to
// params.employees. Headcount stays fractional: rounding each segment
// (the former Math.max(1, Math.round(...))) did not preserve the firm's
// headcount (three equal segments of a 10-person firm counted 9 people, of a
// 2-person firm 3). Users can define segments as "teams × avg size" without
// balancing them to the company headcount.
export function normalizeTeamSegments(segments, totalEmployees) {
  if (!Array.isArray(segments) || segments.length === 0) return [];
  const total = finiteOr(totalEmployees, 0);
  const enriched = segments.map((seg, i) => {
    const count = Math.max(0, finiteOr(seg.count, 0));
    const avgSize = Math.max(0, finiteOr(seg.avgSize, 0));
    return {
      id: seg.id ?? `seg_${i}`,
      label: seg.label ?? `Segment ${i + 1}`,
      // Safety 0 is honoured; a missing score is an error, the same as for
      // the whole-firm path.
      safety: resolveSafety(seg.safety),
      count,
      avgSize,
      rawEmployees: count * avgSize,
    };
  // A segment with no people is dropped.
  }).filter((seg) => seg.rawEmployees > 0);
  const sumRaw = enriched.reduce((s, seg) => s + seg.rawEmployees, 0);
  if (sumRaw <= 0 || total <= 0) return [];
  const scale = total / sumRaw;
  return enriched.map(seg => ({
    id: seg.id,
    label: seg.label,
    safety: seg.safety,
    count: seg.count,
    avgSize: seg.avgSize,
    employees: seg.rawEmployees * scale,
  }));
}

function _computeCostsSegmented(params) {
  const segments = normalizeTeamSegments(params.teamSegments, params.employees);
  const org = resolveOrganization(params);
  if (segments.length === 0) return _computeCostsAggregate(params, org);

  const firmEmployees = org.employees;
  const firmRevenue = requireAmount(params, "revenue");
  const firmLeaders = Math.min(Math.max(0, finiteOr(params.leaders, 0)), firmEmployees);
  const weightedAvgSafety = segments.reduce((s, seg) => s + seg.safety * seg.employees, 0) / firmEmployees;

  // Each segment is a sub-company: headcount, revenue and leaders are its
  // share of the firm's (fractional, so they sum exactly to the firm's).
  // Depth and governance size stay at the firm's values (`org`), so
  // splitting a firm into identical segments reproduces the aggregate.
  // problemDist counts are per-employee rates and are not rescaled.
  const segmentInputs = segments.map(seg => {
    const share = seg.employees / firmEmployees;
    return {
      seg,
      revenue: firmRevenue * share,
      leaders: firmLeaders * share,
    };
  });
  const segmentResults = segmentInputs.map(({ seg, revenue, leaders }) => _computeCostsAggregate({
    ...params,
    safety: seg.safety,
    employees: seg.employees,
    revenue,
    leaders,
    teamSegments: null,
  }, org));

  // Aggregate 13 component values across segments (sum in PLN). Preserve
  // display metadata from the first segment's components (label, icon, color).
  const template = segmentResults[0].components;
  const components = template.map(templateComp => {
    const aggValue = segmentResults.reduce((s, r) => {
      const match = r.components.find(c => c.id === templateComp.id);
      return s + (match ? match.value : 0);
    }, 0);
    // Per-segment silence multipliers differ, so none is reported here.
    return { ...templateComp, value: aggValue, isPeak: false, silenceMultiplier: undefined };
  });

  const peakModule = components.reduce((max, c) => c.value > max.value ? c : max, components[0]);
  if (peakModule && peakModule.value > 0) peakModule.isPeak = true;

  const totalTax = components.reduce((s, c) => s + (c.inHeadline !== false ? c.value : 0), 0);
  const totalTaxFull = components.reduce((s, c) => s + c.value, 0);
  const betaPotential = components.reduce((s, c) => s + (c.inHeadline === false && c.maturity === "beta" ? c.value : 0), 0);
  const experimentalPotential = components.reduce((s, c) => s + (c.inHeadline === false && c.maturity === "experimental" ? c.value : 0), 0);
  const hiddenErrors = segmentResults.reduce((s, r) => s + (r.hiddenErrors || 0), 0);

  // Analytics fields use an aggregate call at the weighted-average safety.
  // Display only (hierarchy α, silence shares, span gap); it does NOT
  // contribute to the cost number, which comes from the segment sum above.
  const analyticsView = _computeCostsAggregate({
    ...params,
    safety: weightedAvgSafety,
    teamSegments: null,
  }, org);

  return {
    components,
    totalTax,
    hiddenErrors,
    totalProblems: firmEmployees * computeTotalProblems(Array.isArray(params.problemDist) ? params.problemDist : []),
    scopeMode: params.scopeMode || "full",
    totalTaxFull, betaPotential, experimentalPotential,
    coaseBoundaryRatio: firmRevenue > 0 ? totalTax / (firmRevenue * 0.05) : 0,
    peakModule: peakModule?.id,
    silenceShares: analyticsView.silenceShares,
    hierarchyAnalytics: analyticsView.hierarchyAnalytics,
    silenceTypes: analyticsView.silenceTypes,
    mechanismDimension: analyticsView.mechanismDimension,
    interactionEffects: segmentResults.flatMap(r => r.interactionEffects || []),
    segmentMode: true,
    weightedAvgSafety,
    segmentResults: segmentInputs.map(({ seg, revenue, leaders }, i) => ({
      id: seg.id,
      label: seg.label,
      employees: seg.employees,
      revenue,
      leaders,
      safety: seg.safety,
      totalTax: segmentResults[i].totalTax,
      taxPerEmployee: seg.employees > 0 ? segmentResults[i].totalTax / seg.employees : 0,
      topModule: segmentResults[i].peakModule,
    })),
  };
}
