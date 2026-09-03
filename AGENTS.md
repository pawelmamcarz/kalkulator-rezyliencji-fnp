# AGENTS.md

Guidance for coding agents working in this repository.

## What this repository is

**Kalkulator Rezyliencji FNP** is the public-facing identity of a free decision-support tool: it converts a psychological-safety deficit into an annual cost scenario in PLN. It is a collaboration between Fundacja Nowe Przestrzenie and Paweł Mamcarz.

This clone currently holds only:

- `README.md` — product pitch, methodology claims, contact
- `LICENSE` — MIT plus a decision-support disclaimer

There is no application code, package manifest, test suite, or deploy config here. Do not invent a stack, scaffold an app, or copy the engine into this repo unless the user explicitly asks to start implementation.

## Where the product actually lives

| Role | Location |
|------|----------|
| Live beta | https://silence-tax.com |
| Open calculation engine | [pawelmamcarz/podatekodmilczenia](https://github.com/pawelmamcarz/podatekodmilczenia) (MIT) |
| Local engine clones | `~/claude/podatekodmilczenia` and `~/claude/silence-tax` (same GitHub remote) |
| Engine agent rules | `podatekodmilczenia/AGENTS.md` |

Engine work (model, UI, Workers, tests, deploy) belongs in `podatekodmilczenia`, not here. Read that repo's `AGENTS.md` before touching the calculator.

## Product contract (do not weaken)

The output is a **scenario of scale**, not an accounting valuation, forecast, causal estimate, or ROI promise. README and LICENSE both state this; keep it in any copy, UI, or docs added here.

- Public version is cautious: modules without enough validation stay hidden or marked beta.
- Full premiere with report: autumn 2026.
- Inputs the public copy promises: revenue, costs, headcount, average pay, turnover, and an organizational-climate rating.
- Five reporting areas (the engine implements 13 cost modules and aggregates them into these channels without changing the total):
  1. Rotacja i utrata wiedzy
  2. Błędy i compliance
  3. Wypalenie i pasywność
  4. Innowacje i uczenie się
  5. Koordynacja i hierarchia

## Methodology and claims

- Use only publicly available research (e.g. Edmondson 1999, Williamson 1967, Van Dyne 2003, Frazier et al. 2017). No licensed methodologies.
- Calibration anchor: Ipsos Polska × Fundacja Nowe Przestrzenie 2026 (n=1000). Do not treat Ipsos/FNP table values as audited unless the engine docs say they are.
- Parameters without direct empirical calibration must stay explicitly marked as author assumptions in code.
- Open source makes assumptions inspectable; it is **not** proof of empirical validity. Do not write copy that implies otherwise.
- LICENSE: calibrated theoretical simulation, order-of-magnitude scenarios in a 5–40% of revenue credibility band, not validated against firm-level cost data, calibrated on Polish Hofstede context (PD=68, UA=93). Material decisions above 500k PLN should be preceded by a firm-specific pilot.

## Branding and language

- Public name in this repo: **Kalkulator Rezyliencji FNP**. Headline: „Ile Twoja organizacja traci na milczeniu?”
- Engine / citation name: **Silence Tax Optimizer** (see LICENSE suggested citation). Do not collapse the two names into one without being asked.
- User-facing copy is Polish. Do not anglicise the product name, the five area labels, or FNP partnership wording.
- Suggested citation (LICENSE): Mamcarz, P. (2026). Silence Tax Optimizer (Version YYYY.WW.B.P) [Computer software]. https://silence-tax.com. ORCID: 0009-0002-3274-4226.
- Contact: Fundacja Nowe Przestrzenie; Paweł Mamcarz — pawel@mamcarz.com.

## If implementation starts here

- Prefer consuming the engine from `podatekodmilczenia` over forking formulas.
- Preserve MIT plus the additional decision-support note in `LICENSE`.
- Do not present results as księgowa wycena, prognoza, or a substitute for FNP diagnosis.
- Keep uncalibrated parameters labelled as author assumptions.
- Verify UI in the browser (desktop and mobile) before calling a visual change done.

## Version control

- Remote: `https://github.com/pawelmamcarz/kalkulator-rezyliencji-fnp.git`
- Default branch: `main`
- Current history is a single docs commit (`docs: wstępna wersja projektu Kalkulator Rezyliencji FNP`). There is nothing to lint, test, or deploy from this tree.
