import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import worker from "../demo/src/worker.js";
import {
  CAUSE_LABELS, MOD_HEADERS, ROLES, ROTUNDA, STARTERS, handleModeracja, handleStan, handleWpis, suppressRoles, validateWpis,
} from "../demo/src/rotunda.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "demo/migrations");
const migration = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort()
  .map((f) => readFileSync(path.join(migrationsDir, f), "utf8")).join("\n");

// Minimal D1 stand-in over node:sqlite, running the real migration.
function fakeD1() {
  const db = new DatabaseSync(":memory:");
  db.exec(migration);
  const stmt = (sql, args = []) => ({
    bind: (...next) => stmt(sql, next),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } }),
  });
  return { prepare: (sql) => stmt(sql), raw: db };
}

// Jev stand-in: the completion text steers the judgment.
const calls = [];
function jevAnswer(text, questionIds) {
  const silent = /milcz|boję/.test(text);
  const cause = /nic się nie zmieni/.test(text) ? "bezsens" : "lek";
  const a = {
    milczenie: { type: "noul", noul: silent ? 0.91 : 0.1 },
    obszar: { type: "choice", choice: "bledy", confidence: 0.9 },
    przyczyna_lek: { type: "noul", noul: cause === "lek" ? 0.8 : 0.2 },
    przyczyna_bezsens: { type: "noul", noul: cause === "bezsens" ? 0.85 : 0.1 },
    przyczyna_brak_kanalu: { type: "noul", noul: 0.1 },
    przyczyna_lojalnosc: { type: "noul", noul: 0.1 },
    nasilenie: { type: "score", score: silent ? 2.4 : 0.2 },
  };
  if (questionIds.includes("dane_osobowe")) {
    a.dane_osobowe = { type: "noul", noul: /Kowalski/.test(text) ? 0.9 : 0.05 };
    a.obrazliwe = { type: "noul", noul: /idiota/.test(text) ? 0.95 : 0.02 };
  }
  return a;
}
const fakeFetch = async (_url, init) => {
  const { state, questions } = JSON.parse(init.body);
  calls.push({ state, questionIds: Object.keys(questions) });
  return { ok: true, status: 200, text: async () => JSON.stringify({ answers: jevAnswer(state.odpowiedz, Object.keys(questions)) }) };
};

let env;
beforeEach(() => {
  calls.length = 0;
  env = { DEMO_CODE: "stoisko", MOD_CODE: "moderator", TYPESAFE_API_KEY: "test", DB: fakeD1() };
});

let ipCounter = 0;
const wpis = (body, ip = `10.0.0.${++ipCounter}`) => new Request("https://fnp.test/rotunda/api/wpis", {
  method: "POST",
  headers: { "CF-Connecting-IP": ip },
  body: JSON.stringify({ code: "stoisko", rola: "menedzer", starter: "blad", text: "boję się kary", consent: false, ...body }),
});
const send = async (body, ip) => handleWpis(wpis(body, ip), env, fakeFetch);
const stan = async () => (await handleStan(new Request("https://fnp.test/rotunda/api/stan?code=stoisko"), env)).json();
const auth = (code = "stoisko", mod = "moderator") => ({ [MOD_HEADERS.code]: code, [MOD_HEADERS.mod]: mod });
const modGet = (headers = auth(), q = "") => handleModeracja(new Request(`https://fnp.test/rotunda/api/moderacja${q}`, { headers }), env);
const modPost = (body, headers = auth(), now) => handleModeracja(new Request("https://fnp.test/rotunda/api/moderacja", {
  method: "POST", headers, body: JSON.stringify(body),
}), env, now);
const MIN_N = { share: ROTUNDA.minShareN, role: ROTUNDA.minRoleSize };
const rows = () => env.DB.raw.prepare("SELECT * FROM wpisy").all();

describe("rotunda constants", () => {
  it("match the SPEC texts", () => {
    expect(ROLES).toEqual({ zarzad: "Zarząd", menedzer: "Menedżer / menedżerka", specjalista: "Specjalista / specjalistka" });
    expect(Object.keys(STARTERS)).toEqual(["szef", "blad", "pomysl", "spotkanie", "klient", "zarzad", "odejscie", "wolne"]);
    expect(STARTERS.spotkanie).toBe("Na spotkaniu wszyscy kiwali głową, a ja…");
    expect(CAUSE_LABELS).toEqual({ lek: "Lęk przed konsekwencjami", bezsens: "Nic się nie zmieni", brak_kanalu: "Brak kanału lub czasu", lojalnosc: "Ochrona innych" });
    const source = readFileSync(path.join(root, "demo/src/rotunda.js"), "utf8");
    expect(source).not.toContain("—");
    expect(source).not.toMatch(/console\./);
  });
});

