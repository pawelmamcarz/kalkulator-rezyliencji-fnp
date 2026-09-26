---
name: verify
description: Run the FNP calculator and the Rotunda demo Worker locally and drive them in headless Chrome to verify a change.
---

# Verify locally

Two surfaces:
- **Calculator** (`src/`): `npm run build && npx vite preview --port 4180 --strictPort`, open `http://localhost:4180/` and `/?konferencja`.
- **Rotunda demo Worker** (`demo/`): needs `demo/.dev.vars` with `TYPESAFE_API_KEY`, `DEMO_CODE`, `MOD_CODE` (git-ignored; copy the key from `.env`). Then:
  ```bash
  npx wrangler d1 migrations apply fnp-rotunda --local -c demo/wrangler.jsonc   # local state can vanish after npm ci / wrangler upgrade
  npx wrangler d1 execute fnp-rotunda --local -c demo/wrangler.jsonc --command "DELETE FROM wpisy"
  npx wrangler dev -c demo/wrangler.jsonc --port 8799
  ```
  Pages: `/rotunda/?kod=…` (phone), `/rotunda/ekran/?kod=…` (1920×1080), `/rotunda/moderacja/?kod=…&mod=…`, `/rotunda/analiza/?kod=…`. Calls real Jev: costs TypeSafe credits.

## Driving the browser

No Playwright in the repo. `cdp.mjs` here is a tiny Chrome DevTools Protocol driver (Node built-in WebSocket, system Chrome):
`node .claude/skills/verify/cdp.mjs /abs/path/script.mjs`, where the script does `export default async (p) => { await p.viewport(390, 844, true); await p.goto(url); await p.type("#text", "…"); await p.click('[data-rola="menedzer"]'); await p.waitFor('…'); await p.shot(path, true); }`.
Use `p.viewport` for true phone widths (plain `--window-size` has a minimum width and clips).

## Gotchas

- Phone page toggles the result with `#result.on` (class), not `hidden`.
- Rate limit: 5 entries per browser (`localStorage["fnp-rotunda-client"]`) and 60 per IP per 10 min. For a "new browser" remove that key; clear `wpisy` between runs. Remote D1 needs each new migration applied with `--remote` before `demo:deploy`.
- `demo/src/worker.js` may export only `default`; workerd refuses to start on other named exports (they live in `app.js`).
- Production deploys (`npm run demo:deploy`, `wrangler secret put`, remote D1) are blocked in auto mode; the user runs them.
