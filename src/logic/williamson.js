import { sigmoid } from './sigmoid.js';

// ── Williamson hierarchy filtering - INSPIRED, not measured ──
// Williamson (1967, "Hierarchical Control & Optimum Firm Size") modelled α^n
// as a fidelity coefficient: the fraction of an information signal surviving
// n hierarchical layers. It is dimensionless, in [0,1], and Williamson never
// published an empirical α tied to psychological safety. The endogenization
// α(safety) below - α↑ in [0.55, 0.95], α↓ in [0.70, 0.98] - is a structural
// hypothesis introduced in this work (rozprawa §3, H2). The cost-channel
// translation in modules.js carries an additional pair of author-assigned
// scalars (0.005 of revenue bottom-up, 0.15 of payroll × 0.20 distortion
// top-down) which dominate the magnitude. Treat the resulting "hierarchy
// loss" module as a Williamson-INSPIRED order-of-magnitude estimate, not as
// an empirically calibrated price tag on lost signal.
// Garicano (2000) JPE 108(5): hierarchies as optimal knowledge-routing
// mechanisms that minimize transmission costs: α(safety) endogenizes his
// span-of-control derivation. Empirical conversion to PLN requires firm-level
// data not yet available; see rozprawa §3.4.2 module 9 for full discussion.
export function alphaFromSafety(safety) {
  return sigmoid(safety, 0.55, 0.95);
}

export function hierarchyInfoLoss(levels, safety) {
  const alpha = alphaFromSafety(safety);
  return 1 - Math.pow(alpha, levels);
}

export function asymmetricFiltering(levels, safety) {
  const alphaGood = sigmoid(safety, 0.80, 0.97);
  const alphaBad = sigmoid(safety, 0.50, 0.92);
  return {
    goodNewsReaching: Math.pow(alphaGood, levels),
    badNewsReaching: Math.pow(alphaBad, levels),
    asymmetryRatio: Math.pow(alphaGood, levels) / Math.pow(alphaBad, levels),
  };
}

export function alphaDown(safety) {
  return sigmoid(safety, 0.70, 0.98);
}

export function directiveDistortion(levels, safety) {
  const ad = alphaDown(safety);
  return 1 - Math.pow(ad, levels);
}

export function optimalSpan(safety) {
  const alpha = alphaFromSafety(safety);
  const negLnAlpha = -Math.log(alpha);
  if (negLnAlpha < 0.01) return 50;
  return Math.max(3, Math.min(50, Math.round(Math.E / negLnAlpha)));
}

export function spanEfficiencyGap(actualSpan, safety) {
  const sOpt = optimalSpan(safety);
  if (actualSpan <= sOpt) return 0;
  return (actualSpan - sOpt) / sOpt;
}

export function governancePenalty(employees, levels) {
  const sizeEffect = Math.log(Math.max(employees, 1)) / Math.log(50);
  const depthEffect = Math.max(levels, 1) / 2;
  const scalePenalty = 1 + 0.05 * Math.pow(Math.max(0, employees - 500) / 1000, 1.2);
  return sizeEffect * depthEffect * scalePenalty;
}

export function estimateLevels(employees, spanOfControl) {
  if (employees <= 1) return 1;
  const s = spanOfControl;
  // s <= 1 would make Math.log(s) <= 0 and divide by zero (NaN) or invert the
  // depth. A span of 1 or less is degenerate (no fan-out), so the tree is flat.
  if (!(s > 1)) return 1;
  return Math.max(1, Math.ceil(Math.log(employees * (s - 1) + 1) / Math.log(s) - 1));
}
