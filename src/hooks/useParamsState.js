import { useState, useCallback } from "react";
import { DEFAULT_PARAMS, validateInputs } from "../inputs.js";

export function useParamsState() {
  const [params, setParams] = useState(() => ({ ...DEFAULT_PARAMS }));
  const up = useCallback((key, value) => setParams((previous) => ({ ...previous, [key]: value })), []);
  const reset = useCallback(() => setParams({ ...DEFAULT_PARAMS }), []);
  return { params, up, reset, errors: validateInputs(params) };
}
