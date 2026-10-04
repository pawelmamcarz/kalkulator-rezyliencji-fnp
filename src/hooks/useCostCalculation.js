import { useMemo } from "react";
import { computeFnpAnalysis, computeFnpClimateSensitivity } from "../fnpModel.js";
import { validateInputs } from "../inputs.js";

export function useCostCalculation(params) {
  const { revenue, employees, avgSalary, turnoverPct, safety } = params;
  const valid = Object.keys(validateInputs(params)).length === 0;
  return useMemo(() => {
    if (!valid) return null;
    const input = { revenue, employees, avgSalary, turnoverPct, safety };
    // The same firm at climate 0: the full-size outline of the disc.
    const worst = computeFnpAnalysis({ ...input, safety: 0 }).costs.totalTax;
    return { ...computeFnpAnalysis(input), sensitivity: computeFnpClimateSensitivity(input), worst };
  }, [valid, revenue, employees, avgSalary, turnoverPct, safety]);
}
