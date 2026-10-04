import { INTERVENTION_GROUPS, VARIANTS_BY_GROUP, VOICE_QUALITY_FLOOR } from './constants.js';
import { computeCosts, normalizeTeamSegments, resolveSafety } from './modules.js';
import { finiteOr, finiteOrNull } from './numbers.js';

// In segment mode, marginal safety points are allocated greedily to the
// lowest-safety segment first (the "toxic team" gets improved before the
// "exemplary team"). Safety goes through the engine's resolveSafety, so a
// string "41" is 41 (it used to be concatenated: "41" + 5 = "415") and a
// missing score throws instead of being treated as 0. Returns a new segments
// array with safety fields raised.
function allocateDeltaGreedy(segments, delta) {
  const copies = segments.map((seg) => ({ ...seg, safety: resolveSafety(seg.safety) }));
  const sorted = [...copies].sort((a, b) => a.safety - b.safety);
  let remaining = delta;
  for (const seg of sorted) {
    if (remaining <= 0) break;
    const apply = Math.min(100 - seg.safety, remaining);
    seg.safety += apply;
    remaining -= apply;
  }
  // Caller's original order for display stability.
  return copies;
}

// Headcount-weighted mean safety over the segments, with the same rescaled
// headcount the cost engine uses (normalizeTeamSegments), not raw
// count × avgSize.
function weightedAvgSafetyOf(segments, employees) {
  const normalized = normalizeTeamSegments(segments, employees);
  const total = normalized.reduce((s, seg) => s + seg.employees, 0);
  if (!(total > 0)) return null;
  return normalized.reduce((s, seg) => s + seg.safety * seg.employees, 0) / total;
}

const SCORE_EPSILON = 1e-10;
const LIFT_SCALE = 100;

export function normalizePortfolioInputs(employees, budget) {
  const headcountNumber = finiteOrNull(employees);
  const budgetNumber = finiteOrNull(budget);
  if (headcountNumber === null || budgetNumber === null) {
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

// Parameters at a safety lift. Safety is normalised by resolveSafety: a
// missing climate throws (it used to become 0, so with a supplied baseline
// every reduction silently came out as 0).
function paramsAtSafetyLift(params, delta) {
  const hasSegments = Array.isArray(params.teamSegments) && params.teamSegments.length > 0;
  return hasSegments
    ? { ...params, teamSegments: allocateDeltaGreedy(params.teamSegments, delta) }
    : { ...params, safety: Math.min(100, resolveSafety(params.safety) + delta) };
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

// Value a safety lift through the full cost model (the same re-run the
// portfolio profile uses), never through a payroll-rate shortcut. In segment
// mode the lift is allocated greedily (worst team first). Safety, string or
// number, goes through resolveSafety; a missing climate throws.
export function applySafetyLift(params, deltaS) {
  const base = computeCosts(params);
  const d = Math.max(0, finiteOr(deltaS, 0));
  const hasSegments = Array.isArray(params.teamSegments) && params.teamSegments.length > 0;
  const baselineSafety = hasSegments
    ? weightedAvgSafetyOf(params.teamSegments, params.employees)
    : resolveSafety(params.safety);
  if (d === 0) {
    return { newSafety: baselineSafety, newTax: base.totalTax, annualSavings: 0, baseTax: base.totalTax };
  }
  const liftedParams = paramsAtSafetyLift(params, d);
  const lifted = computeCosts(liftedParams);
  // Segment mode: the greedy lift raises one team by d points, so the
  // firm-level BP rises by d * (segment share), not by d.
  const newSafety = hasSegments
    ? weightedAvgSafetyOf(liftedParams.teamSegments, params.employees)
    : Math.min(100, baselineSafety + d);
  return {
    newSafety,
    newTax: lifted.totalTax,
    annualSavings: Math.max(0, base.totalTax - lifted.totalTax),
    baseTax: base.totalTax,
  };
}
