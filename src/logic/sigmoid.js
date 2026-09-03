import { METRICS, FEAR_METRICS, LOSS_AVERSION_SHIFT } from './constants.js';

export function sigmoid(safety, lowVal, highVal, midpoint = 50, k = 0.08) {
  return lowVal + (highVal - lowVal) / (1 + Math.exp(-k * (safety - midpoint)));
}

// `kMult` scales every metric's sigmoid steepness `k` by a constant factor.
// In-place perturbation avoids mutating the shared METRICS table.
export function getMetricValue(key, safety, kMult = 1) {
  const m = METRICS[key];
  const effectiveMid = FEAR_METRICS.has(key)
    ? (m.mid ?? 50) + LOSS_AVERSION_SHIFT
    : (m.mid ?? 50);
  return sigmoid(safety, m.low, m.high, effectiveMid, (m.k ?? 0.08) * kMult);
}

export function metricSeverity(key, safety, kMult = 1) {
  const m = METRICS[key];
  const v = getMetricValue(key, safety, kMult);
  const vBest = getMetricValue(key, 100, kMult);
  const vWorst = getMetricValue(key, 0, kMult);
  const range = Math.abs(vWorst - vBest);
  if (range < 0.001) return 0;
  return m.positive
    ? Math.max(0, Math.min(1, (vBest - v) / range))
    : Math.max(0, Math.min(1, (v - vBest) / range));
}
