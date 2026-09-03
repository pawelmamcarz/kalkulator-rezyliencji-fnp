import {
  METRICS, FEAR_METRICS, AVAILABILITY_MAX_BOOST, WYSIATI_PREMIUM,
  HIRSCHMAN_EXIT_AMPLIFIER,
  ARGYRIS_DOUBLE_LOOP_LOW, ARGYRIS_DOUBLE_LOOP_HIGH, ARGYRIS_REVENUE_IMPACT,
  NONAKA_SPIRAL_BLOCK_LOW, NONAKA_SPIRAL_BLOCK_HIGH, NONAKA_SALARY_IMPACT,
  AGENCY_MONITORING_HIGH, AGENCY_MONITORING_LOW, AGENCY_BONDING_RATE,
  MODULE_INTERACTIONS, SILENCE_WEIGHTS,
  AUTOMATIC_SILENCE_PENALTY, AUTONOMY_PASSIVITY_DAMPER,
  K_SIGMOID_DEFAULT_MULT, LEADER_SILENCE_FREQ_MULT,
  OVERLAP_CORRECTIONS, MODULE_MATURITY, ANALYTICS_ONLY_WHEN_EXCLUDED,
} from './constants.js';
import { sigmoid, getMetricValue, metricSeverity } from './sigmoid.js';
import {
  alphaFromSafety, alphaDown, hierarchyInfoLoss, asymmetricFiltering,
  directiveDistortion, optimalSpan, spanEfficiencyGap, governancePenalty,
  estimateLevels,
} from './williamson.js';
import { silenceDecomposition } from './silence.js';
import { computeWeightedProblemCost, computeTotalProblems } from './problems.js';

