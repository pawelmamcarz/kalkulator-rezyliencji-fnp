# Rotunda: „Czego nie powiedziałeś w tym miesiącu?”

Booth game for the FNP conference, 19 listopada 2026. Worker `fnp-mapa-milczenia`, route `fnp.silence-tax.com/rotunda*`. Polish UI, diacritics, no em-dashes (U+2014). Shown as „prototyp”: an anonymous map of the room, not a measurement of any company.

## Flow

1. Phone (`/rotunda/`): visitor draws a card with a sentence starter, finishes the sentence (max 200 chars), picks a role, optionally ticks consent for an anonymous quote on the screen, sends. No access code is needed for a single entry.
2. Jev judges the entry. Phone shows instant feedback: silence or voice, the main cause in FNP words, what share of the room shares that cause, one line about the Toyota andon cord.
3. Big screen (`/rotunda/ekran/`): public live map by role, entry counter, rotating approved quotes, and a QR code to the phone form. Polls every 5 s.
4. Moderator (`/rotunda/moderacja/?kod=...&mod=...`): approves or rejects quotes before they reach the screen.
5. Team heatmap from the earlier demo remains at `/rotunda/analiza/`. It accepts up to 20 pasted answers without an access code, with a server-side limit of 3 analyses per IP in 10 minutes.

## Constants (shared, in `demo/src/rotunda.js`)

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

## API (all JSON, all under `/rotunda/api/`)

Single entries, the aggregate screen, and the bulk paste tool (`api/mapa`) are public. Moderation requires `DEMO_CODE` and `MOD_CODE`. `DEMO_CODE` remains configured on the server as the IP hash salt.

`POST /rotunda/api/wpis`
Body: `{ rola, starter, text, consent, client }`, `client` optional: a random per-browser id (8–64 chars `[A-Za-z0-9-]`) where `text` is the completion only (1–200 chars), `consent` boolean.
Jev state: `{ odpowiedz: "<starter text> <completion>" }`, questions = diagnosis questions plus, only when `consent`, two Noul checks: `dane_osobowe` (names, companies, identifiable people or places) and `obrazliwe` (insults, vulgarity).
Stored in D1: judgments only. Text stored only when `consent` and both checks < 0.5; then `quote_status = "pending"`. Otherwise text is not stored.
Response 200:
```json
{ "id": "…", "judgment": { "silence": 0.91, "silent": true, "area": "bledy", "causes": ["lek"], "topCause": "lek", "severity": 2.4 },
  "hall": { "total": 57, "topCauseShare": 0.38 }, "quote": "pending" | "not_stored" }
```
`topCause` = highest cause noul when silent, else null. `topCauseShare` = share of silent entries in the room whose topCause equals this one (after insert). `quote` tells the phone whether the text went to moderation.
Errors: 400 invalid input, 429 when the same browser (`client`) sent more than 5 entries in 10 minutes, or the same IP more than 60 (without `client`: 5 per IP), 502 Jev failure. Error body `{ "error": "<Polish message>" }`.

`GET /rotunda/api/stan`
```json
{ "total": 57, "silentShare": 0.72, "updatedAt": "ISO",
  "overall": { "n": 57, "silent": 41, "causes": { "lek": 15, … }, "areas": { "bledy": 9, … } },
  "byRole": { "zarzad": { same shape }, "menedzer": {…}, "specjalista": {…} },
  "quotes": [ { "id": "…", "text": "<starter> <completion>", "rola": "menedzer", "topCause": "lek" } ] }
```
Role groups with n < 3 return `{ "n": <n>, "suppressed": true }`. `quotes`: up to 12 most recently approved.

`GET /rotunda/api/moderacja?code=...&mod=...` → `{ "pending": [ { id, text, rola, createdAt, dane_osobowe, obrazliwe } ] }` (oldest first). `mod` must equal secret `MOD_CODE`, else 403.
`POST /rotunda/api/moderacja` body `{ code, mod, id, decision: "approve" | "reject" }` → `{ ok: true }`. Rejecting deletes the stored text.

## Storage

D1 binding `DB`, database `fnp-rotunda`. Migration `demo/migrations/0001_wpisy.sql`:
table `wpisy(id TEXT PK, created_at TEXT, rola TEXT, starter TEXT, silence REAL, area TEXT, top_cause TEXT, causes TEXT /* JSON array */, severity REAL, text TEXT NULL, quote_status TEXT NULL /* pending|approved|rejected */, ip_hash TEXT)`.
Rate limit uses `ip_hash` = SHA-256 of `CF-Connecting-IP` + `DEMO_CODE`; never store raw IPs.

## Pages

Visual language as `demo/public/rotunda/index.html` today: paper background with grid, IBM Plex Mono headings uppercase, Source Serif 4 body, black rules, accent `#b81a1a`, stamp blue `#0a3a82`. Inline CSS, vanilla JS, no frameworks. Mobile first for phone and moderator pages; screen page scales its 1920×1080 layout to the desktop viewport. Public pages call the API with relative paths (`../api/...` from subfolders, `api/...` from `/rotunda/`). The moderator page reads `kod` and `mod` from the query string and remembers them in localStorage.
