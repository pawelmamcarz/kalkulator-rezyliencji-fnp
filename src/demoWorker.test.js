import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import worker from "../demo/src/worker.js";
import { LIMITS, handleMapa, validateDemoInput } from "../demo/src/app.js";
import { MIN_TEAM_SIZE } from "../scripts/jev-diagnoza.lib.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "demo/migrations");
const migration = readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort()
  .map((file) => readFileSync(path.join(migrationsDir, file), "utf8")).join("\n");
function fakeD1() {
  const db = new DatabaseSync(":memory:");
  db.exec(migration);
  const stmt = (sql, args = []) => ({
    bind: (...next) => stmt(sql, next),
    run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } }),
  });
  return { prepare: (sql) => stmt(sql) };
}
let env;
beforeEach(() => {
  env = { DEMO_CODE: "stoisko", TYPESAFE_API_KEY: "test", DB: fakeD1() };
});

const answer = (silent) => ({
  milczenie: { type: "noul", noul: silent ? 0.9 : 0.1 },
  obszar: { type: "choice", choice: "bledy", confidence: 0.9 },
  przyczyna_lek: { type: "noul", noul: silent ? 0.8 : 0.1 },
  przyczyna_bezsens: { type: "noul", noul: 0.1 },
  przyczyna_brak_kanalu: { type: "noul", noul: 0.1 },
  przyczyna_lojalnosc: { type: "noul", noul: 0.1 },
  nasilenie: { type: "score", score: silent ? 2.5 : 0.2, confidence: 0.8 },
});

const calls = [];
const fakeFetch = async (_url, init) => {
  const { state } = JSON.parse(init.body);
  calls.push(state.odpowiedz);
  return { ok: true, status: 200, text: async () => JSON.stringify({ answers: answer(/milcz/.test(state.odpowiedz)) }) };
};

const post = (body) => new Request("https://demo.test/api/mapa", { method: "POST", body: JSON.stringify(body) });
const rows = [
  { team: "A", text: "milczymy o błędach" },
  { team: "A", text: "milczę, bo kara" },
  { team: "A", text: "mówimy otwarcie" },
  { team: "A", text: "milczymy przy szefie" },
  { team: "A", text: "mówimy na retro" },
  { team: "B", text: "milczymy" },
];