function _rawModules(safety, { revenue, employees, avgSalary, leaders, problemDist, hierarchyLevels, spanOfControl, recentTrauma, autonomy, overrides }) {
  // AUTHOR'S EXTENSION: unless resolved from an imported named constant, every
  // numeric conversion in this function is a structural prior. The cited
  // theories justify mechanisms and directions, not monetary magnitudes.
  const levels = hierarchyLevels || estimateLevels(employees, spanOfControl || 7);

  const O = overrides || {};
  const WYSIATI = O.WYSIATI_PREMIUM ?? WYSIATI_PREMIUM;
  const HIRSCHMAN = O.HIRSCHMAN_EXIT_AMPLIFIER ?? HIRSCHMAN_EXIT_AMPLIFIER;
  const ARGYRIS = O.ARGYRIS_REVENUE_IMPACT ?? ARGYRIS_REVENUE_IMPACT;
  const NONAKA = O.NONAKA_SALARY_IMPACT ?? NONAKA_SALARY_IMPACT;
  const AUTONOMY_DAMPER = O.AUTONOMY_PASSIVITY_DAMPER ?? AUTONOMY_PASSIVITY_DAMPER;
  const AGENCY_MON_HI = O.AGENCY_MONITORING_HIGH ?? AGENCY_MONITORING_HIGH;
  // Global multiplier on the sigmoid shape parameter `k` for every METRIC.
  // Default K_SIGMOID_DEFAULT_MULT (currently 0.4) - see constants.js for the
  // calibration rationale linking this to rozprawa §4.1.4 / §4.2.1. Override
  // via overrides.K_SIGMOID_MULT (e.g. 1.0 for raw academic deep-dive, or
  // ±25% perturbation in sensitivity analysis per rozprawa §4.1.5).
  const kMult = O.K_SIGMOID_MULT ?? K_SIGMOID_DEFAULT_MULT;

  const nLeaders = Math.max(0, Number(leaders) || 0);
  const dist = Array.isArray(problemDist) ? problemDist : [];
  const trauma = Math.max(0, Math.min(1, recentTrauma || 0));
  const autonomyClamped = Math.max(0, Math.min(1, autonomy ?? 0.5));
  const fearBoost = 1 + AVAILABILITY_MAX_BOOST * trauma;
  const mv = (key) => {
    const v = getMetricValue(key, safety, kMult);
    if (trauma > 0 && FEAR_METRICS.has(key)) {
      const m = METRICS[key];
      return m.positive ? v : Math.min(m.low, v * fearBoost);
    }
    return v;
  };

  const blameR = mv("blameRate");
  const errorFearR = mv("errorFear");
  const baseFear = errorFearR * (0.3 + 0.7 * blameR);
  const baseFearEff = baseFear * (1 + 0.3 * baseFear);
  let errorConcealmentCost = 0;
  let hiddenErrors = 0;
  for (const d of dist) {
    // Clamp to 1: hideRate is the fraction of errors concealed, so it cannot
    // exceed 1. baseFearEff peaks at 1.3 (baseFear=1), which would otherwise
    // let extreme blame/fear combos conceal more errors than exist.
    const hideRate = Math.min(1, baseFearEff * (d.concealability || 0.3));
    const hiddenInCat = employees * d.count * hideRate;
    hiddenErrors += hiddenInCat;
    errorConcealmentCost += hiddenInCat * (d.cost || 0) * ((d.lateMultiplier || 1) - 1);
  }

  const ideaSilR = mv("ideaSilence");
  const riskAvR = mv("riskAversion");
  const innovationLoss = revenue * 0.03 * (ideaSilR * 0.6 + riskAvR * 0.4); // AUTHOR'S EXTENSION

  const stabilityR = mv("teamStability");
  const climateChurn = Math.max(0, (1 - stabilityR) * 0.4 - 0.015);
  let excessChurn = climateChurn;
  const declaredTurnover = O.TURNOVER_DECLARED;
  if (Number.isFinite(declaredTurnover) && declaredTurnover >= 0) {
    const stabilityHigh = getMetricValue("teamStability", 100, kMult);
    const highChurn = Math.max(0, (1 - stabilityHigh) * 0.4 - 0.015);
    const climateExcess = Math.max(0, climateChurn - highChurn);
    const gus = O.PL_AVG_TURNOVER ?? 0.148;
    const observedExcess = Math.max(0, declaredTurnover - gus);
    const mixedExcess = 0.5 * climateExcess + 0.5 * observedExcess;
    const usedExcess = Math.min(declaredTurnover, mixedExcess);
    excessChurn = Math.min(declaredTurnover, usedExcess + highChurn);
  }
  let turnoverCost = employees * excessChurn * avgSalary * 0.75; // AUTHOR'S EXTENSION

  const voiceBlock = metricSeverity("ideaSilence", safety, kMult) * 0.5 + metricSeverity("destructiveFear", safety, kMult) * 0.5;
  turnoverCost *= (1 + HIRSCHMAN * voiceBlock);

  const burnoutR = mv("burnoutRate");
  const burnoutEff = burnoutR * (1 + 0.5 * burnoutR);
  const burnoutCost = employees * burnoutEff * avgSalary * 0.25; // AUTHOR'S EXTENSION

  const passivR = mv("passivity");
  const snitchR = mv("snitchPerc");
  const passivEff = passivR * (1 + 0.4 * passivR);
  const hourlyRate = avgSalary / 230 / 8;
  const passivityCost = employees * 0.05 * passivEff * hourlyRate * 8 * 230 * (1 + snitchR)
    * (1 - AUTONOMY_DAMPER * autonomyClamped); // Adamska (2015): autonomy reduces passivity

  const helpR = mv("helpComfort");
  const avgProblemCost = computeWeightedProblemCost(problemDist);
  const helpDeficitCost = employees * (1 - helpR) * 2 * avgProblemCost * 0.5; // AUTHOR'S EXTENSION

  const destructFear = mv("destructiveFear");
  // AUTHOR'S EXTENSION: frequency multiplier tuned for face validity against
  // the dissertation scenario in §4.2.1 (5M PLN przy s=41,
  // 100 liderów × 150K/epizod = 0.33 epizodu/lider/rok; destructFear ≈ 0.52
  // → mnożnik 0.6). Zastąpiony default 2.5 (4× za wysoki vs rozprawa).
  const leaderSilenceFreqMult = O.LEADER_SILENCE_FREQ_MULT ?? LEADER_SILENCE_FREQ_MULT;
  const leaderSilenceFreq = destructFear * leaderSilenceFreqMult;
  const leaderSilenceCost = nLeaders * leaderSilenceFreq * 150_000; // AUTHOR'S EXTENSION

  const complianceRiskCost = revenue * 0.005 * (1 - mv("procedureUse")); // AUTHOR'S EXTENSION

  // ── Williamson hierarchy module - HEURISTIC, not direct measurement ──
  // Williamson's α^n is a fidelity coefficient (probability in [0,1]). It is
  // dimensionally NOT a wage multiplier. The two scalars below - 0.005 of
  // revenue (bottom-up) and 0.15 of payroll × 0.20 distortion (top-down) -
  // carry the actual magnitude. They are author-assigned conversions from
  // information-fidelity loss to złoty. Treat the result as a Williamson-
  // INSPIRED estimate of the cost channel's order of magnitude, not as an
  // empirically calibrated price tag on lost signal.
  const filtering = asymmetricFiltering(levels, safety);
  const infoLoss = hierarchyInfoLoss(levels, safety);
  const bottomUpCost = revenue * 0.005 * infoLoss * (1 - filtering.badNewsReaching) * (1 + WYSIATI);

  const dirLoss = directiveDistortion(levels, safety);
  const topDownCost = employees * 0.15 * avgSalary * dirLoss * 0.20;

  // Akerlof adverse-selection premium was retired post-audit (redundant with
  // the alpha^n information-loss channel), see rozprawa section 4.2.3a.
  const hierarchyLossCost = bottomUpCost + topDownCost;

  const govPenalty = governancePenalty(employees, levels);
  const safetyGovReduction = sigmoid(safety, 0.2, 0.8);
  const bureaucraticOverhead = employees * avgSalary * 0.02 * Math.max(0, govPenalty - 1) * (1 - safetyGovReduction); // AUTHOR'S EXTENSION

  const opportunismRate = sigmoid(safety, 0.25, 0.03);
  const opportunismCost = employees * opportunismRate * avgSalary * 0.05; // AUTHOR'S EXTENSION

  const actualSpan = spanOfControl || 7;
  const spanGap = spanEfficiencyGap(actualSpan, safety);
  const spanCost = spanGap > 0 ? employees * avgSalary * 0.01 * spanGap * levels : 0; // AUTHOR'S EXTENSION

  const governanceOverhead = bureaucraticOverhead + opportunismCost + spanCost;

  const doubleLoopRate = sigmoid(safety, ARGYRIS_DOUBLE_LOOP_LOW, ARGYRIS_DOUBLE_LOOP_HIGH);
  const learningDeficitCost = revenue * ARGYRIS * (1 - doubleLoopRate);

  const spiralBlock = sigmoid(safety, NONAKA_SPIRAL_BLOCK_LOW, NONAKA_SPIRAL_BLOCK_HIGH);
  const knowledgeLossCost = employees * avgSalary * NONAKA * spiralBlock;

  const monitoringRate = sigmoid(safety, AGENCY_MON_HI, AGENCY_MONITORING_LOW);
  const bondingCost = employees * avgSalary * AGENCY_BONDING_RATE * (1 - safety / 100);
  const agencyOverheadCost = employees * avgSalary * monitoringRate * 0.15 + bondingCost;

  // ── Overlap correction (DECORRELATION) ──
  // The 13 modules share variance - see OVERLAP_CORRECTIONS in constants.js
  // for the per-module factors and rationale. Applied here so excess()
  // (safety vs safety=100 baseline) consistently nets the correction out.
  // OVERLAP_GLOBAL is a scalar multiplier on the entire correction matrix,
  // exposed via overrides for sensitivity analysis (DK-5 audit).
  const oc = O.OVERLAP_CORRECTIONS ?? OVERLAP_CORRECTIONS;
  const og = O.OVERLAP_GLOBAL ?? 1;
  return {
    errorConcealmentCost: errorConcealmentCost * (oc.errors ?? 1) * og,
    hiddenErrors,
    innovationLoss:       innovationLoss       * (oc.innovation ?? 1) * og,
    turnoverCost:         turnoverCost         * (oc.turnover ?? 1) * og,
    burnoutCost:          burnoutCost          * (oc.burnout ?? 1) * og,
    passivityCost:        passivityCost        * (oc.passivity ?? 1) * og,
    helpDeficitCost:      helpDeficitCost      * (oc.help ?? 1) * og,
    leaderSilenceCost:    leaderSilenceCost    * (oc.leader ?? 1) * og,
    complianceRiskCost:   complianceRiskCost   * (oc.compliance ?? 1) * og,
    hierarchyLossCost:    hierarchyLossCost    * (oc.hierarchy ?? 1) * og,
    governanceOverhead:   governanceOverhead   * (oc.governance ?? 1) * og,
    learningDeficitCost:  learningDeficitCost  * (oc.learningDeficit ?? 1) * og,
    knowledgeLossCost:    knowledgeLossCost    * (oc.knowledgeLoss ?? 1) * og,
    agencyOverheadCost:   agencyOverheadCost   * (oc.agencyOverhead ?? 1) * og,
  };
}

