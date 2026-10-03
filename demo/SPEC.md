# Rotunda: „Czego nie powiedziałeś w tym miesiącu?”

Booth game for the FNP conference, 19 listopada 2026. Worker `fnp-mapa-milczenia`, route `fnp.silence-tax.com/rotunda*`. Polish UI, diacritics, no em-dashes (U+2014). Shown as „prototyp”: a map of what visitors chose to write, judged by an LLM service (Jev), not a measurement of any person, room or company, and not validated on real answers.

## Wording rules (all pages)

- Say what a number is and what its denominator is. Never „sali”, „milczy ta sala”, „dlaczego milczymy”: entries come from people who chose to write, and one person can write more than once.
- Jev judges one sentence: whether it describes withholding something („opisuje przemilczenie”), which causes it indicates, which area. Labels describe the sentence, never the person or whether anyone listened.
- The silence number on the phone is Jev's confidence that the sentence describes withholding, with „szacunek, nie pomiar”.
- „anonimowo” only for what appears on the screen. The act of writing is „bez imienia i logowania” (the server keeps salted hashes of IP and browser id for the rate limit).
- Toyota andon fact only as an analogy, with its source: BBC News, „The triumph of lean production”, February 2007 (Georgetown, Kentucky: about 2,000 cord pulls a week, versus twice a week at a Ford plant). Never equate one judged sentence with a failure to report.
- Calculator: always „Kalkulator Rezyliencji FNP”, linked as `https://fnp.silence-tax.com/?konferencja`, with no other parameter. Hard rule: no share, role breakdown or Jev judgment is ever converted into złoty or into the calculator's climate input; no Rotunda page shows or asks for an amount. The pages say the calculator does not use the game's result. Tested in `src/rotunda.test.js`.
- Footer on every page: „Fundacja Nowe Przestrzenie × Paweł Mamcarz · silnik: Jev (TypeSafe)” and „prototyp”.

## Flow

1. Phone (`/rotunda/`): visitor draws a card with a sentence starter, finishes the sentence (max 200 chars), picks a role, optionally ticks consent for a quote on the screen (shown without name, after moderation), sends. No access code.
2. Jev judges the entry. Phone shows: whether the sentence describes withholding, Jev's confidence, the main cause indicated in the sentence, and, from `minN.share` silent entries on, the share of entries describing withholding that indicate the same main cause (with n = number of such entries). Then the Toyota analogy, the quote status, and a teaser for the calculator that says it does not use this result.
3. Big screen (`/rotunda/ekran/`): entry counter; from `minN.share` entries on, the share of entries that describe withholding, causes indicated by role, areas; rotating approved quotes; two labelled QR codes (Gra: `/rotunda/`, Kalkulator: `/?konferencja`). Below `minN.share` entries: count and a waiting panel only. Polls every 5 s.
4. Moderator (`/rotunda/moderacja/#kod=...&mod=...`): approves or rejects quotes before they reach the screen.
5. Heatmap (`/rotunda/analiza/`): a demonstration on made-up answers, not a measurement of a team. Up to 25 pasted answers without an access code, team threshold 5, server-side limit of 3 analyses per IP in 10 minutes.

## Constants (shared, in `demo/src/rotunda.js`)

`ROTUNDA`: `maxText` 200, `minShareN` 10, `minRoleSize` 3, `maxQuotes` 12, `rateLimit` 5, `ipRateLimit` 60, `rateWindowMs` 10 min, `threshold` 0.5. Pages read `minShareN` and `minRoleSize` from `minN` in API responses (`{ share, role }`) and do not hardcode them.

Roles: `zarzad` „Zarząd”, `menedzer` „Menedżer / menedżerka”, `specjalista` „Specjalista / specjalistka”.

Starters (id: text):
- `szef`: „Szef nie wie, że…”
- `blad`: „Wiem o błędzie, ale…”
- `pomysl`: „Mój pomysł przepadł, bo…”
- `spotkanie`: „Na spotkaniu wszyscy kiwali głową, a ja…”
- `klient`: „Klient nie wie, że…”
- `zarzad`: „Do zarządu nie dociera, że…”
- `odejscie`: „Odchodząc z firmy, powiem, że…”
- `wolne`: „Nie mówię o tym głośno, bo…”

Causes (ids from `scripts/jev-diagnoza.lib.js`): `lek` „Lęk przed konsekwencjami”, `bezsens` „Nic się nie zmieni”, `brak_kanalu` „Brak kanału lub czasu”, `lojalnosc` „Ochrona innych”.
Areas: the five FNP areas from `AREAS` plus `brak`.

