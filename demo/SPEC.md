# Rotunda: „Czego nie powiedziałeś / powiedziałaś w tym miesiącu?”

Booth game for the FNP conference, 19 listopada 2026. Worker `fnp-mapa-milczenia`, route `fnp.silence-tax.com/rotunda*`. Polish UI, diacritics, no em-dashes (U+2014). Shown as „prototyp”: a map of what visitors chose to write, judged by an LLM service (Jev), not a measurement of any person, room or company, and not validated on real answers.

## Wording rules (all pages)

- Say what a number is and what its denominator is. Never „sali”, „milczy ta sala”, „dlaczego milczymy”: entries come from people who chose to write, and one person can write more than once.
- Jev judges one sentence: whether it describes withholding something („opisuje przemilczenie”), which causes it indicates, which area. Labels describe the sentence, never the person or whether anyone listened.
- The silence number on the phone is Jev's confidence that the sentence describes withholding, with „szacunek, nie pomiar”.
- „anonimowo” only for what appears on the screen. The act of writing is „bez imienia i logowania” (the server keeps salted hashes of IP and browser id for the rate limit).
- Toyota andon fact only as an analogy, with its source: BBC News, „The triumph of lean production”, February 2007 (Georgetown, Kentucky: about 2,000 cord pulls a week, versus twice a week at a Ford plant). Never equate one judged sentence with a failure to report.
- Calculator: always „Kalkulator Rezyliencji FNP”, linked as `https://fnp.silence-tax.com/?konferencja`, with no other parameter. Hard rule: no share, role breakdown or Jev judgment is ever converted into złoty or into the calculator's climate input; no Rotunda page shows or asks for an amount. The pages say the calculator does not use the game's result. Tested in `src/rotunda.test.js`.
- Inclusive forms, one convention on every page: both forms in full, separated by „ / ” („Menedżer / menedżerka”, „Specjalista / specjalistka”, „powiedziałeś / powiedziałaś”). Counts of entries use the Polish plural forms (1 wpis, 2–4 wpisy, 5+ wpisów).
- Footer on every page: „Fundacja Nowe Przestrzenie × Paweł Mamcarz · silnik: Jev (TypeSafe)” and „prototyp”.

## Flow

1. Phone (`/rotunda/`): visitor draws a card with a sentence starter, finishes the sentence (max 200 chars), picks a role, optionally ticks consent for a quote on the screen (shown without name, after moderation), sends. No access code.
2. Jev judges the entry. Phone shows: whether the sentence describes withholding, Jev's confidence, the main cause indicated in the sentence, and, from `minN.share` silent entries on, the share of entries describing withholding that indicate the same main cause (with n = number of such entries). Then the Toyota analogy, the quote status, and a teaser for the calculator that says it does not use this result.
3. Big screen (`/rotunda/ekran/`): entry counter; from `minN.share` entries on, the share of entries that describe withholding, causes indicated by role, areas; rotating approved quotes; two labelled QR codes (Gra: `/rotunda/`, Kalkulator: `/?konferencja`). Below `minN.share` entries: count and a waiting panel only. Polls every 5 s. Until the first successful answer the counters stay blank („–”) and the panel says „Łączenie…”, then „Brak połączenia z serwerem”: no data is never shown as zero entries. Area bars and cause bars share one scale (share of entries describing withholding).
4. Moderator (`/rotunda/moderacja/#mod=...`): one field, „Hasło moderatora”. Approves or rejects quotes before they reach the screen, and sees the quotes approved so far („Na ekranie”), each with „Zdejmij z ekranu” (asks for confirmation, deletes the text). At the very bottom, a collapsed „Przed wydarzeniem” section clears all entries (see „Clearing entries”). No keyboard shortcuts: a stray key must never approve or delete.
5. Heatmap (`/rotunda/analiza/`): a demonstration on made-up answers, not a measurement of a team. Up to 25 pasted answers without an access code, team threshold 5, server-side limit of 30 analyses per IP in 10 minutes (the presenter shares the venue address with the audience). The results carry „Dane wymyślone, demonstracja” in the table caption and the per-answer heading; a failed run clears the previous results.

## Constants (shared, in `demo/src/rotunda.js`)

`ROTUNDA`: `maxText` 200, `minShareN` 10, `minRoleSize` 3, `maxQuotes` 12, `rateLimit` 5, `ipRateLimit` 1500 (a whole conference room behind one venue address), `rateWindowMs` 10 min, `threshold` 0.5, `jevTimeoutMs` 15 s, `staleEntryMs` 30 s. Pages read `minShareN` and `minRoleSize` from `minN` in API responses (`{ share, role }`) and do not hardcode them.

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

