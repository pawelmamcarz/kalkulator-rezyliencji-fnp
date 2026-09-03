import { useMemo } from "react";
import { computeFullModelAnalysis } from "../logic.js";
import { fnpAnalysisParams } from "../fnpModel.js";

export function useCostCalculation(params) {
  return useMemo(() => computeFullModelAnalysis(fnpAnalysisParams(params)), [params]);
}