## Thresholds

- **Room share (`minShareN` = 10).** `/api/stan` publishes `silentShare`, `overall` breakdown and any role breakdown only when there are at least 10 entries; before that `silentShare` is `null`, `overall` is `{ n, suppressed: true }` and every role group is `{ n, suppressed: true }`. `/api/wpis` returns `hall.topCauseShare` only when there are at least 10 entries describing withholding; otherwise `null`.
- **Role groups (`minRoleSize` = 3).** A role group with n < 3 is `{ n, suppressed: true }`. Complementary suppression (`suppressRoles`): `overall` is public, so `overall` minus the shown groups equals the suppressed groups combined. While that remainder is more than 0 and less than 3 entries, the smallest shown group is suppressed too. Result: no published number can be narrowed down to fewer than 3 entries by subtraction. All three groups may end up suppressed.
- **Quotes.** A quote whose role group is suppressed (for either reason, or because the screen is still below 10 entries) is returned with `rola: null`.
- **Heatmap teams (`MIN_TEAM_SIZE` = 5,** from `scripts/jev-diagnoza.lib.js`, the project-wide anonymity threshold). Teams with fewer than 5 answers are `{ team, n, suppressed: true }`, and their per-answer judgments are returned as `null`.

## API (all JSON, all under `/rotunda/api/`)

Single entries, the aggregate screen and the heatmap (`api/mapa`) are public. Moderation requires `DEMO_CODE` and `MOD_CODE` in request headers. `DEMO_CODE` is also the salt for the IP and browser-id hashes.

`POST /rotunda/api/wpis`
Body: `{ rola, starter, text, consent, client }`, `client` optional: a random per-browser id (8–64 chars `[A-Za-z0-9-]`); `text` is the completion only (1–200 chars), `consent` boolean.
Rate limit, atomic: before Jev is called, one row is reserved in `wpis_requests` by a single conditional `INSERT … SELECT … WHERE (count in window) < limit`. With `client`: at most 5 per browser and 60 per IP in 10 minutes; without `client`: 5 per IP. Failed Jev calls keep their slot, so the limit also caps TypeSafe spend.
Jev state: `{ odpowiedz: "<starter text> <completion>" }`, questions = diagnosis questions plus, only when `consent`, two checks: `dane_osobowe` (names, companies, identifiable people or places) and `obrazliwe` (insults, vulgarity).
Stored in D1: judgment, role, starter, time, IP hash, browser-id hash. Text stored only when `consent` and both checks < 0.5; then `quote_status = "pending"`. Otherwise text is not stored. The text is sent to TypeSafe for judging regardless of consent.
Response 200:
```json
{ "id": "…", "judgment": { "silence": 0.91, "silent": true, "area": "bledy", "causes": ["lek"], "topCause": "lek", "severity": 2.4 },
  "hall": { "total": 57, "silent": 41, "topCauseShare": 0.38, "minN": { "share": 10, "role": 3 } },
  "quote": "pending" | "not_stored" }
```
`silence` = Jev's probability that the sentence describes withholding. `topCause` = highest cause probability when silent, else null. `hall.silent` = entries describing withholding (after insert). `topCauseShare` = share of those whose `topCause` equals this one; `null` when this entry has no `topCause` or `hall.silent < minN.share`. The phone prints „Tę samą główną przyczynę ma X% wpisów opisujących przemilczenie (n = hall.silent)”.
Errors: 400 invalid input, 429 rate limit, 502 Jev failure, 503 not configured. Error body `{ "error": "<Polish message>" }`.

`GET /rotunda/api/stan`
```json
{ "total": 57, "silentShare": 0.72, "minN": { "share": 10, "role": 3 }, "updatedAt": "ISO",
  "overall": { "n": 57, "silent": 41, "causes": { "lek": 15, … }, "areas": { "bledy": 9, … } },
  "byRole": { "zarzad": { same shape } | { "n": 2, "suppressed": true }, "menedzer": {…}, "specjalista": {…} },
  "quotes": [ { "id": "…", "text": "<starter> <completion>", "rola": "menedzer" | null, "topCause": "lek" } ] }
```
`causes` and `areas` count only entries describing withholding (a sentence can indicate several causes or none, so cause bars do not sum to 100%); the screen divides both by `silent`. `silentShare` = `overall.silent / total`, or `null` below `minN.share`. `quotes`: up to 12 most recently approved. Thresholds and suppression as above.

