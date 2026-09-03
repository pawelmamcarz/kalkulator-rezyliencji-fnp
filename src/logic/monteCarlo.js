import { computeCosts } from './modules.js';

function createMulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a 32-bit hash of a stable serialisation of the cost-driving inputs.
// Used as deterministic seed when caller does not supply one - so that the
// same firm parameters always yield the same MC bands. Without this, the same
// PDF report regenerated for the same client would show different P10/P90
// run-to-run (P4 audit blocker #1).
function paramHash(params) {
  if (!params) return 0;
  const key = [
    params.employees ?? 0,
    Math.round(params.revenue ?? 0),
    params.safety ?? 0,
    params.hierarchyLevels ?? 0,
    Math.round(params.avgSalary ?? 0),
    params.autonomy ?? 0,
  ].join('|');
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function normalizeSeed(seed, params) {
  if (seed != null) {
    const n = Number(seed);
    if (Number.isFinite(n)) return Math.trunc(n) >>> 0;
  }
  const fromParams = paramHash(params);
  return fromParams || (Date.now() >>> 0);
}

function _randn(nextRand) {
  let u = 0, v = 0;
  while (u === 0) u = nextRand();
  while (v === 0) v = nextRand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Per-module coefficient of variation (sigma/mu) used to draw each module's
// value from a lognormal around its point estimate in the Monte Carlo pass.
// These are STRUCTURAL PRIORS, not empirically fitted dispersions: there is no
// firm-level panel to estimate module-wise variance from. They sit on a
// AUTHOR'S EXTENSION confidence ladder. It is not fitted to SHRM, Gallup or a
// company-level covariance matrix. Better-supported modules get tighter prior
// bands and interpretive modules get wider ones. The ladder
// widens the P10 to P90 band exactly where the model is least certain. See
// rozprawa section 4.3 (Monte Carlo specification) for the full justification.
const MODULE_CV = {
  errors: 0.35,
  innovation: 0.40,
  turnover: 0.25,
  burnout: 0.25,
  passivity: 0.35,
  help: 0.30,
  leader: 0.40,
  compliance: 0.30,
  hierarchy: 0.35,
  governance: 0.30,
  learningDeficit: 0.45,
  knowledgeLoss: 0.50,
  agencyOverhead: 0.45,
};

export const MC_RHO_DEFAULT = 0.5;

// Default sample size. At N=500 the rule-of-thumb tail-sample
// count is ~50, giving relative SE on P10/P90 of roughly ±5–8% between
// re-runs with different seeds. N=2000 brings that down to ~3% - still
// not perfect, but the headline range becomes reproducible session-to-session.
// Performance: ~4× the single computeCosts cost; on a typical laptop this is
// well under 100 ms, kept under interactive budget.
export const MC_N_DEFAULT = 2000;

// Bootstrap CI on percentiles - re-sample with replacement R times from the
// drawn `totals` array, recompute the percentile each time, and report
// (p10, p90) of the percentile-estimator distribution as the CI on each band.
// Cheap (just sorting an array R times) so we run by default. Returns the
// same shape regardless of R; pass R=0 to skip.
function bootstrapPercentileCI(totals, percentile, R, nextRand) {
  if (R <= 0 || totals.length === 0) return null;
  const N = totals.length;
  const idx = Math.floor(N * percentile);
  const draws = [];
  for (let r = 0; r < R; r++) {
    const sample = [];
    for (let i = 0; i < N; i++) {
      sample.push(totals[Math.floor(nextRand() * N)]);
    }
    sample.sort((a, b) => a - b);
    draws.push(sample[idx]);
  }
  draws.sort((a, b) => a - b);
  return {
    lo: draws[Math.floor(R * 0.05)],   // 5th pct of the percentile estimator
    hi: draws[Math.floor(R * 0.95)],   // 95th pct of the percentile estimator
  };
}

export function computeCostsMC(params, N = MC_N_DEFAULT, { rho = MC_RHO_DEFAULT, seed, bootstrapR = 200 } = {}) {
  const base = computeCosts(params);
  const rhoClamped = Math.max(0, Math.min(1, rho));
  const normalizedSeed = normalizeSeed(seed, params);
  const nextRand = createMulberry32(normalizedSeed);

  if (base.totalTax <= 0) return { p10: 0, p50: 0, p90: 0, rho: rhoClamped, N, seed: normalizedSeed, ci: null };

  // CORRELATION CONTRACT (grilling 2026-06-09, decision D-A): `rho` is the
  // FACTOR LOADING on the common shock, not the pairwise correlation. With
  // z_i = rho*z_common + sqrt(1-rho^2)*z_idio the marginals stay N(0,1) and
  // corr(z_i, z_j) = rho^2, i.e. ~0.25 between modules at the default
  // rho = 0.5. Every prose description of the MC (MODEL_SPEC, autoreferat,
  // papers) must state the pairwise correlation as rho^2, not rho. Tested in
  // logic.test.js section M.
  const rhoComp = Math.sqrt(1 - rhoClamped * rhoClamped);

  const totals = [];
  for (let i = 0; i < N; i++) {
    const zCommon = _randn(nextRand);
    let total = 0;
    for (const comp of base.components) {
      // Respect the maturity/scope headline: in conservative mode the modules
      // excluded from totalTax must not enter the P10/P90 band either, or the
      // ribbon disagrees with LINE 99. Default 'full' keeps every component.
      if (comp.inHeadline === false) continue;
      const cv = MODULE_CV[comp.id] || 0.30;
      const zIdio = _randn(nextRand);
      const z = rhoClamped * zCommon + rhoComp * zIdio;
      const factor = Math.exp(cv * z - 0.5 * cv * cv);
      total += comp.value * factor;
    }
    totals.push(total);
  }
  totals.sort((a, b) => a - b);

  // Bootstrap 90% CI on each percentile so the UI can show "P10 = 5.8M
  // [5.6–6.0M]" - i.e. the band itself has uncertainty, and that uncertainty
  // shrinks as N grows. Reuse `nextRand` so the CI is deterministic with
  // the seed.
  const ci = bootstrapR > 0 ? {
    p10: bootstrapPercentileCI(totals, 0.10, bootstrapR, nextRand),
    p50: bootstrapPercentileCI(totals, 0.50, bootstrapR, nextRand),
    p90: bootstrapPercentileCI(totals, 0.90, bootstrapR, nextRand),
  } : null;

  return {
    p10: totals[Math.floor(N * 0.10)],
    p50: totals[Math.floor(N * 0.50)],
    p90: totals[Math.floor(N * 0.90)],
    rho: rhoClamped,
    N,
    seed: normalizedSeed,
    ci,
  };
}