Single entries, the aggregate screen and the heatmap (`api/mapa`) are public. Moderation requires one secret, the moderator password `MOD_CODE`, in the `X-Rotunda-Mod` request header. `DEMO_CODE` is not a credential: it is only the salt for the IP, browser-id and entry-id hashes. No CORS headers are sent: the API is called same-origin by the pages and server-to-server by the Foundation's admin panel.

`POST /rotunda/api/wpis`
Body: `{ rola, starter, text, consent, client, entry }`, `client` optional: a random per-browser id (8–64 chars `[A-Za-z0-9-]`); `entry` optional, same format: a random id per submission attempt, reused by the phone when it sends the same card, text, role and consent again; `text` is the completion only (1–200 chars), `consent` boolean.
Rate limit, atomic: before Jev is called, one row is reserved in `wpis_requests` by a single conditional `INSERT … SELECT … WHERE (count in window) < limit`. With `client`: at most 5 per browser and 1500 per IP in 10 minutes; without `client`: 5 per IP. The 429 message names the limit that was hit: „Za dużo wpisów z tej przeglądarki…” or „Za dużo wpisów z tej sieci. Spróbuj za kilka minut.” When Jev does not answer (error status, network error, or no answer within `jevTimeoutMs`), the slot is given back, so an outage does not use up a visitor's entries. When Jev answers but the judgment is unusable, the slot stays used, so the limit still caps TypeSafe spend.
Idempotency: the reservation row and the stored entry carry `entry_key` (salted hash of `entry`, unique). A request whose `entry` is already stored returns that entry's result (same `id`, current `hall`): no Jev call, no second row, no slot. If it is reserved but not stored yet, the answer is 409 „Ten wpis jest jeszcze oceniany…”; a reservation older than `staleEntryMs` is taken over instead of reserving a second slot. The Worker finishes judging and storing an entry even when the phone has disconnected (`waitUntil`). The phone aborts its request after 20 s, keeps the text and asks to send again.
Jev state: `{ odpowiedz: "<starter text without its ellipsis> <completion>" }` (`fullSentence`, e.g. „Szef nie wie, że mamy opóźnienie”; the same sentence is stored and quoted), questions = diagnosis questions plus, only when `consent`, two checks: `dane_osobowe` (names, companies, identifiable people or places) and `obrazliwe` (insults, vulgarity).
Stored in D1: judgment, role, starter, time, IP hash, browser-id hash. Text stored only when `consent` and both checks < 0.5; then `quote_status = "pending"`. Otherwise text is not stored. The text is sent to TypeSafe for judging regardless of consent.
Response 200:
```json
{ "id": "…", "judgment": { "silence": 0.91, "silent": true, "area": "bledy", "causes": ["lek"], "topCause": "lek", "severity": 2.4 },
  "hall": { "total": 57, "silent": 41, "topCauseShare": 0.38, "minN": { "share": 10, "role": 3 } },
  "quote": "pending" | "not_stored" }
```
`silence` = Jev's probability that the sentence describes withholding. `topCause` = the cause with the highest probability when silent and that probability is at least `threshold`; otherwise `null` (no cause is invented when Jev indicates none; the phone then says „Jev nie wskazał wyraźnej przyczyny”, and a quote on the screen carries no cause tag). `hall.silent` = entries describing withholding (after insert). `topCauseShare` = share of those whose `topCause` equals this one; `null` when this entry has no `topCause` or `hall.silent < minN.share`. The phone prints „Tę samą główną przyczynę ma X% wpisów opisujących przemilczenie (n = hall.silent)”.
Errors: 400 invalid input, 409 the same `entry` is still being judged, 429 rate limit, 502 Jev failure or timeout, 503 not configured. Error body `{ "error": "<Polish message>" }`.

`GET /rotunda/api/stan`
```json
{ "total": 57, "silentShare": 0.72, "minN": { "share": 10, "role": 3 }, "updatedAt": "ISO",
  "overall": { "n": 57, "silent": 41, "causes": { "lek": 15, … }, "areas": { "bledy": 9, … } },
  "byRole": { "zarzad": { same shape } | { "n": 2, "suppressed": true }, "menedzer": {…}, "specjalista": {…} },
  "quotes": [ { "id": "…", "text": "<starter> <completion>", "rola": "menedzer" | null, "topCause": "lek" } ] }
```
`causes` and `areas` count only entries describing withholding (a sentence can indicate several causes or none, so cause bars do not sum to 100%); the screen divides both by `silent`. `silentShare` = `overall.silent / total`, or `null` below `minN.share`. `quotes`: up to 12 most recently approved. Thresholds and suppression as above.

