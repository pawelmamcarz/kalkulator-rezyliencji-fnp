import { useState, useCallback } from "react";
import { PL_AVG_SAFETY } from "../logic.js";

function buildInitialParams() {
  return {
    companyName: "",
    revenue: 100_000_000,
    costs: 92_000_000,
    employees: 500,
    avgSalary: 90_000,
    turnoverPct: 16,
    safety: PL_AVG_SAFETY,
    safetySource: "estimate",
    scopeMode: "conservative",
    valuationEnabled: true,
  };
}

const PARAM_BOUNDS = {
  revenue: [0, 1e13],
  costs: [0, 1e13],
  employees: [1, 5_000_000],
  avgSalary: [0, 10_000_000],
  turnoverPct: [0, 100],
  safety: [0, 100],
};

function clampParam(k, v) {
  const bounds = PARAM_BOUNDS[k];
  if (!bounds) return v;
  const n = Number(v);
  if (!Number.isFinite(n)) return bounds[0];
  return Math.max(bounds[0], Math.min(bounds[1], n));
}

export function useParamsState() {
  const [params, setParams] = useState(buildInitialParams);

  const up = useCallback((k, v) => setParams((p) => {
    const value = clampParam(k, v);
    return { ...p, [k]: value };
  }), []);

  return { params, setParams, up };
}