describe("POST /rotunda/api/wpis", () => {
  it("accepts a public entry without a code, while keeping a server-side hash salt", async () => {
    expect((await send({ code: undefined })).status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(rows()).toHaveLength(1);
    expect((await handleWpis(wpis({ code: undefined }), { ...env, DEMO_CODE: "" }, fakeFetch)).status).toBe(503);
    expect(calls).toHaveLength(1);
  });

  it("validates role, starter, text length and consent", async () => {
    const ok = { rola: "zarzad", starter: "szef", text: "x", consent: true };
    expect(validateWpis(ok)).toBeNull();
    expect(validateWpis({ ...ok, text: "x".repeat(ROTUNDA.maxText) })).toBeNull();
    expect(validateWpis({ ...ok, rola: "prezes" })).toMatch(/rolę/);
    expect(validateWpis({ ...ok, rola: "__proto__" })).toMatch(/rolę/);
    expect(validateWpis({ ...ok, starter: "inne" })).toMatch(/karta/);
    expect(validateWpis({ ...ok, text: "   " })).toMatch(/znaków/);
    expect(validateWpis({ ...ok, text: "x".repeat(ROTUNDA.maxText + 1) })).toMatch(/znaków/);
    expect(validateWpis({ ...ok, text: 5 })).toMatch(/znaków/);
    expect(validateWpis({ ...ok, consent: "tak" })).toMatch(/zgod/);
    expect(validateWpis({ ...ok, consent: undefined })).toMatch(/zgod/);
    const res = await send({ rola: "prezes" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: expect.any(String) });
    expect(calls).toHaveLength(0);
  });

  it("returns exactly the SPEC shape and stores no text without consent", async () => {
    const res = await send({ text: "boję się kary za zgłoszenie" });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Object.keys(data).sort()).toEqual(["hall", "id", "judgment", "quote"]);
    expect(data.judgment).toEqual({ silence: 0.91, silent: true, area: "bledy", causes: ["lek"], topCause: "lek", severity: 2.4 });
    // One entry: no share yet, only counts and the thresholds.
    expect(data.hall).toEqual({ total: 1, silent: 1, topCauseShare: null, minN: MIN_N });
    expect(data.quote).toBe("not_stored");
    expect(calls[0].state).toEqual({ odpowiedz: "Wiem o błędzie, ale… boję się kary za zgłoszenie" });
    expect(calls[0].questionIds).not.toContain("dane_osobowe");
    const [row] = rows();
    expect(row).toMatchObject({ id: data.id, rola: "menedzer", starter: "blad", text: null, quote_status: null, top_cause: "lek" });
    expect(JSON.stringify(row)).not.toContain("boję");
    expect(row.ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row)).not.toContain("10.0.0.");
  });

  it("stores the full sentence as pending only with consent and clean checks", async () => {
    const res = await send({ consent: true, text: "boję się kary" });
    const data = await res.json();
    expect(data.quote).toBe("pending");
    expect(calls[0].questionIds).toEqual(expect.arrayContaining(["dane_osobowe", "obrazliwe"]));
    expect(rows()[0]).toMatchObject({ text: "Wiem o błędzie, ale… boję się kary", quote_status: "pending" });
  });

  it("does not store text when dane_osobowe or obrazliwe is at least 0.5", async () => {
    const a = await (await send({ consent: true, text: "boję się, Kowalski się mści" })).json();
    const b = await (await send({ consent: true, text: "boję się, szef to idiota" })).json();
    expect(a.quote).toBe("not_stored");
    expect(b.quote).toBe("not_stored");
    expect(rows().map((r) => [r.text, r.quote_status])).toEqual([[null, null], [null, null]]);
  });

  it("gives a voice entry no top cause and no share", async () => {
    const data = await (await send({ text: "mówię wprost na przeglądzie" })).json();
    expect(data.judgment).toMatchObject({ silent: false, causes: [], topCause: null });
    expect(data.hall).toEqual({ total: 1, silent: 0, topCauseShare: null, minN: MIN_N });
  });

  it("computes topCauseShare among silent entries only, and only from minShareN of them", async () => {
    expect(ROTUNDA.minShareN).toBe(10);
    for (let i = 0; i < 6; i++) await send({ text: `boję się ${i}` });
    await send({ text: "mówię wprost" });
    await send({ text: "mówię wprost, naprawdę" });
    for (let i = 0; i < 3; i++) await send({ text: `milczę, bo nic się nie zmieni ${i}` });
    // 9 silent entries: below the threshold, no share.
    expect((await rows()).length).toBe(11);
    const below = await (await send({ text: "boję się jeszcze" })).json();
    expect(below.hall).toMatchObject({ total: 12, silent: 10 });
    expect(below.hall.topCauseShare).toBeCloseTo(7 / 10);
    const data = await (await send({ text: "milczę, bo nic się nie zmieni, serio" })).json();
    expect(data.judgment.topCause).toBe("bezsens");
    // The denominator is the 11 silent entries, not all 13 entries.
    expect(data.hall).toMatchObject({ total: 13, silent: 11, minN: MIN_N });
    expect(data.hall.topCauseShare).toBeCloseTo(4 / 11);
  });

  it("shows no share below minShareN silent entries even with many entries", async () => {
    for (let i = 0; i < 9; i++) await send({ text: `boję się ${i}` });
    for (let i = 0; i < 5; i++) await send({ text: `mówię wprost ${i}` });
    const data = await (await send({ text: "mówię wprost, ostatni" })).json();
    expect(data.hall).toEqual({ total: 15, silent: 9, topCauseShare: null, minN: MIN_N });
  });

  it("returns 429 after more than 5 entries from one IP in 10 minutes", async () => {
    let t = Date.parse("2026-11-19T10:00:00Z");
    const now = () => new Date(t);
    const at = () => handleWpis(wpis({}, "1.2.3.4"), env, fakeFetch, now);
    for (let i = 0; i < 5; i++) {
      expect((await at()).status).toBe(200);
      t += 60_000;
    }
    const limited = await at();
    expect(limited.status).toBe(429);
    expect((await limited.json()).error).toMatch(/Za dużo/);
    expect((await handleWpis(wpis({}, "5.6.7.8"), env, fakeFetch, now)).status).toBe(200);
    t += 6 * 60_000;
    expect((await at()).status).toBe(200);
  });

  it("limits per browser, so many browsers can share one conference IP", async () => {
    let t = Date.parse("2026-11-19T12:00:00Z");
    const now = () => new Date(t);
    const from = (client) => handleWpis(wpis({ client }, "9.9.9.9"), env, fakeFetch, now);
    for (let i = 0; i < 5; i++) expect((await from("browser-aaaa-0001")).status).toBe(200);
    expect((await from("browser-aaaa-0001")).status).toBe(429);
    // Same IP, other browsers: still allowed.
    for (let i = 0; i < 7; i++) expect((await from(`browser-bbbb-${1000 + i}`)).status).toBe(200);
    const row = rows().find((r) => r.client_hash);
    expect(row.client_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.client_hash).not.toContain("browser");
  });

  it("caps one IP at 60 entries even across browsers", async () => {
    let t = Date.parse("2026-11-19T13:00:00Z");
    const now = () => new Date(t);
    for (let i = 0; i < 60; i++) expect((await handleWpis(wpis({ client: `c-${String(i).padStart(8, "0")}` }, "8.8.8.8"), env, fakeFetch, now)).status).toBe(200);
    expect((await handleWpis(wpis({ client: "c-new-browser" }, "8.8.8.8"), env, fakeFetch, now)).status).toBe(429);
  });

  it("reserves the rate-limit slot atomically, so concurrent requests cannot overshoot", async () => {
    const now = () => new Date("2026-11-19T14:00:00Z");
    // Jev answers slowly, so all requests are in flight before any finishes.
    const slowFetch = async (url, init) => { await new Promise((r) => setTimeout(r, 20)); return fakeFetch(url, init); };
    const results = await Promise.all(Array.from({ length: 9 }, () => handleWpis(wpis({ client: "browser-race-0001" }, "7.7.7.7"), env, slowFetch, now)));
    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 200)).toHaveLength(ROTUNDA.rateLimit);
    expect(statuses.filter((s) => s === 429)).toHaveLength(9 - ROTUNDA.rateLimit);
    expect(calls).toHaveLength(ROTUNDA.rateLimit);
    const reservations = env.DB.raw.prepare("SELECT * FROM wpis_requests").all();
    expect(reservations).toHaveLength(ROTUNDA.rateLimit);
    expect(JSON.stringify(reservations)).not.toMatch(/7\.7\.7\.7|browser-race/);
  });

  it("maps Jev failures to 502 and stores nothing, but the failed call still counts toward the limit", async () => {
    const failing = async () => ({ ok: false, status: 500, text: async () => "boom" });
    const res = await handleWpis(wpis({}, "6.6.6.6"), env, failing);
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain("test");
    expect(rows()).toHaveLength(0);
    for (let i = 0; i < ROTUNDA.rateLimit - 1; i++) await handleWpis(wpis({}, "6.6.6.6"), env, failing);
    expect((await handleWpis(wpis({}, "6.6.6.6"), env, fakeFetch)).status).toBe(429);
  });
});

