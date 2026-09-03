// Constants extracted from src/logic.js (Path D1)

export const METRICS = {
  blameRate:      { low: 0.72, high: 0.02, k: 0.12, mid: 45, label: "Kultura obwiniania",           labelEn: "Blame culture",                unit: "%", src: "72% vs 2%" },
  errorFear:      { low: 0.72, high: 0.05, k: 0.10, mid: 48, label: "Ukrywanie błędów",             labelEn: "Error concealment",            unit: "%", src: "42% ogół, 72% low" },
  teamStability:  { low: 0.59, high: 0.85, k: 0.07, mid: 52, label: "Stabilność zespołu",           labelEn: "Team stability",               unit: "%", src: "59% vs 85%", positive: true },
  helpComfort:    { low: 0.21, high: 0.99, k: 0.08, mid: 52, label: "Komfort proszenia o pomoc",    labelEn: "Comfort asking for help",      unit: "%", src: "21% vs 99%", positive: true },
  burnoutRate:    { low: 0.51, high: 0.08, k: 0.06, mid: 55, label: "Wypalenie zawodowe",           labelEn: "Burnout rate",                 unit: "%", src: "51% low, est. 8% high" },
  ideaSilence:    { low: 0.52, high: 0.10, k: 0.09, mid: 48, label: "Milczenie z pomysłami",        labelEn: "Idea silence",                 unit: "%", src: "52% vs 10%" },
  passivity:      { low: 0.59, high: 0.08, k: 0.07, mid: 50, label: "Bierność ('nie wtrącam się')", labelEn: "Passivity ('not my concern')", unit: "%", src: "59% low" },
  riskAversion:   { low: 0.70, high: 0.15, k: 0.08, mid: 50, label: "Unikanie ryzyka",             labelEn: "Risk aversion",                unit: "%", src: "56% ogół, 70% low" },
  procedureUse:   { low: 0.39, high: 0.79, k: 0.06, mid: 55, label: "Znajomość procedur",          labelEn: "Procedure knowledge",          unit: "%", src: "39% vs 79%", positive: true },
  snitchPerc:     { low: 0.55, high: 0.10, k: 0.10, mid: 45, label: "Usprawnienie = donosicielstwo",labelEn: "Improvement = informing",      unit: "%", src: "5% vs 41% neg" },
  workJoy:        { low: 0.19, high: 0.70, k: 0.07, mid: 52, label: "Pracuje się wspaniale",        labelEn: "Great place to work",          unit: "%", src: "19% vs 70%", positive: true },
  destructiveFear:{ low: 0.74, high: 0.19, k: 0.11, mid: 45, label: "Destrukcyjny lęk",            labelEn: "Destructive anxiety",          unit: "%", src: "74% vs 19%" },
};

// Endpoint values above are attributed to the private Ipsos/FNP report and
// remain PRIVATE-SOURCE PENDING until its tables are audited. Every `k` and
// `mid` value is an AUTHOR'S EXTENSION. Do not describe the curves as fitted.
export const METRIC_ENDPOINT_STATUS = "private-source-pending";
export const METRIC_SHAPE_STATUS = "author-prior";

// AUTHOR'S EXTENSION - Kahneman (2011) motivates the direction and existence
// of each bias, not these magnitudes; the numeric values are the author's
// operationalization, not figures from the book.
export const LOSS_AVERSION_SHIFT = 4;
export const WYSIATI_PREMIUM = 0.20;
export const AVAILABILITY_MAX_BOOST = 0.20;
// OVERCONFIDENCE_GAP - UI warning only, never read by the computation path
// (computeCosts, computeCostsMC, sensitivityReport). Surfaces Edmondson (2019)
// finding that leaders self-rate PS ~10–15 pts higher than their employees.
export const OVERCONFIDENCE_GAP = 12;
// PEAK_END_PREMIUM - DISABLED. Kahneman-Redelmeier (1993) peak-end rule
// describes retrospective MEMORY of experience, not cost summation. Applying
// it as a +10% uplift on the largest cost module conflated cognitive bias with
// accounting. Removed from the cost path. Kept as `0` so historical override
// inputs do not break, but the value never moves the headline.
export const PEAK_END_PREMIUM = 0;
// AUTHOR'S EXTENSION - status quo bias is Kahneman/Samuelson-Zeckhauser
// theory; the 0.15 friction value is the author's estimate.
export const STATUS_QUO_FRICTION = 0.15;

// AUTHOR'S EXTENSION block: each constant below operationalizes a classic
// framework (Hirschman 1970, Jensen & Meckling 1976, Argyris 1977, Nonaka &
// Takeuchi 1995). The source texts establish the mechanism, NOT these
// numbers - the magnitudes are the author's calibration estimates.
export const HIRSCHMAN_EXIT_AMPLIFIER = 0.15;
export const AGENCY_MONITORING_HIGH = 0.08;
export const AGENCY_MONITORING_LOW = 0.02;
export const AGENCY_BONDING_RATE = 0.01;
export const ARGYRIS_DOUBLE_LOOP_LOW = 0.10;
export const ARGYRIS_DOUBLE_LOOP_HIGH = 0.65;
export const ARGYRIS_REVENUE_IMPACT = 0.005;
// AKERLOF_ADVERSE_SELECTION_PREMIUM - DISABLED. Akerlof (1970) "lemons" model
// is a market-level adverse-selection mechanism (good types exit a pooled
// market). Applying a +15% premium *only* to the Williamson hierarchy module
// - not to other information-asymmetry modules (governance, agency, knowledge)
// - was both selectively unmotivated and substantively redundant with the
// α^n information loss already inside that module. Removed.
export const AKERLOF_ADVERSE_SELECTION_PREMIUM = 0;
// AUTHOR'S EXTENSION - SECI spiral blockage shares and salary impact are the
// author's estimates; Nonaka & Takeuchi (1995) provide no such coefficients.
export const NONAKA_SPIRAL_BLOCK_LOW = 0.40;
export const NONAKA_SPIRAL_BLOCK_HIGH = 0.08;
export const NONAKA_SALARY_IMPACT = 0.01;

// ── Calibration mode presets (CONSERVATIVE / BASE / AGGRESSIVE) ──
// Three operating points for sensitivity-aware communication. `base` is the
// AUTHOR'S EXTENSION. The base setting was tuned for scenario face validity,
// not estimated from organization-level observations. The other
// two move every load-bearing prior simultaneously to the lower / upper end of
// its plausible range, producing a "what if every prior is wrong in the same
// direction" stress test. UI default is `base`; users can switch to read the
// headline as a range, not a point.
//
// Boundaries reflect the ±25% / ±50% perturbation bands documented in §4.1.5
// for each parameter, capped by the dimensional plausibility of each constant.
export const CALIBRATION_MODES = {
  conservative: {
    label: "Konserwatywny",
    labelEn: "Conservative",
    description: "Dolne granice priorów, ostrożny scenariusz strukturalny.",
    descriptionEn: "Lower-bound priors, conservative structural scenario.",
    overrides: {
      K_SIGMOID_MULT: 0.30,
      HIRSCHMAN_EXIT_AMPLIFIER: 0.10,
      AGENCY_MONITORING_HIGH: 0.06,
      AUTOMATIC_SILENCE_PENALTY: 0.04,
      LEADER_SILENCE_FREQ_MULT: 0.45,
      ARGYRIS_REVENUE_IMPACT: 0.0035,
      NONAKA_SALARY_IMPACT: 0.007,
    },
  },
  base: {
    label: "Bazowy prior strukturalny",
    labelEn: "Base structural prior",
    description: "Wartości bazowe przyjęte do analizy scenariuszowej.",
    descriptionEn: "Base values adopted for scenario analysis.",
    overrides: {}, // no overrides - uses constants.js defaults
  },
  aggressive: {
    label: "Agresywny",
    labelEn: "Aggressive",
    description: "Górne granice priorów, agresywny scenariusz strukturalny.",
    descriptionEn: "Upper-bound priors, aggressive structural scenario.",
    overrides: {
      K_SIGMOID_MULT: 0.60,
      HIRSCHMAN_EXIT_AMPLIFIER: 0.20,
      AGENCY_MONITORING_HIGH: 0.10,
      AUTOMATIC_SILENCE_PENALTY: 0.12,
      LEADER_SILENCE_FREQ_MULT: 0.75,
      ARGYRIS_REVENUE_IMPACT: 0.0065,
      NONAKA_SALARY_IMPACT: 0.013,
    },
  },
};

