import { useMemo } from "react";
import { computeFnpAnalysis } from "../fnpModel.js";
import { validateInputs } from "../inputs.js";

export function useCostCalculation(params) {
  const { revenue, employees, avgSalary, turnoverPct, safety } = params;
  const valid = Object.keys(validateInputs(params)).length === 0;
  return useMemo(() => valid ? computeFnpAnalysis({
    revenue, employees, avgSalary, turnoverPct, safety,
  }) : null, [valid, revenue, employees, avgSalary, turnoverPct, safety]);
}