describe("GET /rotunda/api/stan", () => {
  it("shows the public map without a code", async () => {
    expect((await handleStan(new Request("https://fnp.test/rotunda/api/stan"), env)).status).toBe(200);
  });

  it("publishes only counts below minShareN entries: no share, no breakdown", async () => {
    for (const text of ["boję się", "boję się bardzo", "mówię wprost"]) await send({ rola: "specjalista", text });
    await send({ rola: "zarzad", text: "milczę, bo nic się nie zmieni" });
    const data = await stan();
    expect(Object.keys(data).sort()).toEqual(["byRole", "minN", "overall", "quotes", "silentShare", "total", "updatedAt"]);
    expect(data.minN).toEqual(MIN_N);
    expect(data.total).toBe(4);
    expect(data.silentShare).toBeNull();
    expect(new Date(data.updatedAt).toISOString()).toBe(data.updatedAt);
    expect(data.overall).toEqual({ n: 4, suppressed: true });
    expect(data.byRole).toEqual({
      zarzad: { n: 1, suppressed: true }, menedzer: { n: 0, suppressed: true }, specjalista: { n: 3, suppressed: true },
    });
    expect(data.quotes).toEqual([]);
  });

  it("aggregates from minShareN entries, with areas counted among silent entries", async () => {
    for (let i = 0; i < 4; i++) await send({ rola: "specjalista", text: `boję się ${i}` });
    for (let i = 0; i < 3; i++) await send({ rola: "menedzer", text: `milczę, bo nic się nie zmieni ${i}` });
    for (let i = 0; i < 3; i++) await send({ rola: "zarzad", text: `mówię wprost ${i}` });
    const data = await stan();
    expect(data.total).toBe(10);
    expect(data.silentShare).toBeCloseTo(7 / 10);
    expect(data.overall).toEqual({
      n: 10, silent: 7,
      causes: { lek: 4, bezsens: 3, brak_kanalu: 0, lojalnosc: 0 },
      areas: { rotacja: 0, bledy: 7, wypalenie: 0, innowacje: 0, koordynacja: 0, brak: 0 },
    });
    expect(data.byRole.specjalista).toMatchObject({ n: 4, silent: 4, causes: { lek: 4 } });
    expect(data.byRole.zarzad).toMatchObject({ n: 3, silent: 0 });
    expect(data.byRole.zarzad.suppressed).toBeUndefined();
  });

  it("suppresses a small role group and, by subtraction rule, the smallest shown group too", async () => {
    for (let i = 0; i < 6; i++) await send({ rola: "specjalista", text: `boję się ${i}` });
    for (let i = 0; i < 4; i++) await send({ rola: "menedzer", text: `mówię wprost ${i}` });
    await send({ rola: "zarzad", text: "milczę, bo nic się nie zmieni" });
    const data = await stan();
    expect(data.byRole.zarzad).toEqual({ n: 1, suppressed: true });
    // Otherwise overall minus specjalista minus menedzer would reveal the one zarzad entry.
    expect(data.byRole.menedzer).toEqual({ n: 4, suppressed: true });
    expect(data.byRole.specjalista).toMatchObject({ n: 6, silent: 6 });
    // What can be derived by subtraction covers at least minRoleSize entries.
    expect(data.overall.n - data.byRole.specjalista.n).toBeGreaterThanOrEqual(ROTUNDA.minRoleSize);
  });
});

