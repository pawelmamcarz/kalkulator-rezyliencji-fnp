import { INTERVENTION_GROUPS, VARIANTS_BY_GROUP, STATUS_QUO_FRICTION, VOICE_QUALITY_FLOOR } from './constants.js';
import { computeCosts } from './modules.js';

// In segment mode, marginal safety points are allocated greedily to the
// lowest-BP segment first (the "toxic team" gets improved before the
// "exemplary team"). This reflects the real-world intuition that the
// highest-ROI intervention is to fix the worst team, not to raise the
// average. Returns a new segments array with safety fields bumped.
function allocateDeltaGreedyDetailed(segments, delta) {
  const byId = Object.fromEntries(segments.map(s => [s.id, { ...s }]));
  const sorted = Object.values(byId).sort((a, b) => a.safety - b.safety);
  let remaining = delta;
  const allocations = [];
  for (const seg of sorted) {
    if (remaining <= 0) break;
    const headroom = 100 - seg.safety;
    const apply = Math.min(headroom, remaining);
    if (apply > 0) {
      allocations.push({
        id: seg.id,
        employees: (seg.count || 0) * (seg.avgSize || 0),
        startSafety: seg.safety,
        applied: apply,
      });
    }
    seg.safety = seg.safety + apply;
    remaining -= apply;
  }
  // Preserve caller's original order for display stability
  return { segments: segments.map(s => byId[s.id]), allocations };
}

function allocateDeltaGreedy(segments, delta) {
  return allocateDeltaGreedyDetailed(segments, delta).segments;
}

// Price a greedy segment lift by the headcount that actually receives it.
// Pricing the whole firm for points applied to one team overstated the cost
// by employees/segmentEmployees and suppressed bestDelta in segment mode
// (grilling 2026-06-09). Falls back to whole-firm pricing when segment
// headcounts are unavailable.
function segmentLiftCost(segments, delta, fallbackEmployees, fallbackSafety) {
  const { allocations } = allocateDeltaGreedyDetailed(segments, delta);
  if (allocations.length === 0 || allocations.some(a => !(a.employees > 0))) {
    return interventionCost(fallbackEmployees, delta, fallbackSafety);
  }
  return allocations.reduce(
    (s, a) => s + interventionCost(a.employees, a.applied, a.startSafety), 0
  );
}

function weightedAvgSafetyOf(segments) {
  if (!segments || segments.length === 0) return null;
  let num = 0;
  let den = 0;
  for (const seg of segments) {
    const emp = (seg.count || 0) * (seg.avgSize || 0);
    num += (seg.safety || 0) * emp;
    den += emp;
  }
  return den > 0 ? num / den : null;
}

const SCORE_EPSILON = 1e-10;
const LIFT_SCALE = 100;

export function normalizePortfolioInputs(employees, budget) {
  const headcountNumber = Number(employees);
  const budgetNumber = Number(budget);
  if (!Number.isFinite(headcountNumber) || !Number.isFinite(budgetNumber)) {
    throw new RangeError("Portfolio employees and budget must be finite numbers");
  }
  return {
    employees: Math.max(0, Math.round(headcountNumber)),
    budget: Math.max(0, budgetNumber),
  };
}

export function buildInterventionGroups(employees) {
  const { employees: headcount } = normalizePortfolioInputs(employees, 0);
  return INTERVENTION_GROUPS.map(g => {
    const targetPeople = headcount > 0
      ? Math.min(headcount, Math.max(1, Math.round(headcount * g.coverage)))
      : 0;
    const totalCost = Math.round(g.costPerEmp * targetPeople);
    // AUTHOR'S EXTENSION: voiceQuality is a group-level planning prior. The
    // provider records are examples only, because they do not carry audited,
    // provider-specific cost or impact coefficients.
    const voiceQuality = g.voiceQuality ?? 0.80;
    const effectiveImpact = g.impact * (VOICE_QUALITY_FLOOR + (1 - VOICE_QUALITY_FLOOR) * voiceQuality);
    const catalogExamples = VARIANTS_BY_GROUP[g.id].flatMap((item) => item.exemplaryVendors || []);
    const choice = {
      ...g,
      groupId: g.id,
      totalCost,
      targetPeople,
      effectiveImpact,
      liftUnits: Math.round(effectiveImpact * LIFT_SCALE),
      catalogExamples,
    };
    return { groupId: g.id, variants: [choice] };
  });
}

