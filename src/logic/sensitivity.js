import { computeCosts } from "./modules.js";
import {
  WYSIATI_PREMIUM, HIRSCHMAN_EXIT_AMPLIFIER,
  ARGYRIS_REVENUE_IMPACT, NONAKA_SALARY_IMPACT, AUTONOMY_PASSIVITY_DAMPER,
  K_SIGMOID_DEFAULT_MULT, LEADER_SILENCE_FREQ_MULT,
  AUTOMATIC_SILENCE_PENALTY, AGENCY_MONITORING_HIGH,
} from "./constants.js";

// Structural parameters exposed for one-at-a-time perturbation. The legacy
// A/B/C tier ranks proximity of mechanism evidence, not empirical confidence
// in the numeric value. All monetary magnitudes below remain author priors.
//
// AKERLOF_ADVERSE_SELECTION_PREMIUM and PEAK_END_PREMIUM were removed: both
// are now 0 in constants.js (Akerlof selectively unmotivated and redundant
// with α^n; peak-end is a memory-of-experience effect, not an accounting
// cost). Perturbing 0 produces 0 - keeping them in this list would yield
// useless rows.
//
// `K_SIGMOID_MULT` is a global multiplier on every METRIC's sigmoid steepness
// `k` - the only way to perturb the sigmoid shape parameter without mutating
// the shared METRICS table. Baseline = K_SIGMOID_DEFAULT_MULT, a face-validity
// scenario prior; ±25% perturbation reports local numerical sensitivity.
// MC_RHO is *not* in PERTURBABLE because `computeCosts` (the function that
// `sensitivityReport` perturbs below) is the deterministic point-estimate path
// - ρ has no effect there. ρ shapes the *Monte Carlo distribution* (P10–P90
// width), not the central estimate. The P4 audit re-run flagged that ρ has
// no tornado-chart entry; the correct response is a separate MC sensitivity
// test that varies ρ ∈ {0.0, 0.25, 0.5, 0.75, 1.0} and reports how the band
// width changes. That test lives in `logic.test.js` (Section K, "MC band
// stability under ρ variation"). MC_RHO_DEFAULT is exposed via
// `computeCostsMC(params, N, { rho })` for callers who need to sweep it.
const PERTURBABLE = [
  { key: "K_SIGMOID_MULT",            value: K_SIGMOID_DEFAULT_MULT,    tier: "C", label: "k sigmoidy (globalna stromość)",  source: "AUTHOR: structural scenario prior" },
  { key: "OVERLAP_GLOBAL",            value: 1.0,                       tier: "C", label: "Globalna skala korekt overlap",     source: "AUTHOR (audit DK-5: ekspercka redukcja 15.4% → 13.1%)" },
  { key: "WYSIATI_PREMIUM",           value: WYSIATI_PREMIUM,           tier: "B", label: "WYSIATI premium",                   source: "Kahneman 2011 (kontekstowa)" },
  { key: "HIRSCHMAN_EXIT_AMPLIFIER",  value: HIRSCHMAN_EXIT_AMPLIFIER,  tier: "B", label: "Hirschman exit amplifier",          source: "AUTHOR: Hirschman-inspired prior" },
  { key: "ARGYRIS_REVENUE_IMPACT",    value: ARGYRIS_REVENUE_IMPACT,    tier: "C", label: "Argyris double-loop deficit",       source: "AUTHOR" },
  { key: "NONAKA_SALARY_IMPACT",      value: NONAKA_SALARY_IMPACT,      tier: "C", label: "Nonaka SECI block",                 source: "AUTHOR" },
  { key: "AUTONOMY_PASSIVITY_DAMPER", value: AUTONOMY_PASSIVITY_DAMPER, tier: "C", label: "Adamska autonomia damper",          source: "AUTHOR (Adamska 2015)" },
  { key: "LEADER_SILENCE_FREQ_MULT",  value: LEADER_SILENCE_FREQ_MULT,  tier: "C", label: "Częstość milczenia liderów",        source: "AUTHOR: scenario face-validity prior" },
  { key: "AUTOMATIC_SILENCE_PENALTY", value: AUTOMATIC_SILENCE_PENALTY, tier: "C", label: "Adamska automatic silence penalty", source: "AUTHOR (Adamska 2016)" },
  { key: "AGENCY_MONITORING_HIGH",    value: AGENCY_MONITORING_HIGH,    tier: "B", label: "Jensen-Meckling monitoring (high)", source: "AUTHOR: Jensen-Meckling-inspired prior" },
];

// Persistence x discount -> NPV grid for the printed ST-13 annex.
//
// This is the "trwałość × dyskonto" table promised by CLAUDE.md's description
// of this file. It is a PURE presentation-layer derivation: it re-uses exactly
// the 3-year cumulative-NPV recurrence that SectionPitch draws (upfront cost at
// Y0, then annualSavings decayed by persistence^(y-1) and discounted by
// (1+disc)^y), so the printed annex cannot disagree with the on-screen Pitch at
// the baseline cell (persistence 0.70, discount 0.08). Baseline persistence and
// discount are marked so the Filing can highlight the row/column that matches
// the headline pitch. Adds NOTHING to any existing displayed number - it is a
// pure addition consumed only by the (print-only) FilingSummary annex.
export const NPV_GRID_PERSISTENCES = [0.55, 0.7, 0.85];
export const NPV_GRID_DISCOUNTS = [0.06, 0.08, 0.1];
export const NPV_GRID_BASELINE = { persistence: 0.7, discount: 0.08 };

export function npvSensitivityGrid({
  annualSavings = 0,
  upfrontCost = 0,
  persistences = NPV_GRID_PERSISTENCES,
  discounts = NPV_GRID_DISCOUNTS,
  horizon = 3,
} = {}) {
  const npv = (persistence, disc) => {
    let cum = -upfrontCost;
    for (let y = 1; y <= horizon; y++) {
      cum += (annualSavings * Math.pow(persistence, y - 1)) / Math.pow(1 + disc, y);
    }
    return cum;
  };
  const grid = persistences.map((p) => discounts.map((d) => npv(p, d)));
  return {
    persistences,
    discounts,
    horizon,
    grid,
    baseline: NPV_GRID_BASELINE,
    annualSavings,
    upfrontCost,
  };
}

export function sensitivityReport(params, { delta = 0.25 } = {}) {
  const base = computeCosts({ ...params, overrides: {} }).totalTax;
  if (!(base > 0)) return { base: 0, delta, rows: [] };

  const rows = PERTURBABLE.map(({ key, value, source, tier, label }) => {
    const plus = computeCosts({ ...params, overrides: { [key]: value * (1 + delta) } }).totalTax;
    const minus = computeCosts({ ...params, overrides: { [key]: value * (1 - delta) } }).totalTax;
    return {
      key, source, tier, label, value,
      plusPct: (plus - base) / base,
      minusPct: (minus - base) / base,
    };
  });

  // Rank by max absolute swing (used by the tornado chart to order bars).
  rows.sort((a, b) =>
    Math.max(Math.abs(b.plusPct), Math.abs(b.minusPct)) -
    Math.max(Math.abs(a.plusPct), Math.abs(a.minusPct))
  );

  const maxAbsPct = rows.reduce((m, r) => Math.max(m, Math.abs(r.plusPct), Math.abs(r.minusPct)), 0);

  return { base, delta, rows, maxAbsPct };
}