describe("suppressRoles", () => {
  const min = 3;
  it("hides groups below the minimum and adds the smallest shown group while the remainder is too small", () => {
    expect([...suppressRoles({ zarzad: 1, menedzer: 4, specjalista: 6 }, min)].sort()).toEqual(["menedzer", "zarzad"]);
    expect([...suppressRoles({ zarzad: 2, menedzer: 9, specjalista: 5 }, min)].sort()).toEqual(["specjalista", "zarzad"]);
  });
  it("needs no complement when the suppressed groups together reach the minimum or are empty", () => {
    expect([...suppressRoles({ zarzad: 1, menedzer: 2, specjalista: 8 }, min)].sort()).toEqual(["menedzer", "zarzad"]);
    expect([...suppressRoles({ zarzad: 0, menedzer: 4, specjalista: 6 }, min)]).toEqual(["zarzad"]);
    expect([...suppressRoles({ zarzad: 3, menedzer: 4, specjalista: 6 }, min)]).toEqual([]);
  });
  it("may end with everything hidden, which still leaks nothing below the minimum", () => {
    expect([...suppressRoles({ zarzad: 1, menedzer: 1, specjalista: 0 }, min)].sort()).toEqual(["menedzer", "specjalista", "zarzad"]);
  });
});

describe("/rotunda/api/moderacja", () => {
  it("returns 403 without both codes in the headers", async () => {
    expect((await modGet({ [MOD_HEADERS.code]: "stoisko" })).status).toBe(403);
    expect((await modGet(auth("stoisko", "zly"))).status).toBe(403);
    expect((await modGet(auth("zly", "moderator"))).status).toBe(403);
    expect((await modPost({ id: "x", decision: "approve" }, auth("stoisko", "zly"))).status).toBe(403);
    expect((await handleModeracja(new Request("https://fnp.test/", { headers: auth("stoisko", "") }), { ...env, MOD_CODE: "" })).status).toBe(403);
  });

  it("ignores codes in a POST body and rejects codes in the query string", async () => {
    expect((await modPost({ code: "stoisko", mod: "moderator", id: "x", decision: "approve" }, {})).status).toBe(403);
    for (const q of ["?code=stoisko&mod=moderator", "?mod=moderator", "?kod=stoisko"]) {
      const get = await modGet(auth(), q);
      expect(get.status).toBe(400);
      expect((await get.json()).error).toMatch(/nagłówkach/);
      const post = await handleModeracja(new Request(`https://fnp.test/rotunda/api/moderacja${q}`, {
        method: "POST", headers: auth(), body: JSON.stringify({ id: "x", decision: "approve" }),
      }), env);
      expect(post.status).toBe(400);
    }
    expect((await modGet()).status).toBe(200);
  });

  it("lists pending quotes oldest first, approve puts them on the screen", async () => {
    let t = Date.parse("2026-11-19T10:00:00Z");
    const now = () => new Date((t += 1000));
    const first = await (await handleWpis(wpis({ consent: true, text: "boję się pierwszy" }), env, fakeFetch, now)).json();
    const second = await (await handleWpis(wpis({ consent: true, rola: "zarzad", starter: "szef", text: "boję się drugi" }), env, fakeFetch, now)).json();
    await send({ consent: false, text: "boję się bez zgody" });

    const { pending } = await (await modGet()).json();
    expect(pending.map((p) => p.id)).toEqual([first.id, second.id]);
    expect(pending[1]).toEqual({
      id: second.id, text: "Szef nie wie, że… boję się drugi", rola: "zarzad",
      createdAt: expect.any(String), dane_osobowe: 0.05, obrazliwe: 0.02,
    });

    expect(await (await modPost({ id: second.id, decision: "approve" })).json()).toEqual({ ok: true });
    const data = await stan();
    // Below minShareN every role group is suppressed, so the quote carries no role.
    expect(data.quotes).toEqual([{ id: second.id, text: "Szef nie wie, że… boję się drugi", rola: null, topCause: "lek" }]);
    expect((await (await modGet()).json()).pending.map((p) => p.id)).toEqual([first.id]);
  });

  it("reject deletes the stored text", async () => {
    const { id } = await (await send({ consent: true, text: "boję się tajemnica" })).json();
    expect((await modPost({ id, decision: "reject" })).status).toBe(200);
    const row = rows().find((r) => r.id === id);
    expect(row).toMatchObject({ text: null, quote_status: "rejected" });
    expect(JSON.stringify(rows())).not.toContain("tajemnica");
    expect((await stan()).quotes).toEqual([]);
    expect((await modPost({ id, decision: "approve" })).status).toBe(404);
  });

  it("validates the decision", async () => {
    expect((await modPost({ id: "x", decision: "maybe" })).status).toBe(400);
    expect((await modPost({ decision: "approve" })).status).toBe(400);
    expect((await modPost({ id: "nie-ma", decision: "approve" })).status).toBe(404);
  });

  it("caps quotes at the 12 most recently approved", async () => {
    let t = Date.parse("2026-11-19T10:00:00Z");
    const now = () => new Date((t += 1000));
    const ids = [];
    for (let i = 0; i < 14; i++) {
      const res = await handleWpis(wpis({ consent: true, text: `boję się ${i}` }), env, fakeFetch, now);
      ids.push((await res.json()).id);
    }
    for (const id of ids) await modPost({ id, decision: "approve" }, auth(), now);
    const { quotes } = await stan();
    expect(quotes).toHaveLength(ROTUNDA.maxQuotes);
    expect(quotes[0].id).toBe(ids[13]);
    expect(quotes.map((q) => q.id)).not.toContain(ids[0]);
    // 14 menedzer entries: the group is shown, so the role label is kept.
    expect(quotes[0].rola).toBe("menedzer");
  });

  it("drops the role label of quotes from a suppressed role group", async () => {
    const z = await (await send({ rola: "zarzad", consent: true, text: "boję się zarząd" })).json();
    const m = await (await send({ rola: "menedzer", consent: true, text: "boję się menedżer" })).json();
    for (let i = 0; i < 4; i++) await send({ rola: "menedzer", text: `boję się ${i}` });
    for (let i = 0; i < 6; i++) await send({ rola: "specjalista", text: `boję się s${i}` });
    await modPost({ id: z.id, decision: "approve" });
    await modPost({ id: m.id, decision: "approve" });
    const data = await stan();
    expect(data.byRole.zarzad.suppressed).toBe(true);
    // menedzer (5) is the complement-suppressed group here, so its label goes too.
    expect(data.byRole.menedzer.suppressed).toBe(true);
    expect(data.quotes.map((q) => q.rola)).toEqual([null, null]);
    for (let i = 0; i < 2; i++) await send({ rola: "zarzad", text: `boję się z${i}` });
    const later = await stan();
    expect(later.byRole.zarzad).toMatchObject({ n: 3 });
    expect(later.quotes.map((q) => q.rola).sort()).toEqual(["menedzer", "zarzad"]);
  });
});