function paramsAtSafetyLift(params, delta) {
  const hasSegments = Array.isArray(params.teamSegments) && params.teamSegments.length > 0;
  return hasSegments
    ? { ...params, teamSegments: allocateDeltaGreedy(params.teamSegments, delta) }
    : { ...params, safety: Math.min(100, (params.safety ?? 0) + delta) };
}

function attainableLiftUnits(variants) {
  let levels = new Set([0]);
  for (const variant of variants) {
    const previous = [...levels];
    for (const level of previous) levels.add(level + variant.liftUnits);
  }
  return [...levels].sort((a, b) => a - b);
}

function requirePortfolioParams(params, budget) {
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    throw new TypeError("Portfolio optimization requires the full model parameter object");
  }
  return normalizePortfolioInputs(params.employees, budget);
}

// Build the intervention-to-module response surface used by both HiGHS and
// the exact enumeration oracle. The binary target matrix and intervention
// lift priors are AUTHOR'S EXTENSIONS. Monetary responses are not assigned by
// the user: every attainable lift is re-evaluated through computeCosts, which
// preserves the module sigmoids, interactions and declared reporting scope.
export function buildInterventionProfile(params, budget, baselineCosts = null) {
  const inputs = requirePortfolioParams(params, budget);
  const groups = buildInterventionGroups(inputs.employees);
  const variants = groups.flatMap((group) => group.variants);
  if (inputs.employees === 0) {
    return { ...inputs, groups, variants, modules: [], baselineTax: 0 };
  }

  const baseline = baselineCosts || computeCosts(params);
  if (!baseline || !Array.isArray(baseline.components)) {
    throw new TypeError("Portfolio optimization requires a valid baseline cost result");
  }
  const activeComponents = baseline.components.filter((component) => component.inHeadline !== false);
  const baselineTax = activeComponents.reduce((sum, component) => sum + component.value, 0);
  const scenarioCache = new Map([[0, baseline]]);
  const costsAtLift = (liftUnits) => {
    if (!scenarioCache.has(liftUnits)) {
      scenarioCache.set(liftUnits, computeCosts(paramsAtSafetyLift(params, liftUnits / LIFT_SCALE)));
    }
    return scenarioCache.get(liftUnits);
  };

  const modules = activeComponents.map((component) => {
    const targeting = variants.filter((variant) => variant.targets.includes(component.id));
    const levels = attainableLiftUnits(targeting).map((liftUnits) => {
      const scenarioComponent = costsAtLift(liftUnits).components.find((item) => item.id === component.id);
      if (!scenarioComponent) throw new Error(`Missing module ${component.id} in intervention scenario`);
      const reduction = Math.max(0, component.value - scenarioComponent.value);
      return {
        liftUnits,
        lift: liftUnits / LIFT_SCALE,
        reduction,
        // The MILP resolves its primary objective to whole PLN. This makes
        // the cost tie-break lexicographic without letting floating noise
        // change the portfolio.
        objectiveUnits: Math.round(reduction),
      };
    });
    return {
      id: component.id,
      label: component.label,
      labelEn: component.labelEn,
      baseline: component.value,
      targetIds: targeting.map((variant) => variant.id),
      levels,
      levelByUnits: new Map(levels.map((level) => [level.liftUnits, level])),
    };
  });

  for (const variant of variants) {
    variant.profileTargets = modules
      .filter((module) => variant.targets.includes(module.id))
      .map((module) => {
        const level = module.levelByUnits.get(variant.liftUnits);
        return {
          id: module.id,
          label: module.label,
          labelEn: module.labelEn,
          baseline: module.baseline,
          standaloneReduction: level?.reduction || 0,
        };
      })
      .sort((a, b) => b.standaloneReduction - a.standaloneReduction);
    variant.profileFit = baselineTax > 0
      ? variant.profileTargets.reduce((sum, target) => sum + target.standaloneReduction, 0) / baselineTax
      : 0;
    variant.roi = variant.totalCost > 0 ? variant.profileFit / variant.totalCost : 0;
  }

  return { ...inputs, groups, variants, modules, baselineTax };
}

