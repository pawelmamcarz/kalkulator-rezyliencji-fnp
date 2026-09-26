import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AREAS, CAUSES, aggregate, buildRequest, formatMarkdown, questions, validateResponses } from "../scripts/jev-diagnoza.lib.js";
import { main } from "../scripts/jev-diagnoza.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sample = JSON.parse(readFileSync(path.join(root, "docs/diagnoza-przyklad.json"), "utf8"));

// Keyword stub standing in for Jev, so tests need no key and no network.
function fakeAnswers(text) {
  const t = text.toLowerCase();
  const silent = /nie mówi|nie zgłasza|odpuści|kiwa|nie wychylam|kryjemy|nie wiem, komu|nie zgłosiłem|lepiej nie|tylko dobre/.test(t);
  const causes = {
    lek: /winnego|kary|afera|głupie/.test(t),
    bezsens: /nic się nie zmieni|odpuści/.test(t),
    brak_kanalu: /nie ma kiedy|komu zgłosić|szkoda czasu/.test(t),
    lojalnosc: /kryjemy|kolega/.test(t),
  };
  return {
    milczenie: { type: "noul", noul: silent ? 0.9 : 0.1 },
    obszar: { type: "choice", choice: /błęd|etykiet|luki|crm/.test(t) ? "bledy" : /pomysł/.test(t) ? "innowacje" : silent ? "koordynacja" : "brak", confidence: 0.8 },
    ...Object.fromEntries(Object.entries(causes).map(([id, on]) => [`przyczyna_${id}`, { type: "noul", noul: on ? 0.85 : 0.1 }])),
    nasilenie: { type: "score", score: silent ? 2.2 : 0.3, confidence: 0.7 },
  };
}

const fakeFetch = async (_url, init) => {
  const { state } = JSON.parse(init.body);
  return { ok: true, status: 200, text: async () => JSON.stringify({ answers: fakeAnswers(state.odpowiedz) }) };
};

function capture() {
  const chunks = [];
  return { write: (s) => chunks.push(s), text: () => chunks.join("") };
}

describe("Jev diagnosis prototype", () => {
  it("asks valid Choice, Noul and Score questions over the answer text only", () => {
    for (const q of Object.values(questions)) expect(["noul", "choice", "score"]).toContain(q.type);
    expect(questions.nasilenie.criteria).toHaveLength(4);
    expect(Object.keys(questions.obszar.criteria)).toEqual(Object.keys(AREAS));
    const request = buildRequest(sample[0], "jev-1.13.0");
    expect(request.state).toEqual({ odpowiedz: sample[0].text });
    expect(Object.keys(request.questions)).toHaveLength(3 + Object.keys(CAUSES).length);
  });

  it("uses the five FNP area labels", () => {
    const labels = Object.values(AREAS).join(" ");
    for (const label of ["Rotacja i utrata wiedzy", "Błędy i compliance", "Wypalenie i pasywność", "Innowacje i uczenie się", "Koordynacja i hierarchia"]) {
      expect(labels).toContain(label);
    }
  });

  it("validates input rows", () => {
    expect(validateResponses(sample)).toEqual([]);
    expect(validateResponses([{ team: "A" }])).toHaveLength(1);
    expect(validateResponses([])).toHaveLength(1);
  });

  it("hides teams below the anonymity threshold", () => {
    const teams = aggregate(sample, sample.map((r) => fakeAnswers(r.text)));
    const board = teams.find((t) => t.team === "Zarząd");
    expect(board).toEqual({ team: "Zarząd", n: 2, suppressed: true });
    expect(board).not.toHaveProperty("silenceShare");
  });

  it("aggregates silence, areas and causes per team in code", () => {
    const teams = aggregate(sample, sample.map((r) => fakeAnswers(r.text)));
    const warehouse = teams.find((t) => t.team === "Magazyn");
    const it = teams.find((t) => t.team === "IT");
    expect(warehouse.silenceShare).toBeGreaterThan(it.silenceShare);
    expect(warehouse.severity).toBeGreaterThan(it.severity);
    expect(warehouse.causes.lek).toBeLessThanOrEqual(warehouse.silent);
    expect(it.causes.lojalnosc).toBe(1);
    expect(Object.values(warehouse.areas).reduce((a, b) => a + b, 0)).toBe(Math.round(warehouse.silenceShare * warehouse.n));
  });

  it("frames the report as a signal, not a measurement or money", () => {
    const md = formatMarkdown(aggregate(sample, sample.map((r) => fakeAnswers(r.text))));
    expect(md).toContain("nie pomiar");
    expect(md).not.toMatch(/\bzł\b|PLN|ROI|—/);
    expect(md).toContain("ukryte (n < 5)");
  });

  it("runs end to end with a stubbed API and needs a key otherwise", async () => {
    const out = capture();
    const code = await main({ argv: ["docs/diagnoza-przyklad.json"], env: { TYPESAFE_API_KEY: "test" }, cwd: root, stdout: out, stderr: capture(), fetchImpl: fakeFetch });
    expect(code).toBe(0);
    expect(out.text()).toContain("| Magazyn | 6 |");
    expect(out.text()).not.toContain("tylko dla analityka");
    const detailed = capture();
    await main({ argv: ["docs/diagnoza-przyklad.json", "--szczegoly"], env: { TYPESAFE_API_KEY: "test" }, cwd: root, stdout: detailed, stderr: capture(), fetchImpl: fakeFetch });
    expect(detailed.text()).toContain("tylko dla analityka");
    expect(detailed.text().match(/^\| (Magazyn|Sprzedaż|IT|Zarząd|Dział produkcji|Dział zakupów|Dział HR) \| [^|]+ \| \d,\d\d/gm)).toHaveLength(sample.length);
    const err = capture();
    expect(await main({ argv: ["docs/diagnoza-przyklad.json"], env: {}, cwd: root, stdout: capture(), stderr: err })).toBe(1);
    expect(err.text()).toContain("TYPESAFE_API_KEY");
  });

  it("stays out of the public bundle", () => {
    const files = readdirSync(path.join(root, "src"), { recursive: true }).filter((f) => /\.(js|jsx)$/.test(f) && !f.endsWith(".test.js"));
    for (const f of files) expect(readFileSync(path.join(root, "src", f), "utf8")).not.toContain("jev-diagnoza");
  });
});
