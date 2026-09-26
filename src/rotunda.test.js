import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import worker from "../demo/src/worker.js";
import {
  CAUSE_LABELS, ROLES, ROTUNDA, STARTERS, handleModeracja, handleStan, handleWpis, validateWpis,
} from "../demo/src/rotunda.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migration = readFileSync(path.join(root, "demo/migrations/0001_wpisy.sql"), "utf8");

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
const modGet = (q = "code=stoisko&mod=moderator") => handleModeracja(new Request(`https://fnp.test/rotunda/api/moderacja?${q}`), env);
const modPost = (body) => handleModeracja(new Request("https://fnp.test/rotunda/api/moderacja", {
  method: "POST", body: JSON.stringify({ code: "stoisko", mod: "moderator", ...body }),
}), env);
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
  it("rejects a wrong or missing code before Jev and the database", async () => {
    expect((await send({ code: "zly" })).status).toBe(403);
    expect((await send({ code: undefined })).status).toBe(403);
    expect((await handleWpis(wpis({}), { ...env, DEMO_CODE: "" }, fakeFetch)).status).toBe(403);
    expect(calls).toHaveLength(0);
    expect(rows()).toHaveLength(0);
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
    expect(data.hall).toEqual({ total: 1, topCauseShare: 1 });
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
    expect(data.hall).toEqual({ total: 1, topCauseShare: null });
  });

  it("computes topCauseShare among silent entries after insert", async () => {
    await send({ text: "boję się" });
    await send({ text: "milczę, bo nic się nie zmieni" });
    await send({ text: "mówię wprost" });
    const data = await (await send({ text: "milczę, bo nic się nie zmieni, serio" })).json();
    expect(data.judgment.topCause).toBe("bezsens");
    expect(data.hall.total).toBe(4);
    expect(data.hall.topCauseShare).toBeCloseTo(2 / 3);
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

  it("maps Jev failures to 502 and stores nothing", async () => {
    const failing = async () => ({ ok: false, status: 500, text: async () => "boom" });
    const res = await handleWpis(wpis({}), env, failing);
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain("test");
    expect(rows()).toHaveLength(0);
  });
});

describe("GET /rotunda/api/stan", () => {
  it("requires the code", async () => {
    expect((await handleStan(new Request("https://fnp.test/rotunda/api/stan?code=zly"), env)).status).toBe(403);
    expect((await handleStan(new Request("https://fnp.test/rotunda/api/stan"), env)).status).toBe(403);
  });

  it("aggregates the room and suppresses role groups with n < 3", async () => {
    for (const text of ["boję się", "boję się bardzo", "mówię wprost"]) await send({ rola: "specjalista", text });
    await send({ rola: "zarzad", text: "milczę, bo nic się nie zmieni" });
    const data = await stan();
    expect(Object.keys(data).sort()).toEqual(["byRole", "overall", "quotes", "silentShare", "total", "updatedAt"]);
    expect(data.total).toBe(4);
    expect(data.silentShare).toBeCloseTo(3 / 4);
    expect(new Date(data.updatedAt).toISOString()).toBe(data.updatedAt);
    expect(data.overall).toEqual({
      n: 4, silent: 3,
      causes: { lek: 2, bezsens: 1, brak_kanalu: 0, lojalnosc: 0 },
      areas: { rotacja: 0, bledy: 3, wypalenie: 0, innowacje: 0, koordynacja: 0, brak: 0 },
    });
    expect(data.byRole.specjalista).toMatchObject({ n: 3, silent: 2, causes: { lek: 2 } });
    expect(data.byRole.zarzad).toEqual({ n: 1, suppressed: true });
    expect(data.byRole.menedzer).toEqual({ n: 0, suppressed: true });
    expect(data.quotes).toEqual([]);
  });
});

describe("/rotunda/api/moderacja", () => {
  it("returns 403 without the moderator code", async () => {
    expect((await modGet("code=stoisko")).status).toBe(403);
    expect((await modGet("code=stoisko&mod=zly")).status).toBe(403);
    expect((await modGet("code=zly&mod=moderator")).status).toBe(403);
    expect((await modPost({ mod: "zly", id: "x", decision: "approve" })).status).toBe(403);
    expect((await handleModeracja(new Request("https://fnp.test/?code=stoisko&mod="), { ...env, MOD_CODE: "" })).status).toBe(403);
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
      id: second.id, text: "Nie powiedziałem/am szefowi, że… boję się drugi", rola: "zarzad",
      createdAt: expect.any(String), dane_osobowe: 0.05, obrazliwe: 0.02,
    });

    expect(await (await modPost({ id: second.id, decision: "approve" })).json()).toEqual({ ok: true });
    const data = await stan();
    expect(data.quotes).toEqual([{ id: second.id, text: "Nie powiedziałem/am szefowi, że… boję się drugi", rola: "zarzad", topCause: "lek" }]);
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
    for (const id of ids) {
      await handleModeracja(new Request("https://fnp.test/", {
        method: "POST", body: JSON.stringify({ code: "stoisko", mod: "moderator", id, decision: "approve" }),
      }), env, now);
    }
    const { quotes } = await stan();
    expect(quotes).toHaveLength(ROTUNDA.maxQuotes);
    expect(quotes[0].id).toBe(ids[13]);
    expect(quotes.map((q) => q.id)).not.toContain(ids[0]);
  });
});

describe("rotunda routing", () => {
  it("routes the API by path and method", async () => {
    const e = { ...env, ASSETS: { fetch: async () => new Response("page") } };
    const pass = async () => new Response("calculator");
    const get = (p) => worker.fetch(new Request(`https://fnp.test${p}`), e, null, pass);
    expect((await get("/rotunda/api/stan?code=stoisko")).status).toBe(200);
    expect((await get("/rotunda/api/wpis")).status).toBe(405);
    expect((await get("/rotunda/api/moderacja?code=stoisko&mod=zly")).status).toBe(403);
    expect((await get("/rotunda/api/nieznane")).status).toBe(404);
    expect(await (await get("/rotunda/ekran/")).text()).toBe("page");
    expect(await (await get("/rotundaX")).text()).toBe("calculator");
  });
});
