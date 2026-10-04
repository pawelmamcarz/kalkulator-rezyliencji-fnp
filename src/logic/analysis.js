import { DEFAULT_PROBLEM_DIST } from "./constants.js";
import { computeCosts } from "./modules.js";
import { computeCostsMC, MC_RHO_DEFAULT } from "./monteCarlo.js";
import { finiteOrNull } from "./numbers.js";

export const REPORTING_CHANNELS = {
  continuity: ["turnover", "knowledgeLoss"],
  operational: ["errors", "compliance"],
  capacity: ["burnout", "passivity", "help"],
  contribution: ["innovation", "learningDeficit"],
  coordination: ["leader", "hierarchy", "governance", "agencyOverhead"],
};

// Inputs are coerced with the shared finiteOrNull (numbers.js): only finite
// numbers and trimmed numeric strings count. `Number(x) || default` treated
// an explicit 0 as missing (autonomy 0 became 0.5, leaders 0 became 10% of
// headcount), and Number(" ") === 0 turned a blank climate into climate 0.
export function normalizeFullModelParams(params = {}) {
  const rawEmployees = finiteOrNull(params.employees);
  // Headcount below 1 is not an organization; 1 is the smallest valid firm.
  const employees = rawEmployees === null ? null : Math.max(1, rawEmployees);
  const revenue = finiteOrNull(params.revenue);
  const avgSalary = finiteOrNull(params.avgSalary);
  const leaders = finiteOrNull(params.leaders);
  const safety = finiteOrNull(params.safety);
  const autonomy = finiteOrNull(params.autonomy);
  const levels = finiteOrNull(params.hierarchyLevels);
  const span = finiteOrNull(params.spanOfControl);
  const trauma = finiteOrNull(params.recentTrauma);
  const headcount = employees ?? 1;
  return {
    // null means "not provided": computeFullModelAnalysis then returns no
    // result instead of computing with an invented value.
    revenue: revenue === null ? null : Math.max(0, revenue),
    employees,
    avgSalary: avgSalary === null ? null : Math.max(0, avgSalary),
    // Explicit 0 is honoured; a missing count uses the 10% span prior. Leaders
    // cannot outnumber employees.
    leaders: Math.min(headcount, leaders === null ? Math.max(1, Math.round(headcount * 0.1)) : Math.max(0, leaders)),
    // Clamped to the 0–100 scale (the ST sliders and planner rely on it).
    safety: safety === null ? null : Math.max(0, Math.min(100, safety)),
    // 0 keeps its long-standing meaning "not provided, estimate from size".
    hierarchyLevels: levels === null ? 0 : Math.max(0, levels),
    // 0 keeps its long-standing meaning "not provided, use 7".
    spanOfControl: span === null || span === 0 ? 7 : Math.max(2, span),
    recentTrauma: trauma === null ? 0 : Math.max(0, Math.min(1, trauma)),
    autonomy: autonomy === null ? 0.5 : Math.max(0, Math.min(1, autonomy)),
    problemDist: params.problemDist || DEFAULT_PROBLEM_DIST,
    scopeMode: params.scopeMode || "full",
    overrides: params.overrides || {},
    teamSegments: params.teamSegments || null,
  };
}

// Five reporting channels. Each channel reports, from the same components:
//   base      the in-headline amount (sums across channels to costs.totalTax),
//   excluded  the amount of its modules left out of the headline by scope,
//   full      base + excluded (sums to costs.totalTaxFull).
// In the default 'full' scope excluded is 0 and base equals full. Before this
// change `base` was the full amount in every scope, so in conservative scope
// the channels summed to the full total, not the headline.
export function aggregateCostChannels(components) {
  const byId = Object.fromEntries(components.map((component) => [component.id, component]));
  return Object.entries(REPORTING_CHANNELS).map(([id, componentIds]) => {
    const included = componentIds.map((componentId) => byId[componentId]).filter(Boolean);
    const base = included.reduce((sum, c) => sum + (c.inHeadline !== false ? c.value : 0), 0);
    const excluded = included.reduce((sum, c) => sum + (c.inHeadline === false ? c.value : 0), 0);
    return {
      id,
      base,
      excluded,
      full: base + excluded,
      inHeadline: included.some((c) => c.inHeadline !== false),
      components: included,
    };
  });
}

// Returned when an input every module depends on is missing. Sections render
// their existing "no valid input" state from valuation.ready === false and
// valuation.total === null; costs and mc are null so nothing can be shown as
// if it were a computed scenario.
function missingInputAnalysis(effectiveParams, missingInputs) {
  return {
    effectiveParams,
    costs: null,
    mc: null,
    valuation: {
      ready: false,
      missingInputs,
      payroll: (effectiveParams.employees ?? 0) * (effectiveParams.avgSalary ?? 0),
      channels: [],
      mc: null,
      total: null,
      method: "13-module-sigmoid-monte-carlo",
    },
  };
}

export function computeFullModelAnalysis(params = {}, options = {}) {
  const effectiveParams = normalizeFullModelParams(params);
  const hasSegments = Array.isArray(effectiveParams.teamSegments) && effectiveParams.teamSegments.length > 0;
  const missing = ["revenue", "employees", "avgSalary"].filter((key) => effectiveParams[key] === null);
  if (effectiveParams.safety === null && !hasSegments) missing.unshift("safety");
  if (missing.length) return missingInputAnalysis(effectiveParams, missing);
  let costs;
  try {
    costs = computeCosts(effectiveParams);
  } catch (error) {
    // A segment without a usable safety score is the same missing input.
    if (error instanceof RangeError && /safety/.test(error.message)) {
      return missingInputAnalysis(effectiveParams, ["safety"]);
    }
    throw error;
  }
  const mc = computeCostsMC(effectiveParams, options.iterations || 2000, {
    rho: options.rho ?? MC_RHO_DEFAULT,
    seed: options.seed,
    bootstrapR: options.bootstrapR ?? 0,
  });
  const channels = aggregateCostChannels(costs.components);
  return {
    effectiveParams,
    costs,
    mc,
    valuation: {
      ready: params.safetySource === "survey" || params.safetySource === "estimate",
      missingInputs: [],
      payroll: effectiveParams.employees * effectiveParams.avgSalary,
      channels,
      mc,
      total: params.safetySource === "survey" || params.safetySource === "estimate"
        ? { low: mc.p10, base: costs.totalTax, high: mc.p90 }
        : null,
      method: "13-module-sigmoid-monte-carlo",
    },
  };
}