Moderation auth (both methods of `/rotunda/api/moderacja`), checked in this order:
1. `code`, `mod` or `kod` in the query string → 400, because URLs can end up in logs.
2. `MOD_CODE` not set, or shorter than 12 characters → 503 with a message naming `MOD_CODE`. An empty or weak secret never authenticates.
3. `X-Rotunda-Mod` header different from `MOD_CODE` (constant-time compare), or missing → 403 `{ "error": "Niepoprawne hasło moderatora." }`.

An `X-Rotunda-Code` header (sent by pages loaded from older links) is ignored. A password in a POST body is ignored.

`GET /rotunda/api/moderacja` with header `X-Rotunda-Mod: <MOD_CODE>` → `{ "pending": [ { id, text, rola, createdAt, dane_osobowe, obrazliwe } ], "approved": [ { id, text, rola, moderatedAt } ], "maxQuotes": 12, "counts": { "entries": 57, "pending": 3, "approved": 9 } }` (`pending` oldest first; `approved` most recently approved first, the order of the screen, which rotates the first `maxQuotes`; `counts.entries` = all rows in `wpisy`, with or without stored text; `counts.pending` and `counts.approved` = lengths of the two lists).
`POST /rotunda/api/moderacja` with the same header, body `{ id, decision: "approve" | "reject" }` → `{ ok: true }`. Rejecting deletes the stored text; it also works on an approved quote, which is how the moderator takes one off the screen. 400 for a missing `id` or another `decision`, 404 when there is no such quote with stored text.
`POST /rotunda/api/moderacja` with the same header, body `{ "action": "reset", "confirm": "USUN WPISY" }` → `{ "ok": true, "deleted": { "wpisy": 57, "wpis_requests": 61, "mapa_requests": 4 } }`. Deletes every row of the three tables in one D1 batch (one transaction). `confirm` must be exactly that string (no diacritics, upper case, one space), otherwise 400 and nothing is deleted; any other `action` → 400. A body with `action` is never treated as approve or reject. For clearing test entries before the event; repeating it is harmless.

`POST /rotunda/api/mapa` body `{ answers: [ { team, text } ] }` (1–25 answers, text ≤ 500, team 1–40 chars) → `{ teams, answers, minTeamSize: 5, maxAnswers: 25 }`. At most 30 analyses per IP in 10 minutes (atomic reservation in `mapa_requests`). Jev-call ceiling per IP: 25 × 30 = 750 per 10 minutes. Each Jev call is given up after 25 s. Nothing is stored except the reservation row (IP hash, time).

## Storage

D1 binding `DB`, database `fnp-rotunda`. Migrations in `demo/migrations/`:
- `0001_wpisy.sql`: `wpisy(id TEXT PK, created_at TEXT, rola TEXT, starter TEXT, silence REAL, area TEXT, top_cause TEXT, causes TEXT /* JSON array */, severity REAL, text TEXT NULL, quote_status TEXT NULL /* pending|approved|rejected */, ip_hash TEXT, dane_osobowe REAL NULL, obrazliwe REAL NULL, moderated_at TEXT NULL)`.
- `0002_client_hash.sql`: `wpisy.client_hash`.
- `0003_mapa_requests.sql`: `mapa_requests(id, ip_hash, created_at)`.
- `0004_wpis_requests.sql`: `wpis_requests(id, ip_hash, client_hash, created_at)`, the atomic rate limit for `/api/wpis`.
- `0005_entry_key.sql`: `wpis_requests.entry_key` and `wpisy.entry_key` (nullable, unique): the idempotency key for `/api/wpis`.

`ip_hash` = SHA-256 of `CF-Connecting-IP` + `DEMO_CODE`; `client_hash` likewise for the browser id. Raw IPs and browser ids are never stored. Nothing is purged automatically: entries are kept until the organiser deletes them (the phone page says so).

## Before and after the event (run by the owner)

All commands below are run by the owner by hand; agents do not run remote D1 commands or deploy.

