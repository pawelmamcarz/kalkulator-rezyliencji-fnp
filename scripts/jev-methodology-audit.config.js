import { choice, noul, score } from "./jev-methodology-audit.lib.js";

// Reviewable Jev questions for the public FNP methodology contract.
// Thresholds are an application policy, not a calibrated guarantee.
// Pin model jev-1.13.0 when comparing runs.

export const sources = [
  { id: "priory", path: "docs/PRIORY.md", role: "source_of_truth" },
  { id: "methodology", path: "src/sections/Methodology.jsx", role: "public_copy" },
  { id: "limitations", path: "src/sections/Limitations.jsx", role: "public_copy" },
  { id: "result", path: "src/sections/Result.jsx", role: "public_copy" },
  { id: "channels", path: "src/sections/Channels.jsx", role: "public_copy" },
  { id: "hero", path: "src/sections/Hero.jsx", role: "public_copy" },
  { id: "invitation", path: "src/sections/Invitation.jsx", role: "public_copy" },
  { id: "diagnosis", path: "src/sections/Diagnosis.jsx", role: "public_copy" },
];

export const questions = {
  claim_vs_priory: choice(
    "Treat `priory` as the analyst source of truth. Compare the public-copy fields (`methodology`, `limitations`, `result`, `channels`, `hero`, `invitation`) to that source. How do those public texts relate to the core claim that the calculator produces a scenario of scale from author priors, not an accounting valuation, forecast, causal estimate, or ROI promise?",
    {
      supports: "The public copy states or directly implies the same claim as `priory`.",
      contradicts: "The public copy states the opposite: a valuation, forecast, causal loss, or promised return.",
      says_nothing: "The public copy does not address what the claim asserts.",
    },
    { expect: "supports", minConfidence: 0.55 },
  ),

  ipsos_role: choice(
    "Read `priory` together with `methodology` and `limitations`. How does the public copy treat Ipsos × FNP 2026?",
    {
      context_not_calibration: "Polish context and/or pending table audit. Money scalars stay author priors. The copy does not say the model is calibrated on Ipsos.",
      completed_calibration: "The copy says or implies the model or money scalars are calibrated on Ipsos.",
      omitted: "Ipsos is not mentioned in the public methodology or limitations copy.",
    },
    { expect: "context_not_calibration", minConfidence: 0.55 },
  ),

  claims_accounting_or_roi: noul(
    "Do the public-copy fields claim that the calculator output is an accounting valuation, a forecast, a causal estimate of real loss, or a promise of ROI or savings?",
    {
      true: "The copy presents the number as booked loss, predicted savings, or a causal/ROI result.",
      false: "The copy frames a scenario of scale and denies accounting, forecast, causal, or ROI readings.",
    },
    { max: 0.35 },
  ),

  headline_scope: noul(
    "Does the public copy say the headline sum includes only rotation/turnover, errors, and burnout, while innovations/learning and coordination/hierarchy stay outside the sum (poza sumą)?",
    {
      true: "Those three areas are in the sum and the other two are explicitly outside it.",
      false: "The copy adds areas 4–5 into the money total, or never states the split.",
    },
    { min: 0.65 },
  ),

  five_percent_control: noul(
    "Does `methodology` or `limitations` treat the default-firm result at or under 5% of revenue as a project scale control, not as an empirical research finding that binds every firm?",
    {
      true: "5% is a design/project control for the example firm, and may be higher with another pay-to-revenue ratio.",
      false: "5% is presented as a measured law or a hard cap for all organisations.",
    },
    { min: 0.6 },
  ),

  chilling_separate_money: noul(
    "Does the public copy add a separate monetary line item for the chilling effect (efekt mrożenia) beyond climate, hidden errors, and the automatic-silence prior already in the model?",
    {
      true: "A distinct złoty amount or extra multiplier is attributed to the 2016 chilling-effect papers.",
      false: "The copy describes a mechanism and warns against a second money line.",
    },
    { max: 0.35 },
  ),

  climate_self_estimate: noul(
    "Does the public copy say the 0–100 climate slider is a self-estimate (szacunek własny), not a measurement or a 7-item team survey?",
    {
      true: "The copy says „szacunek własny, nie pomiar”, or equivalent.",
      false: "The copy presents the slider as a psychometric measurement or completed survey.",
    },
    { min: 0.7 },
  ),

  open_code_not_proof: noul(
    "Does the public copy say that open code allows inspection of the calculation but is not proof of empirical validity or completed source audit?",
    {
      true: "Inspectability is separated from empirical proof.",
      false: "Open code is treated as validation, or the limit is omitted from methodology and limitations.",
    },
    { min: 0.6 },
  ),

  p10p90_not_confidence_interval: noul(
    "Does the public copy say the P10-P90 band is a simulation range under author assumptions, not a confidence interval from a study?",
    {
      true: "The band is described as simulated spread, not a research confidence interval.",
      false: "The band is called a statistical confidence interval or causal loss bounds.",
    },
    { min: 0.6 },
  ),

  epistemic_fidelity: score(
    "How consistently do the public-copy fields preserve the epistemic contract in `priory`: scenario of scale, author priors, no Ipsos money calibration claim?",
    [
      "Treats the printed money as a calibrated empirical valuation or ROI figure.",
      "Mixes cautious wording with valuation, calibration, or savings promises.",
      "Consistently a scenario of scale built from stated author priors, with Ipsos as context only.",
    ],
    { min: 1.4, minConfidence: 0.5 },
  ),
};

export default {
  model: "jev-1.13.0",
  endpoint: "https://api.typesafe.ai/v1/systemone",
  sources,
  questions,
};