export function evaluateInterventionPortfolio(model, selected) {
  const selectedIds = new Set(selected.map((variant) => variant.id));
  const moduleEffects = model.modules.map((module) => {
    const liftUnits = model.variants.reduce(
      (sum, variant) => sum + (selectedIds.has(variant.id) && variant.targets.includes(module.id) ? variant.liftUnits : 0),
      0
    );
    const level = module.levelByUnits.get(liftUnits);
    if (!level) throw new Error(`Missing response level ${liftUnits} for module ${module.id}`);
    return {
      id: module.id,
      label: module.label,
      labelEn: module.labelEn,
      baseline: module.baseline,
      lift: level.lift,
      reduction: level.reduction,
      objectiveUnits: level.objectiveUnits,
    };
  });
  const modeledAnnualReduction = moduleEffects.reduce((sum, module) => sum + module.reduction, 0);
  const objectiveUnits = moduleEffects.reduce((sum, module) => sum + module.objectiveUnits, 0);
  return {
    moduleEffects,
    modeledAnnualReduction,
    objectiveUnits,
    profileScore: model.baselineTax > 0 ? modeledAnnualReduction / model.baselineTax : 0,
  };
}

export function summarizeInterventionSelection(selected, budget, method = "exact-enumeration", model = null) {
  const rawImpact = selected.reduce((s, i) => s + i.impact, 0);
  const effectiveImpactTotal = selected.reduce((s, i) => s + i.effectiveImpact, 0);
  const totalCost = selected.reduce((s, i) => s + i.totalCost, 0);
  const avgVoiceQuality = selected.length > 0
    ? selected.reduce((s, i) => s + (i.voiceQuality ?? 0.80), 0) / selected.length : 0;
  const evaluation = model
    ? evaluateInterventionPortfolio(model, selected)
    : { moduleEffects: [], modeledAnnualReduction: 0, objectiveUnits: 0, profileScore: 0 };

  return {
    selected,
    selectedIds: selected.map(i => i.id),
    totalImpact: rawImpact,
    rawImpact,
    effectiveImpact: effectiveImpactTotal,
    totalCost,
    remaining: budget - totalCost,
    avgVoiceQuality,
    method,
    objectiveScope: "diagnostic-profile",
    baselineTax: model?.baselineTax || 0,
    ...evaluation,
  };
}

export function solveInterventionMix(params, budget, baselineCosts = null) {
  const inputs = requirePortfolioParams(params, budget);
  if (inputs.employees === 0 || inputs.budget === 0) {
    return summarizeInterventionSelection([], inputs.budget);
  }
  const model = buildInterventionProfile(params, inputs.budget, baselineCosts);
  if (model.variants.length > 30) throw new RangeError("Exact portfolio enumeration supports at most 30 choices");

  // Exact oracle for the nonlinear module response model. Ten binary choices
  // produce only 1024 portfolios, which is small enough for a deterministic
  // browser fallback and gives an independent reference for HiGHS tests.
  let best = { selected: [], totalCost: 0, objectiveUnits: 0, tieRank: 0 };
  const combinations = 2 ** model.variants.length;
  for (let mask = 0; mask < combinations; mask++) {
    const selected = [];
    let totalCost = 0;
    let tieRank = 0;
    for (let index = 0; index < model.variants.length; index++) {
      if ((mask & (2 ** index)) === 0) continue;
      const variant = model.variants[index];
      totalCost += variant.totalCost;
      if (totalCost > inputs.budget) break;
      selected.push(variant);
      tieRank += 2 ** index;
    }
    if (totalCost > inputs.budget) continue;
    const evaluation = evaluateInterventionPortfolio(model, selected);
    const improvesObjective = evaluation.objectiveUnits > best.objectiveUnits + SCORE_EPSILON;
    const tiesObjective = Math.abs(evaluation.objectiveUnits - best.objectiveUnits) <= SCORE_EPSILON;
    const improvesTieBreak = totalCost < best.totalCost || (totalCost === best.totalCost && tieRank < best.tieRank);
    if (improvesObjective || (tiesObjective && improvesTieBreak)) {
      best = { selected, totalCost, objectiveUnits: evaluation.objectiveUnits, tieRank };
    }
  }
  return summarizeInterventionSelection(best.selected, inputs.budget, "exact-enumeration", model);
}

