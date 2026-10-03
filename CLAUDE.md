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