// ── Module overlap corrections (PER-MODULE EXPERT-ESTIMATED SCALE) ──
// The 13 cost modules are 13 lenses on roughly 5–6 underlying phenomena, not
// 13 disjoint cost pools. A naive sum double-counts the same lost złoty across
// modules. The factors below SCALE modules where overlap is strongest,
// leaving the dominant counterpart at 1.0.
//
// Honest framing (per peer audit by Karolina, data scientist HR-tech): this is
// **not formal decorrelation** in the statistical sense (no Cholesky on a
// covariance matrix, no residualization, no structural-equation latent factor).
// It is a per-module multiplicative scale chosen by expert estimate to net out
// the most blatant overlap (e.g. burnout-driven exits already counted in
// turnover, learning-failure already counted in α^n + agency). A more rigorous
// approach would require either (a) a covariance matrix from real out-of-sample
// firm data - not yet available, planned for Phase A validation - or (b) a
// latent-factor SEM (PS as one factor, 13 modules as observed loadings),
// which moves the model out of TCE-tradition framing.
//
// Estimates triangulated from internal model audit + dissertation §4.2.3:
//   burnout         × 0.75  - burnout-driven exits already in `turnover`
//   passivity       × 0.70  - withheld effort already in `innovation`
//   help            × 0.70  - problem surfacing already in `errors`
//   leader          × 0.70  - C-suite dysfunction already in `governance`
//   learningDeficit × 0.40  - Argyris feedback failure already in α^n + agency
//   knowledgeLoss   × 0.70  - SECI block already in `help` + `learningDeficit`
//   agencyOverhead  × 0.50  - monitoring/bonding already in `governance` + α^n
// Applied multiplicatively in _rawModules so excess() (subtraction of the
// safety=100 baseline) cancels the correction factor consistently.
export const OVERLAP_CORRECTIONS = {
  errors:          1.00,
  innovation:      1.00,
  turnover:        1.00,
  burnout:         0.75,
  passivity:       0.70,
  help:            0.70,
  leader:          0.70,
  compliance:      1.00,
  hierarchy:       1.00,
  governance:      1.00,
  learningDeficit: 0.40,
  knowledgeLoss:   0.70,
  agencyOverhead:  0.50,
};

// ── Adamska (2016): Mechanism dimension - AUTHOR'S EXTENSION ──
// Automatic silence ("being silenced") is below awareness threshold,
// harder to address, persists longer → compounding costs
export const AUTOMATIC_SILENCE_PENALTY = 0.08;

// ── Adamska (2015): Autonomy moderator - AUTHOR'S EXTENSION ──
// Greater autonomy → less passivity, shifts silence from automatic to tactical
export const AUTONOMY_PASSIVITY_DAMPER = 0.25;

// ── Voice quality floor - AUTHOR'S EXTENSION inspired by Maynes & Podsakoff (2014) ──
// Maynes & Podsakoff (2014) is a CONSTRUCT paper distinguishing four voice
// types (supportive, constructive, defensive, destructive). It does NOT
// publish per-intervention "effectiveness multipliers". The 0.65–0.90 values
// on each item in INTERVENTIONS below, and the 0.50 floor here, are
// author-assigned magnitudes ranking interventions on a Maynes-Podsakoff-
// inspired axis (clarity of voice channel + pro-social orientation).
export const VOICE_QUALITY_FLOOR = 0.50;

// ── Sigmoid steepness default (CALIBRATION) ──
// Rozprawa §4.1.4 nazywa parametr k "narzuconym priorem strukturalnym" - bez
// zakotwiczenia empirycznego, ponieważ brak jest obserwacji w pośrednich
// kwartylach BP umożliwiających fitowanie krzywej. Default 1.0 produkował
// krzywą zbyt stromą: przy s=41 (PL avg, Ipsos 2026) tax = 25.4% rev podczas
// gdy rozprawa §4.2.1 sc.1 broni 13–14% rev jako kalibracji wobec
// face-validity references (Crosby, SHRM and Gallup are broader constructs and
// are not calibration targets). Spłaszczenie
// k do 0.4 dopasowuje toxic scenariusz (s=15: 27%) do rozprawy 24–28%
// i znacząco przybliża PL avg (s=41: 17% z 25%) do 13–14%.
// Sensitivity (measured 2026-06-09): ±25% k = +11% / −13% total.
// Per-moduł k pozostaje w METRICS jako mnożnik bazowy (0.06–0.12).
export const K_SIGMOID_DEFAULT_MULT = 0.4;

// ── Leader silence frequency multiplier (CALIBRATION) ──
// NOTE (grilling 2026-06-09, ust. 8): the calibration below was done at the
// RAW module level (100 × 0.513 × 0.6 × 150K = 4.62M), but the downstream
// pipeline (excess-over-baseline, overlap 0.70, silence weights) reduces the
// final module to ~1.93M = ~3.0% of headline. The current dissertation
// (04_walidacja §4.2) declares ~3%, so the "~5M / 7-10%" target quoted below
// reflects an OLD dissertation requirement and is kept only as the historical
// derivation of the 0.6 value.
// Rozprawa §4.2.1 sc.1 (firma referencyjna, s=41) wymagała ~5M PLN leader silence
// (7–10% × 67M total). Przy 100 liderach × 150K PLN/epizod
// (CLAUDE.md: 400–800K PLN/epizod, dolny zakres) = 33 epizody/rok =
// 0.33 epizodu/lider/rok. destructiveFear przy s=41 ≈ 0.52 (z sigmoidy METRICS),
// więc poprawny mnożnik freq = 0.33 / 0.52 ≈ 0.6. Stara wartość 2.5 dawała
// 1.31 epizodu/lider/rok - 4× za dużo wobec scenariusza rozprawy.
// Zmiana wpływa proporcjonalnie na wszystkie scenariusze (s=15 i s=85 też).
export const LEADER_SILENCE_FREQ_MULT = 0.6;

export const TCE_FRAMEWORK = {
  errors:      { concept: "monitoring", tceLabel: "Monitoring & quality assurance cost", theories: ["Williamson 1967", "Reason 1990"] },
  innovation:  { concept: "quasi-rents", tceLabel: "Lost quasi-rents from unexploited knowledge", theories: ["Williamson 1975", "Argyris 1977"] },
  turnover:    { concept: "asset-specificity", tceLabel: "Transaction-specific human capital loss", theories: ["Williamson 1975", "Hirschman 1970"] },
  burnout:     { concept: "bounded-rationality", tceLabel: "Bounded rationality amplified by stress", theories: ["Williamson 1975", "Kahneman 2011"] },
  passivity:   { concept: "shirking", tceLabel: "Shirking under incomplete contracts", theories: ["Williamson 1975", "Jensen & Meckling 1976"] },
  help:        { concept: "knowledge-specificity", tceLabel: "Knowledge as specific asset - blocked transfer", theories: ["Williamson 1975", "Nonaka 1995"] },
  leader:      { concept: "strategic-opportunism", tceLabel: "Strategic opportunism & agency problem", theories: ["Williamson 1996", "Jensen & Meckling 1976"] },
  procedures:  { concept: "governance", tceLabel: "Governance gap - formal vs relational", theories: ["Williamson 1996", "North 1990"] },
  hierarchy:   { concept: "information-impactedness", tceLabel: "Williamson-inspired α^n hierarchy heuristic", theories: ["Williamson 1967"] },
  governance:  { concept: "selective-intervention", tceLabel: "Selective intervention puzzle + agency costs", theories: ["Williamson 1996", "Jensen & Meckling 1976"] },
  learningDeficit:   { concept: "adaptation-failure", tceLabel: "Organizational learning blocked", theories: ["Argyris 1977", "Nonaka 1995"] },
  knowledgeLoss:     { concept: "knowledge-specificity", tceLabel: "SECI spiral blocked - tacit knowledge trapped", theories: ["Nonaka 1995", "Williamson 1975"] },
  agencyOverhead:    { concept: "agency-costs", tceLabel: "Principal-agent monitoring + bonding costs", theories: ["Jensen & Meckling 1976", "Williamson 1996"] },
};

