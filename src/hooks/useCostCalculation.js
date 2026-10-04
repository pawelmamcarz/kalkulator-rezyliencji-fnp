import { useMemo } from "react";
import { computeFnpAnalysis, computeFnpClimateSensitivity } from "../fnpModel.js";
import { validateInputs } from "../inputs.js";

export function useCostCalculation(params) {
  const { revenue, employees, avgSalary, turnoverPct, safety } = params;
  const valid = Object.keys(validateInputs(params)).length === 0;
  return useMemo(() => {
    if (!valid) return null;
    const input = { revenue, employees, avgSalary, turnoverPct, safety };
    return { ...computeFnpAnalysis(input), sensitivity: computeFnpClimateSensitivity(input) };
  }, [valid, revenue, employees, avgSalary, turnoverPct, safety]);
}