Before 19.11 (after the last rehearsal):
1. Apply new migrations remotely: `npx wrangler d1 migrations apply fnp-rotunda --remote -c demo/wrangler.jsonc` (0005 is required before deploying this version: without it every `/api/wpis` request fails).
2. Deploy: `npm run demo:deploy`.
3. Check the moderator password: `MOD_CODE` must be at least 12 characters, otherwise moderation answers 503. If it is shorter, set a new one: `npx wrangler secret put MOD_CODE -c demo/wrangler.jsonc`. Leave `DEMO_CODE` as it is: it is the hashing salt, and changing it during the event would reset the rate limits.
4. Clear test entries from the moderation page: open „Przed wydarzeniem” at the bottom, read the entry count, type `USUN WPISY`, press „Usuń wszystkie wpisy testowe”. The page reports how many rows were deleted. (Same effect by hand: `npx wrangler d1 execute fnp-rotunda --remote -c demo/wrangler.jsonc --command "DELETE FROM wpisy; DELETE FROM wpis_requests; DELETE FROM mapa_requests;"`.)
5. Check: the section shows „W bazie: 0 wpisów”; open `/rotunda/ekran/` and see the empty state.
6. Give moderators the link with the password in the fragment: `https://fnp.silence-tax.com/rotunda/moderacja/#mod=<MOD_CODE>` (the fragment is not sent to the server; `?mod=` still works but puts the password in the page request URL). Older links of the form `#kod=…&mod=…` keep working; the `kod` part is ignored. The same password is the one the Foundation's admin panel sends in `X-Rotunda-Mod`.

After the event:
1. Export what you want to keep (judgments only; no text unless approved): `npx wrangler d1 export fnp-rotunda --remote -c demo/wrangler.jsonc --output rotunda-<date>.sql`. Store it outside the repository.
2. Delete: „Przed wydarzeniem” on the moderation page as above, or `npx wrangler d1 execute fnp-rotunda --remote -c demo/wrangler.jsonc --command "DELETE FROM wpisy; DELETE FROM wpis_requests; DELETE FROM mapa_requests;"`
3. If the owner commits to deleting after the conference as a rule, record it here and change the phone sentence to „Wpisy usuniemy po konferencji.”

## Pages

Visual language: the Foundation's, as on ambasador.noweprzestrzenie.pl. Shared tokens and the `.btn` button live in `demo/public/rotunda/brand.css` (ink `#111`, muted `#5c5c5c`, orange `#ff511f`, orange dark `#d63c12`, yellow `#f6d087`, blue `#87daf4`, pale `#faf8f4`, sage `#f4f1ea`, line `#e6e2da`); page-specific CSS stays inline. One face, Outfit, self-hosted from `fonts/` (SIL OFL 1.1, licence next to it); the original Foundation and Summit logos are in `img/`. No request leaves the host: no font CDN, no script CDN. Sentence case, no uppercase labels, no monospace, tabular figures for numbers. Orange is a fill with ink on it, never small text on white (3.26:1); error text uses orange dark (4.66:1).

Circle language, one element per page: the screen shows the share of entries describing withholding as an orange disc inside a blue ring (disc area = share, as the calculator's disc); the phone card is a yellow card and the judgment a coloured panel (orange: describes withholding, blue: does not), the words always present; the heatmap table shades cells from pale to orange with the value printed in every cell, and shows a team's share as a small disc in a ring.

Motion: the Motion library (`motion` 12.23.22, UMD build vendored as `vendor/motion.js`, MIT licence next to it, global `Motion`). Screen: counters count to a new value, the disc and bars spring to it (transform only), quotes leave upwards and arrive from below, the ring pulses once when a poll brings new entries; an unchanged `/api/stan` answer touches nothing. Phone: the card is drawn, the judgment opens once. Heatmap: cells take their colour once after „Pokaż mapę”. With `prefers-reduced-motion`, or if the file fails to load, every change is instant. No looping decoration. The screen is a fixed 1920×1080 canvas: text a viewer must read is at least 22 px, quotes never shrink under 24 px.

Vanilla JS, no frameworks, no build step. Mobile first for phone and moderator pages; screen page scales its 1920×1080 layout to the desktop viewport. Public pages call the API with relative paths (`../api/...` from subfolders, `api/...` from `/rotunda/`). The moderator page reads `mod` once from the fragment (or, for old links, the query string), keeps it in localStorage (`fnp-demo-mod`), strips the address bar, and sends it only in the `X-Rotunda-Mod` header. A `kod` in an old link is ignored and a stored `fnp-demo-code` is removed.

Clearing entries („Przed wydarzeniem”, a collapsed `<details>` under everything else on the moderator page): shows the current number of entries from `counts.entries` („liczba wpisów nieznana” until the server has answered, never zero by default), a field in which the moderator types `USUN WPISY`, and the button „Usuń wszystkie wpisy testowe (n)”, disabled until the field holds exactly that string. Then it calls the reset and prints the three deleted counts. There is no single-click path; a failed call keeps the typed text for another try.
