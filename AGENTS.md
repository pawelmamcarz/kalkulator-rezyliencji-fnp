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
- Inputs: revenue, costs, headcount, average pay, turnover, climate. Headline uses FTE, salary, climate and declared turnover (mixed with GUS 14.8%, capped by the typed rate). Costs are for margin only. Revenue is the percent denominator.
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

Public research only. Ipsos × FNP 2026 is context, not a completed table audit. Open code is inspectability, not proof. LICENSE disclaimer stays. FNP priors live in `src/fnpModel.js` (problem mix, no burnout→turnover kick, declared turnover). Do not change `DEFAULT_PROBLEM_DIST` used by `logic.test.js`. Optional Node-only claim audit: `npm run jev:audit` (Jev / TypeSafe; key from `TYPESAFE_API_KEY` only; see `docs/JEV-AUDYT.md`). Do not import it into the public bundle.

## Conventions

- Polish diacritics required.
- No em-dashes. Comma, colon, period, or en-dash for ranges.
- Inline styles + tokens in `src/index.css`.
- Verify UI in the browser (desktop and mobile) before calling a visual change done.

## Version control

Remote: `https://github.com/pawelmamcarz/kalkulator-rezyliencji-fnp.git`. Branch: `main`.