export function computeCosts(params) {
  // Team-segment mode (Edmondson 1999 is a team-level construct; firm-wide
  // BP averages underestimate cost when inter-team variance is high due to
  // Jensen's inequality on convex cost functions). When the user supplies
  // `teamSegments`, we compute costs per segment and sum. Each segment is
  // treated as an independent sub-organization that inherits all company
  // parameters EXCEPT employees/revenue/leaders/safety, which are scaled
  // proportionally to segment size.
  if (Array.isArray(params.teamSegments) && params.teamSegments.length > 0) {
    return _computeCostsSegmented(params);
  }
  return _computeCostsAggregate(params);
}

function _computeCostsAggregate(params) {
  const { hierarchyLevels, spanOfControl, safety } = params;
  const levels = hierarchyLevels || estimateLevels(params.employees, spanOfControl || 7);
  // kMult is resolved inside _rawModules (via O.K_SIGMOID_MULT ?? K_SIGMOID_DEFAULT_MULT).
  // The line below is kept only to propagate kMult to metricSeverity calls below;
  // default is K_SIGMOID_DEFAULT_MULT (0.4), not 1 - matching _rawModules behavior.
  const O = params.overrides || {};
  const kMult = O.K_SIGMOID_MULT ?? K_SIGMOID_DEFAULT_MULT;

  const at = _rawModules(safety, params);
  const base = _rawModules(100, params);

  const excess = (key) => Math.max(0, at[key] - base[key]);

  const errorConcealmentCost = excess("errorConcealmentCost");
  const innovationLoss       = excess("innovationLoss");
  const turnoverCost         = excess("turnoverCost");
  const burnoutCost          = excess("burnoutCost");
  const passivityCost        = excess("passivityCost");
  const helpDeficitCost      = excess("helpDeficitCost");
  const leaderSilenceCost    = excess("leaderSilenceCost");
  const complianceRiskCost   = excess("complianceRiskCost");
  const hierarchyLossCost    = excess("hierarchyLossCost");
  const governanceOverhead   = excess("governanceOverhead");
  const learningDeficitCost  = excess("learningDeficitCost");
  const knowledgeLossCost    = excess("knowledgeLossCost");
  const agencyOverheadCost   = excess("agencyOverheadCost");
  const hiddenErrors         = excess("hiddenErrors");

  const filtering = asymmetricFiltering(levels, safety);
  const infoLoss  = hierarchyInfoLoss(levels, safety);
  const dirLoss   = directiveDistortion(levels, safety);
  const govPenalty = governancePenalty(params.employees, levels);
  const sOpt       = optimalSpan(safety);
  const actualSpan = spanOfControl || 7;
  const spanGap    = spanEfficiencyGap(actualSpan, safety);
  const opportunismRate = sigmoid(safety, 0.25, 0.03);

  // Legacy field name: confidenceTier ranks support for the mechanism, not
  // confidence in the monetary amount. A means a comparatively direct
  // mechanism/construct anchor, B a related proxy, and C a theory-inspired
  // hypothesis. Every monetary conversion below still contains author priors.
  const components = [
    { id: "errors",     confidenceTier: "A", label: "Ukrywanie błędów",                labelEn: "Error concealment",           value: errorConcealmentCost, icon: "🚨", color: "#dc2626" },
    { id: "innovation", confidenceTier: "B", label: "Utrata innowacyjności",           labelEn: "Innovation loss",             value: innovationLoss,       icon: "💡", color: "#ea580c" },
    { id: "turnover",   confidenceTier: "A", label: "Nadmierna rotacja",               labelEn: "Excess turnover",             value: turnoverCost,         icon: "🚪", color: "#d97706" },
    { id: "burnout",    confidenceTier: "A", label: "Wypalenie / presenteeism",        labelEn: "Burnout / presenteeism",      value: burnoutCost,          icon: "🔥", color: "#b91c1c" },
    { id: "passivity",  confidenceTier: "B", label: "Bierność i silosy",               labelEn: "Passivity & silos",           value: passivityCost,        icon: "🤐", color: "#9333ea" },
    { id: "help",       confidenceTier: "B", label: "Deficyt proszenia o pomoc",       labelEn: "Help-seeking deficit",        value: helpDeficitCost,      icon: "🆘", color: "#0284c7" },
    { id: "leader",     confidenceTier: "C", label: "Milczenie liderów",               labelEn: "Leader silence",              value: leaderSilenceCost,    icon: "👔", color: "#be185d" },
    { id: "compliance", confidenceTier: "B", label: "Ślepota proceduralna",            labelEn: "Procedure blindness",         value: complianceRiskCost,   icon: "📋", color: "#475569" },
    { id: "hierarchy",  confidenceTier: "C", label: "Straty kontroli Williamson",        labelEn: "Williamson control loss",     value: hierarchyLossCost,    icon: "🏢", color: "#7c3aed",
      sub: `α↑=${alphaFromSafety(safety).toFixed(2)} α↓=${alphaDown(safety).toFixed(2)}, ${levels}L, info↑${(infoLoss * 100).toFixed(0)}% dir↓${(dirLoss * 100).toFixed(0)}%` },
    { id: "governance", confidenceTier: "B", label: "Governance + oportunizm (TCE)",   labelEn: "Governance + opportunism (TCE)", value: governanceOverhead, icon: "⚖️", color: "#0e7490",
      sub: `penalty=${govPenalty.toFixed(1)}x, s*=${sOpt} vs s=${actualSpan}, opp=${(opportunismRate * 100).toFixed(0)}%` },
    { id: "learningDeficit", confidenceTier: "C", label: "Deficyt uczenia się (Argyris)",  labelEn: "Learning deficit (Argyris)",        value: learningDeficitCost,  icon: "🔄", color: "#059669" },
    { id: "knowledgeLoss",   confidenceTier: "C", label: "Blokada spirali wiedzy (Nonaka)", labelEn: "Knowledge spiral block (Nonaka)",   value: knowledgeLossCost,    icon: "🧠", color: "#6366f1" },
    { id: "agencyOverhead",  confidenceTier: "C", label: "Koszty agencji (Jensen-Meckling)", labelEn: "Agency overhead (Jensen-Meckling)", value: agencyOverheadCost,   icon: "🔍", color: "#a21caf" },
  ];

  // Amplifications are computed from the pre-interaction values and applied
  // in batch so the result is invariant under the order of MODULE_INTERACTIONS.
  const interactionEffects = [];
  const baseValues = new Map(components.map(c => [c.id, c.value]));
  const amplifications = new Map();
  const interactions = O.MODULE_INTERACTIONS ?? MODULE_INTERACTIONS;
  for (const { fromMetric, toId, w } of interactions) {
    const sev = metricSeverity(fromMetric, safety, kMult);
    if (sev <= 0.01) continue;
    const base = baseValues.get(toId);
    if (base === undefined) continue;
    const amp = base * w * sev;
    amplifications.set(toId, (amplifications.get(toId) || 0) + amp);
    interactionEffects.push({ from: fromMetric, to: toId, sev: sev.toFixed(2), amp });
  }
  for (const comp of components) {
    const totalAmp = amplifications.get(comp.id);
    if (totalAmp) comp.value += totalAmp;
  }

  const silence = silenceDecomposition(safety, params.autonomy ?? 0.5);
  const silenceTotal = silence.defensive + silence.acquiescent + silence.prosocial;
  if (silenceTotal > 0.01) {
    const defS = silence.defensive / silenceTotal;
    const acqS = silence.acquiescent / silenceTotal;
    const proS = silence.prosocial / silenceTotal;
    for (const comp of components) {
      const w = SILENCE_WEIGHTS[comp.id];
      if (w) comp.value *= (defS * w.def + acqS * w.acq + proS * w.pro);
    }
  }

  // Adamska (2016): automatic silence harder to address → penalty - AUTHOR'S EXTENSION
  const autoSilencePenalty = params.overrides?.AUTOMATIC_SILENCE_PENALTY ?? AUTOMATIC_SILENCE_PENALTY;
  if (silence.automaticShare > 0.01) {
    for (const comp of components) {
      comp.value *= (1 + autoSilencePenalty * silence.automaticShare);
    }
  }

  const sumBeforePeak = components.reduce((s, c) => s + c.value, 0);
  // Flag the largest cost module (isPeak) for callers that want to highlight
  // it. The peak-end premium was retired post-audit (peak-end is a
  // memory-of-experience effect, not an accounting cost) and is no longer
  // perturbed by sensitivityReport, so nothing is added to the total here.
  const peakModule = components.reduce((max, c) => c.value > max.value ? c : max, components[0]);
  if (peakModule && peakModule.value > 0) peakModule.isPeak = true;

  // ── Maturity / scope layer (AUTHOR'S EXTENSION) ──
  // scopeMode 'full' (default) reproduces the historical totalTax exactly, so
  // dissertation snapshots and CALIBRATION_MODES tests stay green. 'conservative'
  // keeps only `validated` modules in the headline; beta/experimental are
  // surfaced separately as "potential after validation". See
  // docs/DESIGN_maturity_scope_mode.md.
  const scopeMode = params.scopeMode || "full";
  for (const c of components) {
    c.maturity = MODULE_MATURITY[c.id] || "experimental";
    c.inHeadline = scopeMode === "full" ? true : c.maturity === "validated";
    c.analyticsOnly = !c.inHeadline && ANALYTICS_ONLY_WHEN_EXCLUDED.has(c.id);
  }

  const totalTax = components.reduce((s, c) => s + (c.inHeadline ? c.value : 0), 0);
  const totalTaxFull = components.reduce((s, c) => s + c.value, 0);
  const betaPotential = components.reduce((s, c) => s + (!c.inHeadline && c.maturity === "beta" ? c.value : 0), 0);
  const experimentalPotential = components.reduce((s, c) => s + (!c.inHeadline && c.maturity === "experimental" ? c.value : 0), 0);

  const coaseBoundaryRatio = params.revenue > 0 ? totalTax / (params.revenue * 0.05) : 0;

  // Decomposition of safety's effect on totalTax - separates the structural
  // (Williamson α^n) channel from the behavioral (sigmoid metrics) channel so
  // readers can see there is no double-counting: both axes measure distinct
  // consequences of the same underlying construct.
  const hierarchyComp = components.find(c => c.id === "hierarchy");
  const viaAlpha = hierarchyComp ? hierarchyComp.value : 0;
  const viaInteractions = interactionEffects.reduce((s, e) => s + e.amp, 0);
  const viaDirectMetrics = Math.max(0, sumBeforePeak - viaAlpha - viaInteractions);

  return {
    components, totalTax, hiddenErrors, totalProblems: params.employees * computeTotalProblems(params.problemDist),
    scopeMode, totalTaxFull, betaPotential, experimentalPotential,
    coaseBoundaryRatio,
    peakModule: peakModule?.id,
    decomposition: {
      viaAlpha,
      viaDirectMetrics,
      viaInteractions,
      viaPeakEnd: 0,
    },
    silenceShares: silenceTotal > 0.01 ? {
      defensive: silence.defensive / silenceTotal,
      acquiescent: silence.acquiescent / silenceTotal,
      prosocial: silence.prosocial / silenceTotal,
    } : { defensive: 0.33, acquiescent: 0.33, prosocial: 0.33 },
    hierarchyAnalytics: {
      levels, alphaUp: alphaFromSafety(safety), alphaDown: alphaDown(safety),
      infoLoss, directiveLoss: dirLoss, filtering, govPenalty,
      optimalSpan: sOpt, actualSpan, spanGap, opportunismRate,
    },
    silenceTypes: silence,
    mechanismDimension: { automaticShare: silence.automaticShare, tacticalShare: silence.tacticalShare },
    interactionEffects,
    segmentMode: false,
  };
}