// NPV defaults (overridable via params.npv = { discount, horizon, persistence }).
// Persona audit (CFO Janusz) flagged that these were hardcoded - a CFO with
// 12% WACC, 60% persistence, 2-year horizon could not reproduce the model's
// own ROI claim because the UI never exposed the inputs.
//
// AUTHOR'S EXTENSION. Persistence values are scenario priors. The previously
// cited "Edmondson & Bransby 2024-25" source was not retrievable and must not
// be used. No value below is an empirical persistence estimate.
export const PERSISTENCE_SCENARIOS = {
  stress:       0.40,
  conservative: 0.60,
  base:         0.70,
  optimistic:   0.80,
};

const NPV_DEFAULTS = { discount: 0.08, horizon: 3, persistence: PERSISTENCE_SCENARIOS.base };

function npvMultiplier({ discount = NPV_DEFAULTS.discount, horizon = NPV_DEFAULTS.horizon, persistence = NPV_DEFAULTS.persistence } = {}) {
  let m = 0;
  for (let t = 0; t < horizon; t++) {
    m += Math.pow(persistence, t) / Math.pow(1 + discount, t);
  }
  return m;
}
const NPV_MULT = npvMultiplier(NPV_DEFAULTS);

// Helper: compute NPV multiplier for all three persistence scenarios at the
// caller's chosen discount and horizon. Lets the UI render a "what-if" tile
// or the PDF export an honest persistence sensitivity table.
export function npvMultiplierScenarios({ discount = NPV_DEFAULTS.discount, horizon = NPV_DEFAULTS.horizon } = {}) {
  return {
    stress:       npvMultiplier({ discount, horizon, persistence: PERSISTENCE_SCENARIOS.stress }),
    conservative: npvMultiplier({ discount, horizon, persistence: PERSISTENCE_SCENARIOS.conservative }),
    base:         npvMultiplier({ discount, horizon, persistence: PERSISTENCE_SCENARIOS.base }),
    optimistic:   npvMultiplier({ discount, horizon, persistence: PERSISTENCE_SCENARIOS.optimistic }),
  };
}

// Value an achieved safety lift through the full cost model. This is THE
// path for every financial promise shown to the user (Optimizer summary,
// Pitch, printed ST-13): the previous `totalTax * (1 - impact * 0.02)`
// heuristic bypassed the model entirely, so the promised savings were
// numbers the model does not produce (grilling 2026-06-09, DK-2).
// In segment mode the lift is allocated greedily (worst team first),
// matching solveAllocation's allocation rule.
export function applySafetyLift(params, deltaS) {
  const base = computeCosts(params);
  const d = Math.max(0, Number(deltaS) || 0);
  const hasSegments = Array.isArray(params.teamSegments) && params.teamSegments.length > 0;
  const baselineSafety = hasSegments
    ? (weightedAvgSafetyOf(params.teamSegments) ?? params.safety ?? 0)
    : (params.safety ?? 0);
  if (d === 0) {
    return { newSafety: Math.min(100, baselineSafety), newTax: base.totalTax, annualSavings: 0, baseTax: base.totalTax };
  }
  const liftedParams = paramsAtSafetyLift(params, d);
  const lifted = computeCosts(liftedParams);
  // Segment mode: the greedy lift raises one team by d points, so the
  // firm-level BP rises by d * (segment share), not by d.
  const newSafety = hasSegments
    ? (weightedAvgSafetyOf(liftedParams.teamSegments) ?? baselineSafety)
    : Math.min(100, baselineSafety + d);
  return {
    newSafety,
    newTax: lifted.totalTax,
    annualSavings: Math.max(0, base.totalTax - lifted.totalTax),
    baseTax: base.totalTax,
  };
}

// Per-employee cost of moving safety up by one point. CALIBRATION:
// Earlier value 1500 PLN/emp/point produced a structural bug where
// `solveAllocation` returned bestDelta=0 at every budget for any realistic
// firm - the cost curve was ~28× steeper than the actual intervention
// catalog (`solveInterventionMix`). Per-employee-per-point cost in the
// catalog is ~60–150 PLN (e.g., ps-workshops: 600 PLN/emp × 40% coverage
// for +4 points → 60 PLN/emp/point). 150 PLN matches the upper end and
// keeps grid-search NPV consistent with the knapsack catalog. Without
// this fix the two solvers give contradictory advice.
export function interventionCost(employees, delta, startSafety = 0) {
  const baseCost = 150;
  const convexity = 1 + 0.5 * delta / 100;
  const difficultyFactor = 1 + 0.3 * (startSafety / 100);
  const statusQuoBias = 1 + STATUS_QUO_FRICTION;
  return employees * baseCost * delta * convexity * difficultyFactor * statusQuoBias;
}

