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

export function normalizeFullModelParams(params = {}) {
  const employees = Math.max(1, Number(params.employees) || 1);
  return {
    revenue: Math.max(0, Number(params.revenue) || 0),
    employees,
    avgSalary: Math.max(0, Number(params.avgSalary) || 0),
    leaders: Math.max(1, Number(params.leaders) || Math.round(employees * 0.1)),
    safety: Math.max(0, Math.min(100, Number(params.safety) || 0)),
    hierarchyLevels: Math.max(0, Number(params.hierarchyLevels) || 0),
    spanOfControl: Math.max(2, Number(params.spanOfControl) || 7),
    recentTrauma: Math.max(0, Math.min(1, Number(params.recentTrauma) || 0)),
    autonomy: Math.max(0, Math.min(1, Number(params.autonomy) || 0.5)),
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

export function computeFullModelAnalysis(params, options = {}) {
  const effectiveParams = normalizeFullModelParams(params);
  const costs = computeCosts(effectiveParams);
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