// Normalize teamSegments: compute each segment's employee count,
// then scale the whole distribution so that sum(seg.employees) == params.employees.
// This lets the user define segments in "teams × avg size" terms without
// having to manually balance to the company headcount.
function normalizeTeamSegments(segments, totalEmployees) {
  if (!Array.isArray(segments) || segments.length === 0) return [];
  const enriched = segments.map((seg, i) => ({
    id: seg.id ?? `seg_${i}`,
    label: seg.label ?? `Segment ${i + 1}`,
    safety: Math.max(0, Math.min(100, Number(seg.safety) || 50)),
    count: Math.max(0, Number(seg.count) || 0),
    avgSize: Math.max(0, Number(seg.avgSize) || 0),
    rawEmployees: Math.max(0, (Number(seg.count) || 0) * (Number(seg.avgSize) || 0)),
  }));
  const sumRaw = enriched.reduce((s, seg) => s + seg.rawEmployees, 0);
  if (sumRaw <= 0 || totalEmployees <= 0) return [];
  const scale = totalEmployees / sumRaw;
  return enriched.map(seg => ({
    id: seg.id,
    label: seg.label,
    safety: seg.safety,
    count: seg.count,
    avgSize: seg.avgSize,
    employees: Math.max(1, Math.round(seg.rawEmployees * scale)),
  }));
}