export const FEAR_METRICS = new Set(["blameRate", "errorFear", "snitchPerc", "destructiveFear"]);

// ── Module scope maturity (AUTHOR'S EXTENSION) ──
// Steruje WIDOCZNOŚCIĄ modułu w głównej liczbie. Nazwa wartości `validated`
// jest zachowana dla kompatybilności, ale oznacza jedynie rdzeń scenariusza,
// nie empiryczną walidację kwoty. `confidenceTier` dotyczy uzasadnienia
// mechanizmu, a nie współczynników pieniężnych.
//   validated    → rdzeń scenariusza, zawsze w headline
//   beta         → w headline tylko w trybie 'full'
//   experimental → w headline tylko w trybie 'full'
// Tryb 'conservative' liczy headline wyłącznie na rdzeniu. Żaden z tych
// statusów nie zmienia prioru autora w empiryczny współczynnik kosztowy.
export const MODULE_MATURITY = {
  errors: "validated", turnover: "validated", burnout: "validated",
  innovation: "beta", passivity: "beta", help: "beta",
  compliance: "beta", governance: "beta",
  leader: "experimental", hierarchy: "experimental",
  learningDeficit: "experimental", knowledgeLoss: "experimental",
  agencyOverhead: "experimental",
};

// Moduły, które gdy wypadną z headline (tryb ostrożny) zostają widoczne jako
// analityka strukturalna BEZ kwoty w PLN. Williamson/TCE = kręgosłup teoretyczny,
// ale jego kanał kosztowy jest heurystyczny, więc pokazujemy α↑/α↓ i % utraty
// informacji, a nie złotówki.
export const ANALYTICS_ONLY_WHEN_EXCLUDED = new Set(["hierarchy"]);

export const MODULE_INTERACTIONS = [
  { fromMetric: "burnoutRate",      toId: "turnover",    w: 0.20 },
  { fromMetric: "blameRate",        toId: "errors",      w: 0.15 },
  { fromMetric: "passivity",        toId: "innovation",  w: 0.10 },
  { fromMetric: "destructiveFear",  toId: "burnout",     w: 0.15 },
  { fromMetric: "errorFear",        toId: "compliance",  w: 0.10 },
  { fromMetric: "errorFear",        toId: "learningDeficit", w: 0.15 },
  { fromMetric: "helpComfort",      toId: "knowledgeLoss",   w: 0.15 },
  { fromMetric: "destructiveFear",  toId: "agencyOverhead",  w: 0.15 },
];

export const PL_DISTRIBUTION = [
  { level: "Bardzo niski", levelEn: "Very low",  pct: 14, color: "#dc2626", safetyMid: 15 },
  { level: "Niski",        levelEn: "Low",        pct: 17, color: "#ea580c", safetyMid: 30 },
  { level: "Obniżony",     levelEn: "Below avg",  pct: 40, color: "#d97706", safetyMid: 45 },
  { level: "Umiarkowany",  levelEn: "Moderate",   pct: 15, color: "#65a30d", safetyMid: 65 },
  { level: "Wysoki",       levelEn: "High",        pct: 14, color: "#16a34a", safetyMid: 85 },
];

// PL_AVG_SAFETY anchored to Ipsos 2026 raw sample mean (rozprawa §4.1.2),
// NOT computed from PL_DISTRIBUTION weighted means. Weighted mean of the
// 5-bin distribution above gives ~47, but the raw sample mean (n=1000)
// is 41 - the ~6pt gap comes from bin midpoint discretization on a
// right-skewed distribution. Dissertation uses 41 as the calibration
// anchor (s₀ for sigmoid midpoints, scenario 1 plausibility check),
// so the UI must match to keep model and academic narrative aligned.
//
// External adversarial review (P1, JMS-style methodologist) flagged that
// using 41 instead of 47 looks like "data convenience" - the inflection
// point conveniently coincides with the population mean, making 13–14%
// fall out at PL average. The defence is in autoreferat §5.2 + dyssertation
// §4.1.2: 41 is the *unbiased* estimator of central tendency for a
// right-skewed integer-coded scale; 47 is an artefact of bin midpoint
// arithmetic. NOTE: an earlier version of this comment claimed a
// `midpointShift` perturbation in sensitivity.js - no such perturbation
// exists in the code (grilling 2026-06-09); the defence of 41 vs 47 rests
// on the estimator argument above, not on a sensitivity run.
export const PL_AVG_SAFETY = 41;

// ── Poland-specific benchmarks ──
// GUS (Central Statistical Office of Poland) annual labour turnover rate.
// Source: GUS, "Popyt na pracę" 2023 (published 2024): average turnover rate
// in the Polish enterprise sector was 14.8%. Used as inline benchmark in the
// CostsTab turnover module for PL locale; EN locale shows SHRM 2024 (US ~19%).
export const PL_TURNOVER_RATE_GUS = 0.148;
// SHRM benchmark for reference (US market, 2024)
export const US_TURNOVER_RATE_SHRM = 0.19;

export const PLN_EUR_RATE = 4.25;
export const PLN_USD_RATE = 4.0;

export const PROBLEM_CATEGORIES = [
  {
    id: "trivial",
    label: "Błahy",
    labelEn: "Trivial",
    color: "#65a30d",
    defaultCost: 500,
    lateMultiplier: 1.5,
    heinrichRatio: 600,
    detectionWithoutVoice: 3,
    reasonType: "active-slip",
    description: "Drobne pomyłki, literówki, małe opóźnienia"
  },
  {
    id: "medium",
    label: "Średni",
    labelEn: "Medium",
    color: "#d97706",
    defaultCost: 5_000,
    lateMultiplier: 2.5,
    heinrichRatio: 30,
    detectionWithoutVoice: 5,
    reasonType: "active-mistake",
    description: "Błędy procesowe, reklamacje, konflikty w zespole"
  },
  {
    id: "major",
    label: "Większy",
    labelEn: "Major",
    color: "#ea580c",
    defaultCost: 50_000,
    lateMultiplier: 3.5,
    heinrichRatio: 10,
    detectionWithoutVoice: 7,
    reasonType: "latent-condition",
    description: "Utrata klienta, awaria systemu, odejście kluczowej osoby"
  },
  {
    id: "critical",
    label: "Bardzo poważny",
    labelEn: "Critical",
    color: "#dc2626",
    defaultCost: 250_000,
    lateMultiplier: 5.0,
    heinrichRatio: 1,
    detectionWithoutVoice: 9,
    reasonType: "latent-organizational",
    description: "Kara regulacyjna, skandal, utrata kontraktu strategicznego"
  },
];

export const DEFAULT_CONCEALABILITY = { trivial: 0.6, medium: 0.3, major: 0.15, critical: 0.05 };

export const DEFAULT_PROBLEM_DIST = [
  { id: "trivial",  count: 8,   cost: 500,     lateMultiplier: 1.5, concealability: 0.6 },
  { id: "medium",   count: 3,   cost: 5_000,   lateMultiplier: 2.5, concealability: 0.3 },
  { id: "major",    count: 0.5, cost: 50_000,   lateMultiplier: 3.5, concealability: 0.15 },
  { id: "critical", count: 0.1, cost: 250_000,  lateMultiplier: 5.0, concealability: 0.05 },
];

export const SILENCE_WEIGHTS = {
  errors:     { def: 1.20, acq: 0.90, pro: 0.80 },
  innovation: { def: 0.90, acq: 1.30, pro: 0.90 },
  turnover:   { def: 1.00, acq: 1.20, pro: 0.80 },
  burnout:    { def: 1.10, acq: 1.30, pro: 0.90 },
  passivity:  { def: 0.80, acq: 1.40, pro: 0.90 },
  help:       { def: 1.30, acq: 1.00, pro: 0.70 },
  leader:     { def: 1.30, acq: 0.90, pro: 1.00 },
  compliance: { def: 1.20, acq: 1.00, pro: 0.90 },
  hierarchy:  { def: 1.10, acq: 1.00, pro: 1.00 },
  governance: { def: 1.00, acq: 1.10, pro: 1.00 },
  learningDeficit: { def: 1.1, acq: 1.3, pro: 0.9 },
  knowledgeLoss:   { def: 1.2, acq: 1.1, pro: 0.7 },
  agencyOverhead:  { def: 1.2, acq: 1.0, pro: 0.9 },
};

