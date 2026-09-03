import {
  buildInterventionProfile,
  summarizeInterventionSelection,
} from "./optimizers.js";

const safeName = (id) => `x_${id.replaceAll(/[^a-zA-Z0-9_]/g, "_")}`;
const levelName = (moduleId, liftUnits) => `z_${moduleId.replaceAll(/[^a-zA-Z0-9_]/g, "_")}_${liftUnits}`;

function sumTerms(terms) {
  return terms.length > 0 ? terms.join(" + ") : "0";
}

export function buildInterventionMilp(params, budget, baselineCosts = null) {
  const profile = buildInterventionProfile(params, budget, baselineCosts);
  const variableNames = profile.variants.map((variant) => safeName(variant.id));
  const responseNames = profile.modules.flatMap((module) =>
    module.levels.map((level) => levelName(module.id, level.liftUnits))
  );
  const allBinaryNames = [...variableNames, ...responseNames];
  if (new Set(allBinaryNames).size !== allBinaryNames.length) {
    throw new Error("Intervention model IDs collide after MILP variable-name sanitization");
  }

  const totalCatalogCost = profile.variants.reduce((sum, variant) => sum + variant.totalCost, 0);
  const maxTieRank = (2 ** profile.variants.length) - 1;
  const responseObjective = profile.modules.flatMap((module) =>
    module.levels
      .filter((level) => level.objectiveUnits > 0)
      .map((level) => `${level.objectiveUnits} ${levelName(module.id, level.liftUnits)}`)
  );
  const selectionPenalties = profile.variants.map((variant, index) => {
    // A one-PLN improvement in the primary objective always dominates both
    // tie-break terms. Within an equal primary objective, lower cost wins,
    // followed by stable catalog order.
    const costPenalty = totalCatalogCost > 0 ? (variant.totalCost / totalCatalogCost) * 0.1 : 0;
    const orderPenalty = maxTieRank > 0 ? ((2 ** index) / maxTieRank) * 0.001 : 0;
    return `- ${(costPenalty + orderPenalty).toFixed(12)} ${safeName(variant.id)}`;
  });
  const objective = [...responseObjective, ...selectionPenalties].join(" + ") || "0";

  const budgetTerms = profile.variants.map((variant) => `${variant.totalCost} ${safeName(variant.id)}`);
  const groupConstraints = profile.groups.map((group) => {
    const terms = group.variants.map((variant) => safeName(variant.id));
    return ` group_${safeName(group.groupId)}: ${sumTerms(terms)} <= 1`;
  });
  const moduleConstraints = profile.modules.flatMap((module) => {
    const pickTerms = module.levels.map((level) => levelName(module.id, level.liftUnits));
    const levelTerms = module.levels
      .filter((level) => level.liftUnits > 0)
      .map((level) => `${level.liftUnits} ${levelName(module.id, level.liftUnits)}`);
    const targetTerms = profile.variants
      .filter((variant) => variant.targets.includes(module.id))
      .map((variant) => `- ${variant.liftUnits} ${safeName(variant.id)}`);
    return [
      ` module_pick_${module.id}: ${sumTerms(pickTerms)} = 1`,
      ` module_lift_${module.id}: ${[...levelTerms, ...targetTerms].join(" + ") || "0"} = 0`,
    ];
  });

  const lp = `Maximize
 objective: ${objective}
Subject To
 budget: ${sumTerms(budgetTerms)} + unused_budget = ${profile.budget}
${[...groupConstraints, ...moduleConstraints].join("\n")}
Bounds
 0 <= unused_budget <= ${profile.budget}
Binary
 ${allBinaryNames.join(" ")}
End`;

  return { ...profile, lp };
}

let solverPromise;

async function loadHighs() {
  if (!solverPromise) {
    const pending = import("highs").then(async (module) => {
      const loader = module.default || module;
      if (typeof window === "undefined") return loader();
      const runtime = await import("highs/runtime?url");
      return loader({ locateFile: () => runtime.default });
    });
    solverPromise = pending.catch((error) => {
      solverPromise = undefined;
      throw error;
    });
  }
  return solverPromise;
}

export async function solveInterventionMixHighs(params, budget, baselineCosts = null) {
  const model = buildInterventionMilp(params, budget, baselineCosts);
  if (model.employees === 0 || model.budget === 0) {
    return {
      ...summarizeInterventionSelection([], model.budget, "highs-milp", model),
      solverStatus: "Optimal",
      solvedBy: "analytical-empty",
    };
  }

  const highs = await loadHighs();
  const solution = highs.solve(model.lp, {
    presolve: "on",
    solver: "choose",
    mip_rel_gap: 0,
    mip_abs_gap: 0,
    random_seed: 0,
  });
  if (solution.Status !== "Optimal") {
    throw new Error(`HiGHS did not return an optimal portfolio: ${solution.Status}`);
  }
  const selected = model.variants.filter((variant) => solution.Columns[safeName(variant.id)]?.Primal > 0.5);
  const summary = summarizeInterventionSelection(selected, model.budget, "highs-milp", model);
  const selectedGroups = new Set(selected.map((variant) => variant.groupId));
  if (selectedGroups.size !== selected.length) {
    throw new Error("HiGHS returned more than one intervention from a group");
  }
  if (summary.totalCost > model.budget + 1e-6) {
    throw new Error("HiGHS returned a portfolio above the declared budget");
  }
  return {
    ...summary,
    objectiveValue: solution.ObjectiveValue,
    solverStatus: solution.Status,
    solvedBy: "highs-wasm",
  };
}