describe("rotunda routing", () => {
  it("routes the API by path and method", async () => {
    const e = { ...env, ASSETS: { fetch: async () => new Response("page") } };
    const pass = async () => new Response("calculator");
    const get = (p) => worker.fetch(new Request(`https://fnp.test${p}`), e, null, pass);
    expect((await get("/rotunda/api/stan?code=stoisko")).status).toBe(200);
    expect((await get("/rotunda/api/wpis")).status).toBe(405);
    expect((await get("/rotunda/api/moderacja?code=stoisko&mod=zly")).status).toBe(400);
    expect((await worker.fetch(new Request("https://fnp.test/rotunda/api/moderacja", { headers: auth() }), e, null, pass)).status).toBe(200);
    expect((await get("/rotunda/api/nieznane")).status).toBe(404);
    expect(await (await get("/rotunda/ekran/")).text()).toBe("page");
    expect(await (await get("/rotundaX")).text()).toBe("calculator");
  });
});

const PAGES = ["index.html", "ekran/index.html", "analiza/index.html", "moderacja/index.html"];
const page = (p) => readFileSync(path.join(root, "demo/public/rotunda", p), "utf8");
// „zł” as a word (not inside e.g. „złożone”), PLN, or a number followed by a currency.
const MONEY = [/(^|[^\p{L}])zł([^\p{L}]|$)/iu, /\bPLN\b/, /\d[\d\s\u00a0.,]*\s?(zł|PLN|EUR|€|\$)/u, /złot(y|ych|e|ówek)/iu];

