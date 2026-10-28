# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Extra commands

```bash
npx vitest run src/fnp.test.js          # single test file
npx vitest run -t "fragment nazwy"      # single test by name
npm run test:watch                      # Vitest watch mode
```

`npm run build` = `vite build` + `scripts/prerender.mjs`, which SSR-renders `App.jsx` into `dist/index.html` (static HTML for crawlers). The prerender fails if the `efekt-mrozenia` methodology anchor is missing, so any change to `App.jsx` or sections must stay SSR-safe (no `window`/`document` at module or render top level).

## Rotunda demo Worker (separate deploy)

`demo/` is a second Cloudflare Worker (`fnp-mapa-milczenia`, route `fnp.silence-tax.com/rotunda*`, D1 `fnp-rotunda`) that runs ahead of the calculator on the same host. It has its own `wrangler.jsonc`, `SPEC.md`, migrations and secrets (`TYPESAFE_API_KEY`, `DEMO_CODE`, `MOD_CODE`). Run it with `npm run demo:dev`, deploy with `npm run demo:deploy`; `npm run deploy` does not touch it. Its tests live in `src/rotunda.test.js` and `src/demoWorker.test.js`. The Worker must never log answer text.

## Data flow

`useParamsState` (inputs) → `useCostCalculation` → `validateInputs` (`src/inputs.js`) → `computeFnpAnalysis` (`src/fnpModel.js`, FNP priors on top of the Silence Tax engine via the `src/logic.js` barrel) → `src/sections/*` render the result. Area labels and descriptions shown in the app live in `src/channels.js` and `src/sections/*`.

<!-- imported-from: codex:project:instructions -->
# AGENTS.md

Guidance for coding agents working in this repository.

## What this repository is

Public FNP calculator: **Kalkulator Rezyliencji FNP**. Dual-brand with Silence Tax as the named engine. Collaboration between Fundacja Nowe Przestrzenie and Paweł Mamcarz.

This is the public, cautious-mode product. Live at **https://fnp.silence-tax.com** (Cloudflare Worker `kalkulator-rezyliencji-fnp`, custom domain). The full academic/optimizer surface stays at [silence-tax.com](https://silence-tax.com) / [pawelmamcarz/podatekodmilczenia](https://github.com/pawelmamcarz/podatekodmilczenia) (`~/claude/silence-tax` and `~/claude/podatekodmilczenia`). Do not copy doctoral papers, HiGHS UI, or the 13-module ledger into this app.

## Stack and commands

React 19 + Vite 8, inline styles, no Tailwind, no CSS modules. Polish UI only.

```bash
npm run dev      # Vite
npm test         # Vitest (engine snapshots + FNP contract)
npm run lint     # ESLint
npm run build    # dist/
npm run preview  # vite preview
npm run deploy   # build + wrangler deploy → fnp.silence-tax.com
```

Push to `main` also deploys via `.github/workflows/deploy.yml` (test + `wrangler deploy`). Requires repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

Version lives in `.version` (`YYYY.WW.BUILD.PATCH`), injected as `__APP_VERSION__`.

## Product contract (do not weaken)

Output is a **scenario of scale**, not an accounting valuation, forecast, causal estimate, or ROI promise.

- Default: `scopeMode: conservative` + `CALIBRATION_MODES.conservative` + `safetySource: estimate`.
- Headline money = validated core only (turnover, errors, burnout). Other areas show „poza sumą”, without adding złoty to the total.
- One climate slider 0–100 with behavioral anchors. No 7-item Likert, no mini-quiz. Copy must say szacunek własny, nie pomiar.
- Inputs: revenue, costs, headcount, average pay, turnover, climate. Headline uses FTE, salary, climate and the declared turnover, which is required (a blank rate throws; there is no national reference). Turnover = declared rate × 0.5 (`TURNOVER_CLIMATE_WEIGHT`) × the share of exits the model's churn curve attributes to climate (1 − churn(100) / churn(s), about 29% at climate 41), so it scales with the declared rate and is zero at climate 100. Costs are for margin only. Revenue is the percent denominator and must not change any amount.
- Five reporting areas, FNP labels, not the academic channel titles:
  1. Rotacja i utrata wiedzy
  2. Błędy i compliance
  3. Wypalenie i pasywność
  4. Innowacje i uczenie się
  5. Koordynacja i hierarchia
- Do not add an intervention catalog or optimizer to this public app. Interventions follow FNP diagnosis.
- Headline copy must match the printed percent. Do not say „do 5%” next to a larger number. After FNP priors, the default firm (100M, 500 FTE, s=41) stays at or under 5% of revenue.
- Do not say the model is calibrated on Ipsos. Ipsos × FNP 2026 is Polish context; table audit is pending. Money scalars are author priors.
- Footer: Fundacja Nowe Przestrzenie × Paweł Mamcarz, „silnik: Silence Tax”.

## Engine

`src/logic/` is copied from Silence Tax. Prefer pulling formula fixes from `podatekodmilczenia` rather than forking them here. Keep `AUTHOR'S EXTENSION` markers. `src/logic.test.js` guards calibration; `src/fnp.test.js` guards the public contract.

Do not re-export `highsOptimizer` from `src/logic.js`. The public bundle must stay without HiGHS/WASM. Tests import the solver from `src/logic/highsOptimizer.js` directly.

## Methodology

Public research only. Ipsos × FNP 2026 is context, not a completed table audit. Open code is inspectability, not proof. LICENSE disclaimer stays. FNP priors live in `src/fnpModel.js` (problem mix, no burnout→turnover and no blameRate→errors kick, required declared turnover, blank, non-numeric or out-of-range climate or turnover throws). The engine normalises silence-type weights within the headline, so they move cost between the three areas without changing the sum. Do not change `DEFAULT_PROBLEM_DIST` used by `logic.test.js`. Optional Node-only claim audit: `npm run jev:audit` (Jev / TypeSafe; key from `TYPESAFE_API_KEY` only; see `docs/JEV-AUDYT.md`). Do not import it into the public bundle.

Node-only batch run of the public model for the validation study: `npm run fnp:wsad` (`scripts/fnp-wsad.js`, see `docs/WSAD.md`). Do not import it into the public bundle.

## Conventions

- Polish diacritics required.
- No em-dashes. Comma, colon, period, or en-dash for ranges.
- UI work follows `docs/DESIGN.md` (binding): role tokens, type scale and layout classes live in `src/index.css`; components use those classes, with inline styles only for one-off spacing.
- Verify UI in the browser (desktop and mobile) before calling a visual change done.

## Version control

Remote: `https://github.com/pawelmamcarz/kalkulator-rezyliencji-fnp.git`. Branch: `main`.
