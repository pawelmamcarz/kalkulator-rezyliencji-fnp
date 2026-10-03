import { DEFAULT_PROBLEM_DIST } from "./constants.js";
import { computeCosts } from "./modules.js";
import { computeCostsMC, MC_RHO_DEFAULT } from "./monteCarlo.js";

export const REPORTING_CHANNELS = {
  continuity: ["turnover", "knowledgeLoss"],
  operational: ["errors", "compliance"],
  capacity: ["burnout", "passivity", "help"],
  contribution: ["innovation", "learningDeficit"],
  coordination: ["leader", "hierarchy", "governance", "agencyOverhead"],
};

// A value counts as given only when it is a finite number. null, undefined,
// "" and NaN are missing. `Number(x) || default` treated an explicit 0 as
// missing (autonomy 0 became 0.5, leaders 0 became 10% of headcount) and
// turned a missing climate into 0, the most expensive scenario.
function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeFullModelParams(params = {}) {
  // Headcount below 1 is not an organization; 1 is the smallest valid firm.
  const employees = Math.max(1, Number(params.employees) || 1);
  const leaders = finiteOrNull(params.leaders);
  const safety = finiteOrNull(params.safety);
  const autonomy = finiteOrNull(params.autonomy);
  return {
    revenue: Math.max(0, Number(params.revenue) || 0),
    employees,
    avgSalary: Math.max(0, Number(params.avgSalary) || 0),
    // Explicit 0 is honoured; a missing count uses the 10% span prior. Leaders
    // cannot outnumber employees.
    leaders: Math.min(employees, leaders === null ? Math.max(1, Math.round(employees * 0.1)) : Math.max(0, leaders)),
    // null means "not provided": computeFullModelAnalysis then returns no
    // result instead of computing some climate.
    safety: safety === null ? null : Math.max(0, Math.min(100, safety)),
    // 0 keeps its long-standing meaning "not provided, estimate from size".
    hierarchyLevels: Math.max(0, Number(params.hierarchyLevels) || 0),
    // 0 keeps its long-standing meaning "not provided, use 7".
    spanOfControl: Math.max(2, Number(params.spanOfControl) || 7),
    recentTrauma: Math.max(0, Math.min(1, Number(params.recentTrauma) || 0)),
    autonomy: autonomy === null ? 0.5 : Math.max(0, Math.min(1, autonomy)),
    problemDist: params.problemDist || DEFAULT_PROBLEM_DIST,
    scopeMode: params.scopeMode || "full",
    overrides: params.overrides || {},
    teamSegments: params.teamSegments || null,
  };
}

export function aggregateCostChannels(components) {
  const byId = Object.fromEntries(components.map((component) => [component.id, component]));
  return Object.entries(REPORTING_CHANNELS).map(([id, componentIds]) => {
    const included = componentIds.map((componentId) => byId[componentId]).filter(Boolean);
    return {
      id,
      base: included.reduce((sum, component) => sum + component.value, 0),
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
      payroll: effectiveParams.employees * effectiveParams.avgSalary,
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
  if (effectiveParams.safety === null && !hasSegments) {
    return missingInputAnalysis(effectiveParams, ["safety"]);
  }
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