function _computeCostsSegmented(params) {
  const segments = normalizeTeamSegments(params.teamSegments, params.employees);
  if (segments.length === 0) return _computeCostsAggregate(params);

  const totalEmp = segments.reduce((s, seg) => s + seg.employees, 0);
  const weightedAvgSafety = totalEmp > 0
    ? segments.reduce((s, seg) => s + seg.safety * seg.employees, 0) / totalEmp
    : (params.safety ?? 50);

  // Compute each segment as a sub-company. Scale revenue, leaders, and
  // problemDist counts proportionally to segment size. Each segment sees
  // the company's hierarchy, governance, and behavioral parameters as-is
  // (those are org-level and apply uniformly).
  const segmentResults = segments.map(seg => {
    const segShare = params.employees > 0 ? seg.employees / params.employees : 0;
    const segParams = {
      ...params,
      safety: seg.safety,
      employees: seg.employees,
      revenue: params.revenue * segShare,
      leaders: Math.max(0, Math.round(params.leaders * segShare)),
      // problemDist counts are per-employee rates (the aggregate path
      // multiplies them by `employees`), so they must NOT be rescaled here.
      // Scaling them by segShare on top of the per-segment headcount made
      // error/help costs go as segShare^2 and the segment sum undershoot
      // the aggregate (grilling 2026-06-09, M-axis finding).
      problemDist: params.problemDist,
      teamSegments: null, // break recursion - go aggregate path
    };
    return _computeCostsAggregate(segParams);
  });

  // Aggregate 13 component values across segments (sum in PLN). Preserve
  // display metadata from the first segment's components (label, icon, color).
  const template = segmentResults[0].components;
  const components = template.map(templateComp => {
    const aggValue = segmentResults.reduce((s, r) => {
      const match = r.components.find(c => c.id === templateComp.id);
      return s + (match ? match.value : 0);
    }, 0);
    return { ...templateComp, value: aggValue, isPeak: false };
  });

  // Recompute peak marker on aggregated values (the per-segment peak-end
  // premium is already baked into each component via _computeCostsAggregate).
  const peakModule = components.reduce((max, c) => c.value > max.value ? c : max, components[0]);
  if (peakModule) peakModule.isPeak = true;

  // Maturity-aware headline (template components carry maturity/inHeadline from
  // _computeCostsAggregate under the same scopeMode). Default 'full' → every
  // component inHeadline → totalTax unchanged.
  const totalTax = components.reduce((s, c) => s + (c.inHeadline !== false ? c.value : 0), 0);
  const totalTaxFull = components.reduce((s, c) => s + c.value, 0);
  const betaPotential = components.reduce((s, c) => s + (c.inHeadline === false && c.maturity === "beta" ? c.value : 0), 0);
  const experimentalPotential = components.reduce((s, c) => s + (c.inHeadline === false && c.maturity === "experimental" ? c.value : 0), 0);
  const hiddenErrors = segmentResults.reduce((s, r) => s + (r.hiddenErrors || 0), 0);

  // Analytics fields use a lightweight aggregate call at the weighted-avg
  // safety. This is purely for display (hierarchy α, silence shares, span
  // gap) - it does NOT contribute to the cost number, which comes from the
  // segment sum above. Calling the aggregate path with teamSegments: null
  // avoids infinite recursion.
  const analyticsView = _computeCostsAggregate({
    ...params,
    safety: weightedAvgSafety,
    teamSegments: null,
  });

  return {
    components,
    totalTax,
    hiddenErrors,
    totalProblems: params.employees * computeTotalProblems(params.problemDist),
    scopeMode: params.scopeMode || "full",
    totalTaxFull, betaPotential, experimentalPotential,
    coaseBoundaryRatio: params.revenue > 0 ? totalTax / (params.revenue * 0.05) : 0,
    peakModule: peakModule?.id,
    silenceShares: analyticsView.silenceShares,
    hierarchyAnalytics: analyticsView.hierarchyAnalytics,
    silenceTypes: analyticsView.silenceTypes,
    mechanismDimension: analyticsView.mechanismDimension,
    interactionEffects: segmentResults.flatMap(r => r.interactionEffects || []),
    segmentMode: true,
    weightedAvgSafety,
    segmentResults: segments.map((seg, i) => ({
      id: seg.id,
      label: seg.label,
      employees: seg.employees,
      safety: seg.safety,
      totalTax: segmentResults[i].totalTax,
      taxPerEmployee: seg.employees > 0 ? segmentResults[i].totalTax / seg.employees : 0,
      topModule: segmentResults[i].peakModule,
    })),
  };
}