// 10 generic intervention groups (rozprawa §11.4.2). Each group declares the
// AUTHOR'S EXTENSION planning inputs used by the solver. `impact` is a
// module-specific equivalent safety lift, while `targets` is the binary
// intervention-to-module incidence matrix. These are transparent planning
// priors, not causal effect estimates. Provider records in INTERVENTIONS are
// informational examples only. They do not become decision variables until
// provider-specific cost and effect inputs pass an audit.
export const INTERVENTION_GROUPS = [
  {
    id: "feedback-tools",
    label: "Anonimowe narzędzia feedbacku",
    labelEn: "Anonymous feedback tools",
    costPerEmp: 200, coverage: 1.0, impact: 2, difficulty: "easy",
    color: "#22c55e", voiceQuality: 0.65,
    targets: ["errors", "compliance"],
    coverageDesc: "100%", coverageDescEn: "100% - platform license",
    theoryAnchor: "Edmondson 1999 + Rosen-Tesser MUM 1970",
    manuscriptRef: "§5.3 (asymmetric filtering)",
  },
  {
    id: "leader-11",
    label: "Szkolenie liderów: 1:1 i feedback",
    labelEn: "Leader coaching: 1:1s & feedback",
    costPerEmp: 2500, coverage: 0.08, impact: 3, difficulty: "easy",
    color: "#65a30d", voiceQuality: 0.80,
    targets: ["leader", "burnout", "help"],
    coverageDesc: "~8% - liderzy i kierownicy", coverageDescEn: "~8% - leaders & managers",
    theoryAnchor: "Detert & Edmondson 2011 (implicit voice theories)",
    manuscriptRef: "§7.4.3 (LEADER_SILENCE_FREQ_MULT)",
  },
  {
    id: "ps-workshops",
    label: "Warsztaty bezpieczeństwa psych. (Edmondson)",
    labelEn: "PS workshops (Edmondson-style)",
    costPerEmp: 600, coverage: 0.40, impact: 4, difficulty: "medium",
    color: "#16a34a", voiceQuality: 0.90,
    targets: ["help", "passivity", "innovation", "learningDeficit"],
    coverageDesc: "~40% - rollout zespołami", coverageDescEn: "~40% - team-by-team rollout",
    theoryAnchor: "Edmondson 1999, 2019 (Fearless Organization)",
    manuscriptRef: "§5.2.2 (concealRate, helpComfort)",
  },
  {
    id: "just-culture",
    label: "Just Culture - błędy bez winy",
    labelEn: "Just Culture training",
    costPerEmp: 800, coverage: 0.25, impact: 3, difficulty: "medium",
    color: "#0ea5e9", voiceQuality: 0.85,
    targets: ["errors", "leader", "compliance"],
    coverageDesc: "~25% - liderzy + operacje", coverageDescEn: "~25% - leaders + operations",
    theoryAnchor: "Dekker 2007 (Just Culture)",
    manuscriptRef: "§5.2.2 (errorFear)",
  },
  {
    id: "communities",
    label: "Społeczności praktyki (cross-team)",
    labelEn: "Communities of practice",
    costPerEmp: 500, coverage: 0.15, impact: 2, difficulty: "medium",
    color: "#8b5cf6", voiceQuality: 0.75,
    targets: ["innovation", "passivity", "learningDeficit", "knowledgeLoss"],
    coverageDesc: "~15% - aktywni uczestnicy", coverageDescEn: "~15% - active participants",
    theoryAnchor: "Nonaka-Takeuchi 1995 (SECI spiral)",
    manuscriptRef: "§4.3.2 (Nonaka-Takeuchi 1995)",
  },
  {
    id: "360-feedback",
    label: "Feedback 360° + plany działania",
    labelEn: "360° feedback + action plans",
    costPerEmp: 1500, coverage: 0.08, impact: 3, difficulty: "medium",
    color: "#d97706", voiceQuality: 0.70,
    targets: ["leader", "hierarchy", "governance", "agencyOverhead"],
    coverageDesc: "~8% - kadra zarządzająca", coverageDescEn: "~8% - management layer",
    theoryAnchor: "Jensen-Meckling 1976 (agency costs)",
    manuscriptRef: "§3.4 (agencyOverhead)",
  },
  {
    id: "exec-coaching",
    label: "Coaching kadry zarządzającej",
    labelEn: "Executive coaching (C-level)",
    costPerEmp: 15000, coverage: 0.02, impact: 4, difficulty: "hard",
    color: "#ea580c", voiceQuality: 0.85,
    targets: ["leader", "hierarchy", "governance", "agencyOverhead"],
    coverageDesc: "~2% - C-level + VP", coverageDescEn: "~2% - C-level + VP",
    theoryAnchor: "Kahneman 2011 (overconfidence gap)",
    manuscriptRef: "§4.2.6 (overconfidence)",
  },
  {
    id: "org-redesign",
    label: "Redesign struktury + autonomia",
    labelEn: "Org redesign + autonomy",
    costPerEmp: 2000, coverage: 0.05, impact: 5, difficulty: "hard",
    color: "#dc2626", voiceQuality: 0.75,
    targets: ["hierarchy", "governance", "passivity", "agencyOverhead"],
    coverageDesc: "~5% - zespół projektowy", coverageDescEn: "~5% - project team",
    theoryAnchor: "Williamson 1967 + Adamska 2015 (autonomy)",
    manuscriptRef: "§3.2 (Williamson α^n) + §4.4 (autonomy moderator)",
  },
  {
    id: "culture-program",
    label: "Program transformacji kulturowej (12 mies.)",
    labelEn: "Culture transformation (12-month)",
    costPerEmp: 3000, coverage: 0.30, impact: 7, difficulty: "hard",
    color: "#be185d", voiceQuality: 0.90,
    targets: ["burnout", "turnover", "innovation", "passivity", "help", "learningDeficit", "knowledgeLoss"],
    coverageDesc: "~30% - fazowany rollout", coverageDescEn: "~30% - phased rollout",
    theoryAnchor: "Argyris 1977 (double-loop learning)",
    manuscriptRef: "§4.3.1 (Argyris double-loop)",
  },
  {
    id: "governance-restructure",
    label: "Przebudowa governance i incentive",
    labelEn: "Governance & incentive restructure",
    costPerEmp: 5000, coverage: 0.05, impact: 6, difficulty: "transformational",
    color: "#7c3aed", voiceQuality: 0.70,
    targets: ["governance", "hierarchy", "turnover", "compliance", "agencyOverhead"],
    coverageDesc: "~5% - zespół strategiczny", coverageDescEn: "~5% - strategic team",
    theoryAnchor: "Williamson 1996 + Jensen-Meckling 1976",
    manuscriptRef: "§10.4.2-§10.4.3 (ESG/HR governance)",
  },
];

const GROUPS_BY_ID = new Map(INTERVENTION_GROUPS.map(g => [g.id, g]));

// Provider examples inherit group priors. Their descriptions and URLs are
// vendor-specific, but the solver deliberately selects the generic group,
// never a named provider on unaudited group-level numbers.
function variant(groupId, id, label, labelEn, desc, descEn, exemplaryVendors, extras = {}) {
  const g = GROUPS_BY_ID.get(groupId);
  if (!g) throw new Error(`Unknown groupId: ${groupId}`);
  return {
    id, groupId,
    label, labelEn, desc, descEn,
    costPerEmp: extras.costPerEmp ?? g.costPerEmp,
    coverage: g.coverage,
    impact: g.impact,
    difficulty: g.difficulty,
    color: g.color,
    voiceQuality: g.voiceQuality,
    targets: g.targets,
    coverageDesc: g.coverageDesc,
    coverageDescEn: g.coverageDescEn,
    exemplaryVendors,
    ...extras,
  };
}

