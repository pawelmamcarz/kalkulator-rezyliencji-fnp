import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker, { LIMITS, handleMapa, validateDemoInput } from "../demo/src/worker.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { DEMO_CODE: "stoisko", TYPESAFE_API_KEY: "test" };

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
  { team: "B", text: "milczymy" },
];

describe("conference demo worker", () => {
  it("rejects a wrong or missing access code before calling Jev", async () => {
    calls.length = 0;
    expect((await handleMapa(post({ code: "zly", answers: rows }), env, fakeFetch)).status).toBe(403);
    expect((await handleMapa(post({ answers: rows }), env, fakeFetch)).status).toBe(403);
    expect((await handleMapa(post({ code: "stoisko", answers: rows }), { ...env, DEMO_CODE: "" }, fakeFetch)).status).toBe(403);
    expect(calls).toHaveLength(0);
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
    expect(a).toMatchObject({ n: 3, silent: 2, suppressed: false });
    expect(a.causes.lek).toBe(2);
    expect(data.teams.find((t) => t.team === "B")).toEqual({ team: "B", n: 1, suppressed: true });
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

  it("page warns it is an unvalidated prototype and sends text to TypeSafe", () => {
    const html = readFileSync(path.join(root, "demo/public/rotunda/index.html"), "utf8");
    expect(html).toContain("Prototyp, niezwalidowany");
    expect(html).toContain("nie pomiar");
    expect(html).toContain("TypeSafe");
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).not.toMatch(/—|\bROI\b/);
  });
});