`GET /rotunda/api/moderacja` with headers `X-Rotunda-Code: <DEMO_CODE>` and `X-Rotunda-Mod: <MOD_CODE>` → `{ "pending": [ { id, text, rola, createdAt, dane_osobowe, obrazliwe } ] }` (oldest first).
`POST /rotunda/api/moderacja` with the same headers, body `{ id, decision: "approve" | "reject" }` → `{ ok: true }`. Rejecting deletes the stored text.
Any moderation request with `code`, `mod` or `kod` in the query string → 400 (before the codes are checked), because URLs can end up in logs. Codes in a POST body are ignored. Wrong or missing header codes → 403.

`POST /rotunda/api/mapa` body `{ answers: [ { team, text } ] }` (1–25 answers, text ≤ 500, team 1–40 chars) → `{ teams, answers, minTeamSize: 5, maxAnswers: 25 }`. At most 3 analyses per IP in 10 minutes (atomic reservation in `mapa_requests`). Jev-call ceiling per IP: 25 × 3 = 75 per 10 minutes (before this change: 20 × 3 = 60). Nothing is stored except the reservation row (IP hash, time).

## Storage

D1 binding `DB`, database `fnp-rotunda`. Migrations in `demo/migrations/`:
- `0001_wpisy.sql`: `wpisy(id TEXT PK, created_at TEXT, rola TEXT, starter TEXT, silence REAL, area TEXT, top_cause TEXT, causes TEXT /* JSON array */, severity REAL, text TEXT NULL, quote_status TEXT NULL /* pending|approved|rejected */, ip_hash TEXT, dane_osobowe REAL NULL, obrazliwe REAL NULL, moderated_at TEXT NULL)`.
- `0002_client_hash.sql`: `wpisy.client_hash`.
- `0003_mapa_requests.sql`: `mapa_requests(id, ip_hash, created_at)`.
- `0004_wpis_requests.sql`: `wpis_requests(id, ip_hash, client_hash, created_at)`, the atomic rate limit for `/api/wpis`.

`ip_hash` = SHA-256 of `CF-Connecting-IP` + `DEMO_CODE`; `client_hash` likewise for the browser id. Raw IPs and browser ids are never stored. Nothing is purged automatically: entries are kept until the organiser deletes them (the phone page says so).

## Before and after the event (run by the owner)

All commands below are run by the owner by hand; agents do not run remote D1 commands or deploy.

Before 19.11 (after the last rehearsal):
1. Apply new migrations remotely: `npx wrangler d1 migrations apply fnp-rotunda --remote -c demo/wrangler.jsonc` (0004 is required before deploying this version).
2. Deploy: `npm run demo:deploy`.
3. Clear test entries: `npx wrangler d1 execute fnp-rotunda --remote -c demo/wrangler.jsonc --command "DELETE FROM wpisy; DELETE FROM wpis_requests; DELETE FROM mapa_requests;"`
4. Check: `npx wrangler d1 execute fnp-rotunda --remote -c demo/wrangler.jsonc --command "SELECT COUNT(*) FROM wpisy"` returns 0; open `/rotunda/ekran/` and see the empty state.
5. Give moderators the link with the codes in the fragment: `https://fnp.silence-tax.com/rotunda/moderacja/#kod=<DEMO_CODE>&mod=<MOD_CODE>` (the fragment is not sent to the server; `?kod=` still works but puts the codes in the page request URL).

After the event:
1. Export what you want to keep (judgments only; no text unless approved): `npx wrangler d1 export fnp-rotunda --remote -c demo/wrangler.jsonc --output rotunda-<date>.sql`. Store it outside the repository.
2. Delete: `npx wrangler d1 execute fnp-rotunda --remote -c demo/wrangler.jsonc --command "DELETE FROM wpisy; DELETE FROM wpis_requests; DELETE FROM mapa_requests;"`
3. If the owner commits to deleting after the conference as a rule, record it here and change the phone sentence to „Wpisy usuniemy po konferencji.”

## Pages

Visual language as `demo/public/rotunda/index.html`: paper background with grid, IBM Plex Mono headings uppercase, Source Serif 4 body, black rules, accent `#b81a1a`, stamp blue `#0a3a82`. Inline CSS, vanilla JS, no frameworks. Mobile first for phone and moderator pages; screen page scales its 1920×1080 layout to the desktop viewport. Public pages call the API with relative paths (`../api/...` from subfolders, `api/...` from `/rotunda/`). The moderator page reads `kod` and `mod` once from the fragment (or, for old links, the query string), keeps them in localStorage, strips the address bar, and sends them only in the `X-Rotunda-*` headers.
