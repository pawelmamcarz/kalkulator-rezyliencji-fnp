import { useMemo } from "react";
import { CALIBRATION_MODES, computeFullModelAnalysis } from "../logic.js";

export function useCostCalculation(params) {
  return useMemo(() => {
    const overrides = {
      ...CALIBRATION_MODES.conservative.overrides,
      ...(params.overrides || {}),
    };
    return computeFullModelAnalysis({
      ...params,
      scopeMode: params.scopeMode || "conservative",
      safetySource: params.safetySource || "estimate",
      overrides,
    });
  }, [params]);
}
