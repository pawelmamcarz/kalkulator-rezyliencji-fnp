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

## Data flow

`useParamsState` (inputs) → `useCostCalculation` → `validateInputs` (`src/inputs.js`) → `computeFnpAnalysis` (`src/fnpModel.js`, FNP priors on top of the Silence Tax engine via the `src/logic.js` barrel) → `src/sections/*` render the result. Area labels/descriptions live in `src/channels.js` and `src/descriptions.js`.