describe("rotunda pages: public wording contract", () => {
  it("never show money, ask for amounts, or pass calculator parameters other than konferencja", () => {
    for (const p of PAGES) {
      const html = page(p);
      for (const re of MONEY) expect(html, `${p} ${re}`).not.toMatch(re);
      expect(html, p).not.toMatch(/type="number"|inputmode="(numeric|decimal)"/);
      for (const [, rest] of html.matchAll(/fnp\.silence-tax\.com(\/[^\s"'`<)]*)?/g)) {
        if (!rest || rest.startsWith("/rotunda")) continue;
        expect(rest, p).toBe("/?konferencja");
      }
    }
  });

  it("Worker responses carry no money", async () => {
    for (let i = 0; i < 11; i++) await send({ consent: true, text: `boję się ${i}` });
    const res = await (await send({ text: "boję się" })).text();
    const map = JSON.stringify(await stan());
    for (const body of [res, map]) for (const re of MONEY) expect(body).not.toMatch(re);
    const sources = ["demo/src/rotunda.js", "demo/src/app.js"].map((f) => readFileSync(path.join(root, f), "utf8"));
    for (const src of sources) {
      expect(src).not.toMatch(/console\./);
      expect(src).not.toContain("—");
    }
  });

  it("every page carries the credit line, the word prototyp, and no em-dash", () => {
    for (const p of PAGES) {
      const html = page(p);
      expect(html, p).toContain("Fundacja Nowe Przestrzenie × Paweł Mamcarz · silnik: Jev (TypeSafe)");
      expect(html, p).toMatch(/prototyp/i);
      expect(html, p).not.toContain("—");
      expect(html, p).not.toMatch(/Kalkulator skali kosztów/);
      expect(html, p).toContain('name="robots" content="noindex"');
    }
  });

  it("phone page states what the numbers are, not what the room or person is", () => {
    const html = page("index.html");
    for (const banned of ["Głos usłyszany", "dotarł do adresata", "sali (n", "odpowiada <b>", "niepociągnięcie", "jedno pociągnięcie", "Policz skalę", "Jev: milczenie"]) {
      expect(html).not.toContain(banned);
    }
    expect(html).toContain("Zdanie opisuje przemilczenie");
    expect(html).toContain("Zdanie nie opisuje przemilczenia");
    expect(html).toContain("pewności, że zdanie opisuje przemilczenie");
    expect(html).toContain("wpisów opisujących przemilczenie (n = ${silentN})");
    expect(html).toContain("Analogia, nie miara");
    expect(html).toContain("BBC News, „The triumph of lean production”, luty 2007");
    expect(html).toContain("Kalkulator nie korzysta z wyniku tej gry.");
    expect(html).toContain("Otwórz Kalkulator Rezyliencji FNP");
    expect(html).toContain("także bez zgody na cytat");
    expect(html).toContain("skrót adresu IP i identyfikatora przeglądarki");
    expect(html).toContain("dopóki organizator ich nie usunie");
    // „anonimowo” only for what appears on the screen.
    for (const m of html.matchAll(/anonim\w*/g)) expect(html.slice(m.index, m.index + 40)).toMatch(/na ekranie/);
  });

  it("big screen reads thresholds from the API and labels shares by their denominator", () => {
    const html = page("ekran/index.html");
    expect(html).not.toMatch(/MIN_N\s*=|minRole\s*=\s*\d|share\s*:\s*\d/);
    expect(html).toContain("d.minN");
    for (const banned of ["to milczenie", "milczy ta sala", "Dlaczego milczymy", "Cała sala", "wpisów sali", "Głos z sali", "anonimowo,", "Anonimowe wpisy", "Anonimowa mapa"]) {
      expect(html).not.toContain(banned);
    }
    expect(html).toContain("słupki nie sumują się do 100%");
    expect(html).toContain("overall.silent");
    expect(html).toContain("Kalkulator Rezyliencji FNP");
    expect(html).toContain(">Gra<");
    expect(html).toContain(">Kalkulator<");
  });

  it("moderator page sends codes only in headers", () => {
    const html = page("moderacja/index.html");
    expect(html).toContain(MOD_HEADERS.code);
    expect(html).toContain(MOD_HEADERS.mod);
    expect(html).not.toMatch(/\?code=|code: kod/);
    expect(html).toContain("history.replaceState");
  });
});