// 50 provider examples (5 per group). They are not solver choices. URL-check
// status is historical metadata, not verification of price or effectiveness.
const VENDOR_VERIFIED = "2026-05-05";
export const INTERVENTIONS = [
  // ── Grupa 1: feedback-tools (anonimowy feedback) ──
  variant("feedback-tools", "ft-faceup",
    "FaceUp - anonimowa skrzynka zgłoszeń (UE-compliant)",
    "FaceUp - anonymous reporting (EU whistleblower-compliant)",
    "Anonimowa skrzynka zgłoszeń z zarządzaniem sprawami, 2-kierunkową komunikacją i dashboardem - zgodna z dyrektywą UE o ochronie sygnalistów. Adresuje efekt MUM (Rosen i Tesser 1970).",
    "Anonymous reporting inbox with case management, 2-way communication, dashboard - EU whistleblower-directive compliant. Addresses MUM effect (Rosen & Tesser 1970).",
    [{ name: "FaceUp", url: "https://www.faceup.com/en/whistleblowing-companies-pricing", type: "saas", country: "global", priceNote: "od $49/mies.", verified: VENDOR_VERIFIED }],
  ),
  variant("feedback-tools", "ft-sygnanet",
    "Sygnanet - polska platforma whistleblower (hosting PL)",
    "Sygnanet - Polish whistleblower platform (PL hosting)",
    "Polskojęzyczna platforma anonimowego sygnalizowania (4 000-10 000 zł/rok), hosting w Polsce, szybkie wdrożenie godzinowe.",
    "Polish whistleblower SaaS (4-10k PLN/yr), Poland-hosted, hourly deployment.",
    [{ name: "Sygnanet (via ethicsportal listing)", url: "https://ethicsportal.eu/blog/best-whistleblower-software/", type: "saas", country: "PL", priceNote: "4-10k PLN/rok", verified: VENDOR_VERIFIED, note: "URL prowadzi do listingu - bezpośredni: sygnanet.pl (do ręcznej weryfikacji)" }],
  ),
  variant("feedback-tools", "ft-hrcode",
    "HRcode Pulse Check - ankiety pulsowe co 2 tyg.",
    "HRcode Pulse Check - bi-weekly pulse surveys",
    "Ankiety pulsowe (co 2 tygodnie, 3-5 pytań), anonimowe, z automatycznym raportem dla menedżera i wskaźnikiem eNPS. Skala Edmondson 7-item.",
    "Pulse surveys (bi-weekly, 3-5 questions), anonymous, auto-report for manager + eNPS. Edmondson 7-item scale.",
    [{ name: "HRcode", url: "https://hrcode.io/badanie-pulse-check/", type: "saas", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("feedback-tools", "ft-webankieta",
    "Webankieta Pulse Check - gotowy wzór pulse",
    "Webankieta Pulse Check - ready pulse template",
    "Platforma ankiet pulsowych z gotowym wzorem Pulse Check dla pracowników, skala Likerta, wyniki online.",
    "Pulse survey platform with ready employee Pulse Check template, Likert scale, online results.",
    [{ name: "Webankieta", url: "https://www.webankieta.pl/blog/ankieta-pulse-check-pracownika-korzysci-instrukcja-tworzenia-i-gotowy-wzor-badania/", type: "saas", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("feedback-tools", "ft-slido-menti",
    "Slido / Mentimeter - anonimowe pytania na all-hands",
    "Slido / Mentimeter - anonymous Q&A at all-hands",
    "Narzędzie do interaktywnych spotkań all-hands: anonimowe pytania i głosowanie w czasie rzeczywistym. Menedżer odpowiada na top 3 co kwartał.",
    "Interactive all-hands tooling: anonymous Q&A and live voting. Manager answers top 3 quarterly.",
    [
      { name: "Slido", url: "https://www.slido.com/", type: "saas", country: "global", priceNote: "od $17.5/mies.", verified: "pending" },
      { name: "Mentimeter", url: "https://www.mentimeter.com/", type: "saas", country: "global", priceNote: "od $11.99/mies.", verified: "pending" },
    ],
  ),

  // ── Grupa 2: leader-11 (szkolenia liderów 1:1 i feedback) ──
  variant("leader-11", "lc-4grow",
    "4grow - Feedback i rozmowy rozwojowe",
    "4grow - Feedback & development conversations",
    "Szkolenie 'Feedback i rozmowy rozwojowe z pracownikami' - dla liderów: techniki udzielania szczerej, motywującej informacji zwrotnej.",
    "'Feedback & development conversations' training - for leaders: honest, motivating feedback techniques.",
    [{ name: "4grow", url: "https://4grow.pl/szkolenia/feedback-szkolenie-informacja-zwrotna", type: "training", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("leader-11", "lc-humanskills-ff",
    "Human Skills - Feedback z elementami feedforward",
    "Human Skills - Feedback with feedforward elements",
    "Szkolenie 'Feedback z elementami feedforward' - zamknięte, online/stacjonarne, dopasowane do potrzeb kadry zarządzającej.",
    "'Feedback with feedforward' training - closed, online/onsite, tailored to management.",
    [{ name: "Human Skills", url: "https://www.humanskills.pl/szkolenia_zamkniete/feedback-z-elementami-feedforward/", type: "training", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("leader-11", "lc-altkom-ftm",
    "Altkom Akademia - First Time Manager (model SBI)",
    "Altkom Academy - First Time Manager (SBI model)",
    "Szkolenie 'First Time Manager: Feedback i trudne rozmowy' - trening z modelem SBI (Situation-Behavior-Impact), dla kadry menedżerskiej.",
    "'First Time Manager: Feedback & hard conversations' training - SBI (Situation-Behavior-Impact) model, for managers.",
    [{ name: "Altkom Akademia", url: "https://www.altkomakademia.pl/szkolenia/feedback-i-trudne-rozmowy-z-pracownikami/", type: "training", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("leader-11", "lc-warda",
    "Warda & Partners - Akademia Lidera",
    "Warda & Partners - Leader Academy",
    "Program 'Akademia Lidera' - szkolenia dla liderów: zarządzanie, komunikacja, coaching, mentoring (online + offline), z certyfikowanymi trenerami.",
    "'Leader Academy' program - leader training: management, communication, coaching, mentoring (online + offline), certified trainers.",
    [{ name: "Warda & Partners", url: "https://www.wardateam.com/akademia-lidera/", type: "training", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("leader-11", "lc-tdi-anl",
    "Talent Development Institute - Akademia Nowego Lidera",
    "Talent Development Institute - New Leader Academy",
    "'Akademia Nowego Lidera' - 40+ narzędzi menedżerskich, skrypty rozmów 1:1, demonstracje, testy - program online dla liderów.",
    "'New Leader Academy' - 40+ manager tools, 1:1 conversation scripts, demos, tests - online program for leaders.",
    [{ name: "Talent Development Institute", url: "https://talentdevelopmentinstitute.pl/anl-3-pakiety/", type: "training", country: "PL", verified: VENDOR_VERIFIED }],
  ),

  // ── Grupa 3: ps-workshops (warsztaty BP w stylu Edmondson) ──
  variant("ps-workshops", "ps-4results",
    "4Results - Fearless Organization™ (Edmondson)",
    "4Results - Fearless Organization™ (Edmondson)",
    "Autorski program szkoleniowy oparty na metodyce Fearless Organization™ Amy Edmondson - online, 4h intensywna nauka live, dla menedżerów i HR.",
    "Proprietary training based on Amy Edmondson's Fearless Organization™ - online, 4h intensive live, for managers and HR.",
    [{ name: "4Results", url: "https://landing.4results.pl/szkolenie_bezpieczenstwo_psychologiczne", type: "training", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("ps-workshops", "ps-wial",
    "WIAL Poland - TPS Certified Practitioner",
    "WIAL Poland - TPS Certified Practitioner",
    "Szkolenie z bezpieczeństwa psychologicznego z certyfikacją TPS (Team Psychological Safety) + raporty dla zespołu i lidera po polsku, narzędzia wg Edmondson.",
    "Psychological safety training with TPS (Team Psychological Safety) certification + team and leader reports in Polish, Edmondson tools.",
    [{ name: "WIAL Poland", url: "https://wialpoland.org/szkolenie-bezpieczenstwo-psychologiczne-certyfikacja-raport-tps/", type: "training", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("ps-workshops", "ps-agile-academy",
    "Agile Academy - 4 etapy bezpieczeństwa (Clark)",
    "Agile Academy - 4 stages of safety (Clark)",
    "Warsztat bezpieczeństwa psychologicznego na żywo - dopasowany do zespołu, 4 etapy wg Timothy'ego Clarka, strategie wdrożeniowe.",
    "Live PS workshop - team-tailored, Timothy Clark's 4 stages, implementation strategies.",
    [{ name: "Agile Academy", url: "https://www.agile-academy.com/pl/metody/bezpieczenstwo-psychologiczne/", type: "training", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("ps-workshops", "ps-csjet",
    "CSJET - 'Bezpieczni na pokładzie'",
    "CSJET - 'Safe on board'",
    "Szkolenie 'Bezpieczni na pokładzie' - warsztaty z bezpieczeństwa psychologicznego, budowania zaufania i efektywności zespołu, dopasowane do firmy.",
    "'Safe on board' workshops - psychological safety, trust building, team effectiveness, customized.",
    [{ name: "CSJET Centrum Szkoleniowe", url: "https://csjet.pl/dla-menedzerow/bezpieczni-na-pokladzie/", type: "training", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("ps-workshops", "ps-podcisnieniem",
    "podcisnieniem.com.pl - Czynniki Ludzkie i Just Culture (8h)",
    "podcisnieniem.com.pl - Human Factors & Just Culture (8h)",
    "Szkolenie 'Czynniki Ludzkie i Just Culture' (8h, 8-12 osób): bezpieczeństwo psychologiczne, praca zespołowa, komunikacja, kultura sprawiedliwego traktowania.",
    "'Human Factors & Just Culture' training (8h, 8-12 people): PS, teamwork, communication, just culture.",
    [{ name: "podcisnieniem.com.pl", url: "https://podcisnieniem.com.pl/courses/", type: "training", country: "PL", verified: VENDOR_VERIFIED }],
  ),

  // ── Grupa 4: just-culture (Dekker Just Culture) ──
  variant("just-culture", "jc-curie",
    "Curie Aviation - Human Factors & Just Culture (Coventry)",
    "Curie Aviation - Human Factors & Just Culture (Coventry)",
    "Szkolenie Human Factors i Just Culture (Coventry University), 2 dni, certyfikat, early bird 3 150 zł/os. - dla branż wysokiego ryzyka.",
    "Human Factors & Just Culture training (Coventry University), 2 days, certificate, early bird 3,150 PLN/person - for high-risk industries.",
    [{ name: "Curie Aviation", url: "https://curie.eu/human-factors-pl-modyfications-3110/", type: "training", country: "PL", priceNote: "3 150 zł/os. early bird", verified: VENDOR_VERIFIED }],
  ),
  variant("just-culture", "jc-faceup-pro",
    "FaceUp Professional - Safe-to-fail Reporting",
    "FaceUp Professional - Safe-to-fail Reporting",
    "Platforma anonimowego zgłaszania błędów i incydentów zgodna z dyrektywą UE - w pełni wdrażalna jako 'Safe-to-fail Reporting' (od $99/mies.).",
    "EU-compliant anonymous error/incident reporting platform - fully deployable as 'Safe-to-fail Reporting' (from $99/mo).",
    [{ name: "FaceUp Professional", url: "https://www.faceup.com/en/whistleblowing-companies-pricing", type: "saas", country: "global", priceNote: "od $99/mies.", verified: VENDOR_VERIFIED }],
  ),
  variant("just-culture", "jc-sygnanet",
    "Sygnanet - sygnalizowanie naruszeń (PL)",
    "Sygnanet - violations reporting (PL)",
    "Platforma sygnalizowania naruszeń z obsługą w PLN (4 000-10 000 zł/rok), hosting w Polsce, szybkie wdrożenie godzinowe.",
    "Violations reporting platform in PLN (4-10k PLN/yr), Poland-hosted, hourly deployment.",
    [{ name: "Sygnanet (via ethicsportal listing)", url: "https://ethicsportal.eu/blog/best-whistleblower-software/", type: "saas", country: "PL", priceNote: "4-10k PLN/rok", verified: VENDOR_VERIFIED }],
  ),
  variant("just-culture", "jc-altkom-feedback",
    "Altkom Akademia - Feedback i trudne rozmowy",
    "Altkom Academy - Feedback & hard conversations",
    "Szkolenie dla menedżerów: Feedback i trudne rozmowy z pracownikami - trening umiejętności reagowania na błędy bez eskalowania kultury obwiniania.",
    "Manager training: Feedback & hard conversations - error response skills without escalating blame culture.",
    [{ name: "Altkom Akademia", url: "https://www.altkomakademia.pl/szkolenia/feedback-i-trudne-rozmowy-z-pracownikami/", type: "training", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("just-culture", "jc-lsj",
    "LSJ HR Group - Trudne rozmowy lidera (drama+feedback)",
    "LSJ HR Group - Hard leader conversations (drama+feedback)",
    "Szkolenie 'Trudne rozmowy lidera' - intensywny trening rozmów korygujących oparty na dramie i feedbacku transformującym.",
    "'Hard leader conversations' training - intensive corrective conversations using drama and transformative feedback.",
    [{ name: "LSJ HR Group", url: "https://lsj.pl/trudne-rozmowy-lidera", type: "training", country: "PL", verified: VENDOR_VERIFIED }],
  ),

  // ── Grupa 5: communities (społeczności praktyki cross-team) ──
  variant("communities", "ct-peakon",
    "Workday Peakon Employee Voice - cross-team listening",
    "Workday Peakon Employee Voice - cross-team listening",
    "Platforma do ciągłego słuchania pracowników z modułem społecznościowym, ankietami i analizą nastrojów - wspiera cross-team feedback.",
    "Continuous listening platform with community module, surveys and sentiment analysis - supports cross-team feedback.",
    [{ name: "Workday Peakon", url: "https://www.workday.com/pl-pl/products/employee-voice/overview.html", type: "saas", country: "global", verified: VENDOR_VERIFIED }],
  ),
  variant("communities", "ct-officevibe",
    "Workleap Officevibe - feedback + Good Vibes",
    "Workleap Officevibe - feedback + Good Vibes",
    "Platforma zaangażowania z modułem anonymous feedback, Good Vibes recognition i pulsnymi ankietami (od $4/użytk./mies.).",
    "Engagement platform with anonymous feedback, Good Vibes recognition and pulse surveys (from $4/user/mo).",
    [{ name: "Workleap Officevibe", url: "https://workleap.com/officevibe", type: "saas", country: "global", priceNote: "od $4/użytk./mies.", verified: VENDOR_VERIFIED }],
  ),
  variant("communities", "ct-nais",
    "Nais Feedback Assistant - instant peer feedback",
    "Nais Feedback Assistant - instant peer feedback",
    "Platforma instant feedback z możliwością przekazywania informacji zwrotnej poziomo i w górę hierarchii, z anonimowym agregowaniem danych.",
    "Instant feedback platform - horizontal and upward feedback, anonymous data aggregation.",
    [{ name: "Nais", url: "https://www.nais.co/pl/modules/feedback-assistant", type: "saas", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("communities", "ct-emplo",
    "emplo - polska platforma instant feedback",
    "emplo - Polish instant feedback platform",
    "Platforma zaangażowania pracowników - ankiety, komunikacja, moduł feedbacku, dostępna dla firm polskich.",
    "Polish employee engagement platform - surveys, communication, feedback module.",
    [{ name: "emplo", url: "https://emplo.com/instant-feedback/", type: "saas", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("communities", "ct-blackbird",
    "Blackbird - warsztaty cross-team / cross-cultural",
    "Blackbird - cross-team / cross-cultural workshops",
    "Warsztaty i programy cross-kulturowe, budowanie wspólnych standardów współpracy w interdyscyplinarnych zespołach.",
    "Cross-cultural workshops, building shared collaboration standards in interdisciplinary teams.",
    [{ name: "Blackbird", url: "https://hello-blackbird.com/szkolenia-cross-culturowe-i-coaching-relokacyjny/", type: "training", country: "PL", verified: VENDOR_VERIFIED }],
  ),

  // ── Grupa 6: 360-feedback ──
  variant("360-feedback", "fb-shl",
    "SHL Polska - Feedback 360° (UCF framework)",
    "SHL Poland - 360° Feedback (UCF framework)",
    "Kompleksowa usługa Feedback 360° oparta na UCF (Universal Competency Framework), zarządzanie procesem z jednego miejsca, raporty indywidualne i zbiorcze.",
    "Comprehensive 360° Feedback based on UCF (Universal Competency Framework), single-pane process management, individual + aggregate reports.",
    [{ name: "SHL Polska", url: "https://shl.com.pl/doradztwo-hr/feedback-360/", type: "consulting", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("360-feedback", "fb-humanskills",
    "Human Skills - ocena 360° wielokierunkowa",
    "Human Skills - multi-directional 360° assessment",
    "Ankieta 360 stopni z wielokierunkową oceną kompetencji, raport zbiorczy dla HR i raporty indywidualne dla uczestników.",
    "360 survey with multi-directional competency assessment, aggregate HR report + individual reports.",
    [{ name: "Human Skills", url: "https://www.humanskills.pl/uslugi-human-resources/ocena_feedback_360/", type: "consulting", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("360-feedback", "fb-ey",
    "EY Academy of Business - Ocena 360° w praktyce",
    "EY Academy of Business - 360° Assessment in practice",
    "Szkolenie 'Ocena 360° w praktyce - od projektu do realnej zmiany': jak wdrożyć, interpretować wyniki i prowadzić rozmowy zwrotne.",
    "'360° Assessment in practice - from project to real change' training: implementation, interpretation, debrief.",
    [{ name: "EY Academy of Business", url: "https://www.academyofbusiness.pl/trainings/ocena-360-w-firmie/", type: "training", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("360-feedback", "fb-testhr",
    "TestHR.pl - narzędzie online 360°",
    "TestHR.pl - online 360° tool",
    "Narzędzie online do badań 360°, z anonimowym zbieraniem danych, analizą luk kompetencyjnych i planami działań.",
    "Online 360° tool, anonymous data collection, competency gap analysis, action plans.",
    [{ name: "TestHR.pl", url: "https://www.testhr.pl/pl/feedback-360-stopni/", type: "saas", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("360-feedback", "fb-lattice",
    "Lattice - Performance + Engagement (360 + pulse)",
    "Lattice - Performance + Engagement (360 + pulse)",
    "Platforma Performance + Engagement (Lattice: od $11/seat/mies.) - 360° reviews, goal tracking, pulse surveys zintegrowane w jednym miejscu.",
    "Lattice (from $11/seat/mo) - 360 reviews, goal tracking, pulse surveys integrated.",
    [{ name: "Lattice", url: "https://lattice.com/", type: "saas", country: "global", priceNote: "od $11/seat/mies.", verified: "pending", note: "Perplexity podał URL listingu (jostle blog) - bezpośredni: lattice.com" }],
  ),

  // ── Grupa 7: org-redesign (struktura + autonomia) ──
  variant("org-redesign", "or-consultim",
    "Consultim - audyt + projektowanie struktur",
    "Consultim - audit + structure design",
    "Kompleksowe doradztwo w zakresie projektowania i usprawniania struktur organizacyjnych - audyt, koncepcja usprawnień, regulaminy, zakresy odpowiedzialności.",
    "Comprehensive structural design consulting - audit, improvement concept, regulations, responsibilities.",
    [{ name: "Consultim", url: "https://consultim.pl/nasze-uslugi/doradztwo-strategiczne-i-restrukturyzacja/13-optymalizacja-i-projektowanie-struktur-organizacyjnych-oraz-systemow-zarzadzania", type: "consulting", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("org-redesign", "or-keystone",
    "Keystone Business Advisory - 6-czynnikowy redesign",
    "Keystone Business Advisory - 6-factor redesign",
    "Projektowanie struktur organizacyjnych z uwzględnieniem 6 czynników: strategia, rozpiętość kierowania, kompetencje - podejście warsztatowe.",
    "Org design with 6 factors: strategy, span of control, competencies - workshop-based.",
    [{ name: "Keystone Business Advisory", url: "https://keystoneadvisory.pl/projektowanie-struktur-organizacyjnych/", type: "consulting", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("org-redesign", "or-grant-thornton",
    "Grant Thornton Polska - modelowanie struktur",
    "Grant Thornton Poland - structure modeling",
    "Doradztwo organizacyjne i modelowanie struktur organizacyjnych firm i grup kapitałowych, zakresy zadań i opisy stanowisk.",
    "Organizational consulting + structure modeling for firms and capital groups, role descriptions.",
    [{ name: "Grant Thornton Polska", url: "https://grantthornton.pl/usluga/konsulting-biznesowy/doradztwo-organizacyjne-i-modelowanie-struktur-organizacyjnych/", type: "consulting", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("org-redesign", "or-ark",
    "ARK Doradztwo - reorganizacja firmy produkcyjnej",
    "ARK Consulting - manufacturing restructuring",
    "Wsparcie w reorganizacji struktury organizacyjnej firmy produkcyjnej - projekt restrukturyzacji z poprawą efektywności zarządzania.",
    "Manufacturing org restructuring support - efficiency-focused.",
    [{ name: "ARK Doradztwo", url: "https://ark-doradztwo.pl/przykladowe_projekty/firma-produkcyjna-wsparcie-w-reorganizacji-struktury-organizacyjnej-oraz-zarzadzaniu", type: "consulting", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("org-redesign", "or-klientocentryczni",
    "Klientocentryczni.pl - redesign kultury (adaptacja)",
    "Klientocentryczni.pl - culture redesign (adaptation)",
    "Projektowanie kultury organizacyjnej metodą redesign - od stabilności do adaptacyjności, case study praktyczne.",
    "Culture redesign - from stability to adaptability, practical case studies.",
    [{ name: "Klientocentryczni.pl", url: "https://klientocentryczni.pl/projektowanie-kultury-organizacyjnej/", type: "consulting", country: "PL", verified: VENDOR_VERIFIED }],
  ),

  // ── Grupa 8: culture-program (12-mies. transformacja) ──
  variant("culture-program", "cp-cultureamp",
    "Culture Amp - Engage/Perform/Develop (platforma)",
    "Culture Amp - Engage/Perform/Develop platform",
    "Platforma Culture Amp - moduły Engage, Perform, Develop; zaawansowana analityka, benchmarking branżowy; ~$10 000-$45 000/rok w zależności od skali.",
    "Culture Amp platform - Engage/Perform/Develop modules; advanced analytics, industry benchmarking; ~$10-45k/yr depending on scale.",
    [{ name: "Culture Amp", url: "https://www.cultureamp.com/platform/plans-and-pricing", type: "saas", country: "global", priceNote: "$10-45k/rok", verified: VENDOR_VERIFIED }],
  ),
  variant("culture-program", "cp-peakon-12m",
    "Workday Peakon - Employee Voice (AI listening)",
    "Workday Peakon - Employee Voice (AI listening)",
    "Platforma Workday Peakon Employee Voice - ciągłe słuchanie oparte na AI, 60 języków, rekomendowane plany działań dla menedżerów.",
    "AI-based continuous listening, 60 languages, recommended manager action plans.",
    [{ name: "Workday Peakon", url: "https://www.workday.com/pl-pl/products/employee-voice/overview.html", type: "saas", country: "global", verified: VENDOR_VERIFIED }],
  ),
  variant("culture-program", "cp-flowup",
    "FlowUp Group - transformacja kultury (12 mies.)",
    "FlowUp Group - culture transformation (12mo)",
    "Program transformacji kultury organizacyjnej - zmiana systemu od podstaw (kultura, przywództwo, procesy) - projekt 12-miesięczny.",
    "Org culture transformation - bottom-up change (culture, leadership, processes) - 12-month project.",
    [{ name: "FlowUp Group", url: "https://flowup.pl/uslugi/transformacja-kultury-organizacyjnej/", type: "consulting", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("culture-program", "cp-zmotywowani",
    "Zmotywowani.pl - platforma zaangażowania (PL)",
    "Zmotywowani.pl - engagement platform (PL)",
    "Platforma zaangażowania pracowników: badanie nastrojów, kanały komunikacji, moduły feedbacku i rozpoznania.",
    "Employee engagement platform: sentiment, communication channels, feedback + recognition modules.",
    [{ name: "Zmotywowani.pl", url: "https://www.zmotywowani.pl/en/main-page/", type: "saas", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("culture-program", "cp-develor",
    "DEVELOR Polska - program rozwoju liderów + zespołów",
    "DEVELOR Poland - leader + team development program",
    "Program DEVELOR - szkolenia dla liderów, zespołów i pracowników rozwijające kompetencje i zwiększające efektywność organizacji (dostosowane do potrzeb firmy).",
    "DEVELOR program - leader/team/employee training developing competencies and org effectiveness (customized).",
    [{ name: "DEVELOR Polska", url: "https://www.develor.pl/", type: "consulting", country: "PL", verified: VENDOR_VERIFIED }],
  ),

  // ── Grupa 9: governance-restructure (system premiowy + governance) ──
  variant("governance-restructure", "gv-keystone-premie",
    "Keystone Business Advisory - systemy premiowe partycypacyjne",
    "Keystone Business Advisory - participatory bonus systems",
    "Projektowanie systemów premiowych z metodą partycypacyjną - grupy premiowe, KPI, warunki brzegowe, analizy wykonalności i wrażliwości.",
    "Bonus system design with participatory method - bonus groups, KPIs, boundary conditions, feasibility + sensitivity analysis.",
    [{ name: "Keystone Business Advisory", url: "https://keystoneadvisory.pl/projektowanie-systemow-premiowych/", type: "consulting", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("governance-restructure", "gv-anacco",
    "ANACCO - audyt premiowania + EU 2023/970",
    "ANACCO - bonus audit + EU 2023/970",
    "Audyt i projektowanie systemu premiowania i nagradzania z benchmarkingiem rynkowym, zgodność z Dyrektywą UE 2023/970 (27 lat doświadczenia, ~1 500 projektów).",
    "Bonus + recognition audit and design with market benchmarking, EU Directive 2023/970 compliance (27 years, ~1,500 projects).",
    [{ name: "ANACCO", url: "https://anacco.pl/projektowanie-premiowanie-i-nagradzanie/", type: "consulting", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("governance-restructure", "gv-qmatch",
    "Qmatch HR - punktowe wartościowanie stanowisk + KPI",
    "Qmatch HR - analytic-point job valuation + KPI",
    "Projektowanie i ulepszanie systemów premiowych dla firm - analityczno-punktowa metoda wartościowania stanowisk, projekt KPI.",
    "Bonus system design + improvement - analytic-point job valuation method, KPI design.",
    [{ name: "Qmatch HR", url: "https://qmatch-hr.pl/systemy-premiowe/", type: "consulting", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("governance-restructure", "gv-peakon-board",
    "Workday Peakon - raportowanie do rady nadzorczej (ESG)",
    "Workday Peakon - board-level reporting (ESG)",
    "Platforma do ciągłego słuchania pracowników z wbudowanym modułem raportowania dla rady nadzorczej i komitetów audytu (integracja z ESG reporting).",
    "Continuous listening platform with built-in board / audit committee reporting module (ESG integration).",
    [{ name: "Workday Peakon", url: "https://www.workday.com/pl-pl/products/employee-voice/overview.html", type: "saas", country: "global", verified: VENDOR_VERIFIED }],
  ),
  variant("governance-restructure", "gv-consultim",
    "Consultim - restrukturyzacja governance",
    "Consultim - governance restructuring",
    "Kompleksowe doradztwo strategiczne i restrukturyzacja systemów zarządzania - governance, systemy motywacyjne, regulaminy organizacyjne.",
    "Strategic consulting + management system restructuring - governance, incentive systems, org regulations.",
    [{ name: "Consultim", url: "https://consultim.pl/nasze-uslugi/doradztwo-strategiczne-i-restrukturyzacja/13-optymalizacja-i-projektowanie-struktur-organizacyjnych-oraz-systemow-zarzadzania", type: "consulting", country: "PL", verified: VENDOR_VERIFIED }],
  ),

  // ── Grupa 10: exec-coaching (coaching kadry C-level) ──
  variant("exec-coaching", "ec-warda",
    "Warda & Partners - Executive coaching dla C-level",
    "Warda & Partners - Executive coaching for C-level",
    "Executive coaching dla kadry C-level i właścicieli biznesów: indywidualne sesje, kompetencje przywódcze, zmiana destrukcyjnych zachowań.",
    "Executive coaching for C-level + business owners: individual sessions, leadership competencies, destructive-pattern change.",
    [{ name: "Warda & Partners", url: "https://www.wardateam.com/", type: "coaching", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("exec-coaching", "ec-empowerment",
    "Empowerment Coaching - C-level toxic patterns",
    "Empowerment Coaching - C-level toxic patterns",
    "Executive coaching dla dyrektorów i zarządu - sesje indywidualne z naciskiem na odkrywanie wzorców toksycznych zachowań wpływających na całe zespoły.",
    "Executive coaching for directors + board - individual sessions focused on discovering toxic behavior patterns affecting whole teams.",
    [{ name: "Empowerment Coaching", url: "https://www.empowerment-coaching.com/post/executive-coaching", type: "coaching", country: "global", verified: VENDOR_VERIFIED }],
  ),
  variant("exec-coaching", "ec-kardach",
    "Paweł Kardach - Executive coaching dla właścicieli + C-level",
    "Paweł Kardach - Executive coaching for owners + C-level",
    "Executive coaching dla kadry C-level i właścicieli firm - wzmocnienie przywództwa, lepsza jakość decyzji, zarządzanie zespołem.",
    "Executive coaching for C-level + business owners - leadership strengthening, decision quality, team management.",
    [{ name: "Paweł Kardach", url: "https://pawelkardach.pl/produkt/executive-coaching-dla-wlascicieli-biznesow-i-kadry-c-level/", type: "coaching", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("exec-coaching", "ec-albinska",
    "Malwina Albińska - Executive coaching certyfikowany",
    "Malwina Albińska - certified Executive coaching",
    "Executive coaching z akcentem na rozwój kadry zarządzającej wysokiego szczebla, certyfikowane podejście, sesje online i stacjonarne.",
    "Executive coaching focused on senior management development, certified approach, online + onsite sessions.",
    [{ name: "Malwina Albińska", url: "https://malwinaalbinska.pl/oferta/executive-coaching/", type: "coaching", country: "PL", verified: VENDOR_VERIFIED }],
  ),
  variant("exec-coaching", "ec-ey",
    "EY Academy of Business - Executive Management",
    "EY Academy of Business - Executive Management",
    "Szkolenia i coaching C-level w ramach programu 'Kadra zarządzająca' - leadership, przywództwo, nowoczesne zarządzanie dla najwyższych szczebli.",
    "C-level training + coaching under 'Executive Management' program - leadership, modern management for top tier.",
    [{ name: "EY Academy of Business", url: "https://www.academyofbusiness.pl/kategorie-szkolen/executive-management/", type: "training", country: "PL", verified: VENDOR_VERIFIED }],
  ),
];

export const VARIANTS_BY_GROUP = INTERVENTION_GROUPS.reduce((m, g) => {
  m[g.id] = INTERVENTIONS.filter(i => i.groupId === g.id);
  return m;
}, {});

// Sum of group `impact` (cap=1 per group) - denominator for the report's
// "X / max" intervention-impact panel.
export const MAX_GROUP_IMPACT = INTERVENTION_GROUPS.reduce((s, g) => s + g.impact, 0);

export const countryFlag = (country) =>
  country === "PL" ? "🇵🇱" : country === "global" ? "🌐" : "";