export function solveAllocation(params, budget) {
  const baseCosts = computeCosts(params);
  const hasSegments = Array.isArray(params.teamSegments) && params.teamSegments.length > 0;

  // CFO override: caller can pass `params.npv = { discount, horizon, persistence }`
  // to run the NPV math against their own WACC and persistence assumptions.
  // E.g. CFO with 12% WACC, 60% persistence, 2y horizon: pass
  //   params.npv = { discount: 0.12, persistence: 0.6, horizon: 2 }.
  // Falls back to author-prior defaults (8% / 70% / 3y → ~2.07× multiplier;
  // optimistic 80% gives 2.29×, conservative 60% gives 1.82×). Default
  // persistence lowered from 0.80 to 0.70 after DK-2 audit, see
  // autoreferat.md Aneks A.4.
  const npvCfg = { ...NPV_DEFAULTS, ...(params.npv || {}) };
  const npvMult = npvMultiplier(npvCfg);

  // In segment mode, "current safety" for the intervention cost curve is
  // the weighted average across segments (matches what the user sees in
  // the UI as their "company BP"). Delta is then allocated greedily to
  // the lowest-safety segment first.
  const baselineSafety = hasSegments
    ? (weightedAvgSafetyOf(params.teamSegments) ?? params.safety)
    : params.safety;

  const maxDelta = Math.min(100 - baselineSafety, 50);

  const marginals = [];
  let bestDelta = 0;
  let bestNet = 0;
  for (let delta = 1; delta <= maxDelta; delta++) {
    const cost = hasSegments
      ? segmentLiftCost(params.teamSegments, delta, params.employees, baselineSafety)
      : interventionCost(params.employees, delta, baselineSafety);
    if (cost > budget * 1.5) break;
    const improvedParams = hasSegments
      ? { ...params, teamSegments: allocateDeltaGreedy(params.teamSegments, delta) }
      : { ...params, safety: Math.min(100, params.safety + delta) };
    const improved = computeCosts(improvedParams);
    const annualReduction = baseCosts.totalTax - improved.totalTax;
    const npvReduction = annualReduction * npvMult;
    const m = { delta, reduction: annualReduction, npvReduction, cost,
                roi: cost > 0 ? npvReduction / cost : 0, improved };
    marginals.push(m);
    if (cost <= budget) {
      const net = npvReduction - cost;
      if (net > bestNet) { bestNet = net; bestDelta = delta; }
    }
  }

  const optimizedParams = hasSegments
    ? { ...params, teamSegments: allocateDeltaGreedy(params.teamSegments, bestDelta) }
    : { ...params, safety: Math.min(100, params.safety + bestDelta) };
  const optimized = computeCosts(optimizedParams);
  const investCost = hasSegments
    ? segmentLiftCost(params.teamSegments, bestDelta, params.employees, baselineSafety)
    : interventionCost(params.employees, bestDelta, baselineSafety);
  const annualReduction = baseCosts.totalTax - optimized.totalTax;

  return {
    marginals,
    bestDelta,
    bestNet,
    investmentCost: investCost,
    currentTax: baseCosts.totalTax,
    optimizedTax: optimized.totalTax,
    reduction: annualReduction,
    npvReduction: annualReduction * npvMult,
    npvMultiplier: npvMult,
    npvConfig: npvCfg,
    roiPct: bestDelta > 0 ? (bestNet / investCost) * 100 : 0,
    optimizedComponents: optimized.components,
    newSafety: Math.min(100, baselineSafety + bestDelta),
    // In segment mode, expose the optimized segment distribution so the UI
    // can show "segment X moves from 25→45, segment Y stays at 80".
    optimizedSegments: hasSegments ? optimizedParams.teamSegments : null,
    baselineSafety,
    segmentMode: hasSegments,
  };
}