describe("conference demo worker", () => {
  it("allows the public heatmap without a code but requires server configuration", async () => {
    calls.length = 0;
    expect((await handleMapa(post({ answers: rows }), env, fakeFetch)).status).toBe(200);
    expect(calls).toHaveLength(rows.length);
    expect((await handleMapa(post({ answers: rows }), { ...env, DEMO_CODE: "" }, fakeFetch)).status).toBe(503);
    expect(calls).toHaveLength(rows.length);
  });

  it("limits public bulk analyses before calling Jev", async () => {
    calls.length = 0;
    for (let i = 0; i < LIMITS.maxBatches; i++) {
      expect((await handleMapa(post({ answers: rows }), env, fakeFetch)).status).toBe(200);
    }
    expect((await handleMapa(post({ answers: rows }), env, fakeFetch)).status).toBe(429);
    expect(calls).toHaveLength(rows.length * LIMITS.maxBatches);
  });

  it("uses the project-wide team threshold and keeps the Jev-call ceiling per IP bounded", () => {
    expect(MIN_TEAM_SIZE).toBe(5);
    expect(LIMITS.minTeamSize).toBe(MIN_TEAM_SIZE);
    // Before: 20 answers × 3 analyses = 60 Jev calls per IP per 10 min. Now 25 × 3 = 75.
    expect(LIMITS.maxAnswers * LIMITS.maxBatches).toBe(75);
    expect(LIMITS.rateWindowMs).toBe(10 * 60 * 1000);
  });

  it("enforces input limits", () => {
    expect(validateDemoInput({ answers: rows })).toBeNull();
    expect(validateDemoInput({ answers: [] })).toMatch(/zespołu/);
    expect(validateDemoInput({ answers: Array(LIMITS.maxAnswers + 1).fill(rows[0]) })).toMatch(/Maksymalnie/);
    expect(validateDemoInput({ answers: [{ team: "A", text: "x".repeat(LIMITS.maxText + 1) }] })).toMatch(/znaków/);
    expect(validateDemoInput({ answers: [{ team: " ", text: "ok" }] })).toMatch(/zespołu/);
  });

  it("returns per-team aggregates and per-answer judgments", async () => {
    const res = await handleMapa(post({ code: "stoisko", answers: rows }), env, fakeFetch);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.answers).toHaveLength(rows.length);
    const a = data.teams.find((t) => t.team === "A");
    expect(a).toMatchObject({ n: 5, silent: 3, suppressed: false });
    expect(a.causes.lek).toBe(3);
    expect(data.minTeamSize).toBe(5);
    expect(data.teams.find((t) => t.team === "B")).toEqual({ team: "B", n: 1, suppressed: true });
    // Per-answer judgments of a suppressed team are withheld too.
    expect(data.answers.slice(0, 5).every(Boolean)).toBe(true);
    expect(data.answers[5]).toBeNull();
    expect(JSON.stringify(data)).not.toContain("milczymy o błędach");
  });

  it("maps upstream failures to 502 without leaking the key", async () => {
    const failing = async () => ({ ok: false, status: 500, text: async () => "boom" });
    const res = await handleMapa(post({ code: "stoisko", answers: rows }), env, failing);
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain("test");
  });

  it("serves /rotunda/, redirects /rotunda and passes other paths to the calculator", async () => {
    const e = { ...env, ASSETS: { fetch: async () => new Response("page") } };
    const pass = async () => new Response("calculator");
    expect(await (await worker.fetch(new Request("https://fnp.test/rotunda/"), e, null, pass)).text()).toBe("page");
    const redirect = await worker.fetch(new Request("https://fnp.test/rotunda?kod=x"), e, null, pass);
    expect(redirect.status).toBe(301);
    expect(redirect.headers.get("Location")).toBe("https://fnp.test/rotunda/?kod=x");
    expect(await (await worker.fetch(new Request("https://fnp.test/rotundaX"), e, null, pass)).text()).toBe("calculator");
    expect((await worker.fetch(new Request("https://fnp.test/rotunda/api/mapa"), e, null, pass)).status).toBe(405);
  });

  it("analiza page warns it is an unvalidated demonstration and sends text to TypeSafe", () => {
    const html = readFileSync(path.join(root, "demo/public/rotunda/analiza/index.html"), "utf8");
    expect(html).toContain("Prototyp, niezwalidowany");
    expect(html).toContain("nie jest pomiarem zespołu");
    expect(html).toContain("Nie wklejaj prawdziwych odpowiedzi");
    expect(html).toContain("TypeSafe");
    expect(html).toContain(`mniej niż ${MIN_TEAM_SIZE} odpowiedziami`);
    expect(html).toContain(`Do ${LIMITS.maxAnswers} odpowiedzi`);
    expect(html).toContain(`const MAX_ANSWERS = ${LIMITS.maxAnswers};`);
    expect(html).toContain("(orientacyjnie)");
    expect(html).not.toContain("<th>Nasilenie");
    expect(html).toContain('<a href="https://fnp.silence-tax.com/?konferencja">Kalkulator Rezyliencji FNP</a>');
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).not.toMatch(/—|\bROI\b/);
  });

  it("built-in sample: most teams reach the threshold, one is deliberately below it", () => {
    const html = readFileSync(path.join(root, "demo/public/rotunda/analiza/index.html"), "utf8");
    const sample = html.match(/const SAMPLE = `([^`]*)`/)[1].split("\n").filter(Boolean);
    expect(sample.length).toBeLessThanOrEqual(LIMITS.maxAnswers);
    const sizes = {};
    for (const line of sample) {
      const team = line.slice(0, line.indexOf("|")).trim();
      sizes[team] = (sizes[team] || 0) + 1;
    }
    const counts = Object.values(sizes);
    expect(counts.filter((n) => n >= MIN_TEAM_SIZE).length).toBeGreaterThan(counts.length / 2);
    expect(counts.filter((n) => n < MIN_TEAM_SIZE)).toHaveLength(1);
  });
});

describe("demo worker entry", () => {
  it("exports only the default handler (workerd rejects other named exports)", async () => {
    const mod = await import("../demo/src/worker.js");
    expect(Object.keys(mod)).toEqual(["default"]);
  });
});
