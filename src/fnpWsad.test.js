import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeFnpAnalysis } from "./fnpModel.js";
import {
  STATUS_BELOW_N, STATUS_OK, computeRow, mapScore, parseArgs, sha256, validateRows,
} from "../scripts/fnp-wsad.lib.js";
import { main } from "../scripts/fnp-wsad.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = readFileSync(path.join(root, ".version"), "utf8").trim();
const HEADER = "firma,pomiar,klimat,n,fte,placa_roczna,rotacja_proc,przychod";

function capture() {
  const chunks = [];
  return { write: (s) => chunks.push(s), text: () => chunks.join("") };
}

// Writes a CSV into a fresh temp dir and runs the CLI there.
async function run(csv, args = []) {
  const dir = mkdtempSync(path.join(tmpdir(), "fnp-wsad-"));
  writeFileSync(path.join(dir, "in.csv"), csv);
  const stdout = capture();
  const stderr = capture();
  const code = await main({ argv: ["in.csv", ...args], cwd: dir, stdout, stderr });
  return { code, out: stdout.text(), err: stderr.text(), dir };
}

const parseOut = (csv) => {
  const [head, ...lines] = csv.trim().split("\n");
  const cols = head.split(",");
  return lines.map((l) => Object.fromEntries(l.split(",").map((v, i) => [cols[i], v])));
};

describe("FNP batch (wsad)", () => {
  it("matches computeFnpAnalysis for the default firm", async () => {
    const { rows, errors } = validateRows(`${HEADER}\nfirma_001,2026-10,41,40,500,90000,16,100000000\n`);
    expect(errors).toEqual([]);
    const row = computeRow(rows[0]);
    const direct = computeFnpAnalysis({
      employees: 500, avgSalary: 90_000, turnoverPct: 16, safety: 41, revenue: 100_000_000,
      scopeMode: "conservative", safetySource: "survey",
    });
    expect(row.total).toBe(direct.costs.totalTax);
    expect(row.p10).toBe(direct.mc.p10);
    expect(row.p90).toBe(direct.mc.p90);
    expect(row.errors + row.turnover + row.burnout).toBeCloseTo(direct.costs.totalTax, 6);
    // Same amount as the calculator's default "estimate" source.
    expect(computeFnpAnalysis({ ...row.params, safetySource: "estimate" }).costs.totalTax).toBe(row.total);
    const { out, code } = await run(`${HEADER}\nfirma_001,2026-10,41,40,500,90000,16,100000000\n`);
    expect(code).toBe(0);
    const [r] = parseOut(out);
    expect(r.kwota_zl).toBe("3116935");
    expect(r.proc_przychodu).toBe("3.12");
    expect(r.status).toBe(STATUS_OK);
    expect(r.rotacja_zrodlo).toBe("deklaracja");
    expect(r.wersja).toBe(version);
  });

  it("maps Likert scales to 0–100 including endpoints", () => {
    expect(mapScore(1, "likert7")).toBe(0);
    expect(mapScore(7, "likert7")).toBe(100);
    expect(mapScore(4, "likert7")).toBe(50);
    expect(mapScore(1, "likert5")).toBe(0);
    expect(mapScore(5, "likert5")).toBe(100);
    expect(mapScore(3, "likert5")).toBe(50);
    expect(mapScore(0, "procent")).toBe(0);
    expect(mapScore(100, "procent")).toBe(100);
  });

  it("rejects out-of-range scores and unknown scales", async () => {
    expect(() => mapScore(9, "likert7")).toThrow(/poza zakresem/);
    expect(() => mapScore(0.5, "likert5")).toThrow(/poza zakresem/);
    expect(() => mapScore(101, "procent")).toThrow(/poza zakresem/);
    expect(() => mapScore(50, "stopnie")).toThrow(/Nieznana skala/);
    expect(parseArgs(["a.csv", "--skala", "stopnie"]).errors[0]).toMatch(/Nieznana skala/);
    const res = await run(`${HEADER}\nfirma_001,,9,40,500,90000,16,\n`, ["--skala", "likert7"]);
    expect(res.code).toBe(1);
    expect(res.err).toMatch(/poza zakresem skali likert7/);
    expect((await run(`${HEADER}\nfirma_001,,4,40,500,90000,16,\n`, ["--skala", "stopnie"])).code).toBe(1);
  });

  it("keeps rows below the respondent threshold with empty money", async () => {
    const { code, out } = await run(`${HEADER}\nfirma_001,,41,14,500,90000,16,100000000\nfirma_002,,41,15,500,90000,16,100000000\n`);
    expect(code).toBe(0);
    const [low, ok] = parseOut(out);
    expect(low.status).toBe(STATUS_BELOW_N);
    for (const col of ["kwota_zl", "proc_przychodu", "p10_zl", "p90_zl", "bledy_zl", "rotacja_zl", "wypalenie_zl"]) expect(low[col]).toBe("");
    expect(ok.status).toBe(STATUS_OK);
    const custom = parseOut((await run(`${HEADER}\nfirma_001,,41,14,500,90000,16,\n`, ["--min-n", "10"])).out);
    expect(custom[0].status).toBe(STATUS_OK);
  });

  it("fails closed: one bad row means exit 1, every error listed, nothing written", async () => {
    const csv = `${HEADER}\nfirma_001,,41,40,500,90000,16,\nfirma_002,,41,40,0,90000,16,\nfirma_003,,abc,40,500,,16,\n`;
    const res = await run(csv, ["--out", "wynik.csv"]);
    expect(res.code).toBe(1);
    expect(res.out).toBe("");
    expect(res.err).toMatch(/Nic nie zapisano/);
    expect(res.err).toMatch(/Linia 3 \(firma_002\): fte/);
    expect(res.err).toMatch(/Linia 4 \(firma_003\): klimat.*placa_roczna/);
    expect(existsSync(path.join(res.dir, "wynik.csv"))).toBe(false);
    expect(existsSync(path.join(res.dir, "wynik.csv.sha256"))).toBe(false);
    const missing = await run("firma,klimat,n,fte\nfirma_001,41,40,500\n");
    expect(missing.code).toBe(1);
    expect(missing.err).toMatch(/Brak wymaganej kolumny: placa_roczna/);
  });

  it("is deterministic and prints the SHA-256 of the exact bytes", async () => {
    const csv = readFileSync(path.join(root, "docs/wsad-przyklad.csv"), "utf8");
    const a = await run(csv);
    const b = await run(csv);
    expect(a.code).toBe(0);
    expect(a.out).toBe(b.out);
    expect(a.err).toContain(`SHA-256: ${sha256(a.out)}`);
    expect(b.err).toContain(`SHA-256: ${sha256(a.out)}`);
    expect(a.err).toMatch(/Pominięte nieznane kolumny: uwagi/);
    const c = await run(csv, ["--out", "wynik.csv"]);
    expect(c.out).toBe("");
    expect(readFileSync(path.join(c.dir, "wynik.csv"), "utf8")).toBe(a.out);
    expect(readFileSync(path.join(c.dir, "wynik.csv.sha256"), "utf8")).toBe(`${sha256(a.out)}  wynik.csv\n`);
  });

  it("prints a genuine zero amount as 0", async () => {
    const [r] = parseOut((await run(`${HEADER}\nfirma_001,,100,40,500,90000,16,100000000\n`)).out);
    expect(r.status).toBe(STATUS_OK);
    for (const col of ["kwota_zl", "p10_zl", "p90_zl", "bledy_zl", "rotacja_zl", "wypalenie_zl"]) expect(r[col]).toBe("0");
    expect(r.proc_przychodu).toBe("0.00");
  });

  it("reads ; files with decimal commas, quoted fields and a BOM", async () => {
    const csv = "\uFEFFfirma;pomiar;klimat;n;fte;placa_roczna;rotacja_proc;przychod\r\n\"firma;001\";2026-10;4,5;40;12,5;90000;16,0;1000000\r\n\r\n";
    const res = await run(csv, ["--skala", "likert7"]);
    expect(res.code).toBe(0);
    expect(res.out.split("\n")[1]).toMatch(/^"firma;001",2026-10,58\.3,40,12\.5,ok,/);
    const commaFile = await run(`${HEADER}\nfirma_001,,"41,5",40,500,90000,16,\n`);
    expect(commaFile.code).toBe(1);
    expect(commaFile.err).toMatch(/przecinek dziesiętny tylko/);
  });

  it("leaves the percent empty without revenue and keeps the amounts", async () => {
    const out = parseOut((await run(`${HEADER}\nfirma_001,a,41,40,500,90000,16,100000000\nfirma_001,b,41,40,500,90000,16,\n`)).out);
    expect(out[1].proc_przychodu).toBe("");
    for (const col of ["kwota_zl", "p10_zl", "p90_zl", "bledy_zl", "rotacja_zl", "wypalenie_zl"]) expect(out[1][col]).toBe(out[0][col]);
  });

  it("treats missing declared turnover as the 14.8% reference rate", async () => {
    const out = parseOut((await run(`${HEADER}\nfirma_001,,41,40,500,90000,,100000000\nfirma_002,,41,40,500,90000,14.8,100000000\n`)).out);
    expect(out[0].rotacja_zrodlo).toBe("odniesienie");
    expect(out[1].rotacja_zrodlo).toBe("deklaracja");
    const direct = computeFnpAnalysis({ employees: 500, avgSalary: 90_000, safety: 41, revenue: 100_000_000, safetySource: "survey" });
    expect(out[0].kwota_zl).toBe(String(Math.round(direct.costs.totalTax)));
    for (const col of ["kwota_zl", "p10_zl", "p90_zl", "bledy_zl", "rotacja_zl", "wypalenie_zl"]) expect(out[0][col]).toBe(out[1][col]);
  });

  it("compares two measurements and lists skipped firms with a reason", async () => {
    const res = await run(readFileSync(path.join(root, "docs/wsad-przyklad.csv"), "utf8"), ["--porownaj"]);
    expect(res.code).toBe(0);
    const rows = parseOut(res.out);
    expect(rows.map((r) => r.firma)).toEqual(["firma_001", "firma_003"]);
    const f1 = rows[0];
    expect([f1.pomiar_przed, f1.pomiar_po]).toEqual(["2026-10", "2027-10"]);
    expect(Number(f1.kwota_zmiana_zl)).toBe(Number(f1.kwota_po_zl) - Number(f1.kwota_przed_zl));
    expect(f1.klimat_zmiana).toBe("11.0");
    expect(res.err).toMatch(/pominięta firma_002: .*poniżej progu/);
    expect(res.err).toMatch(/pominięta firma_004: 1 pomiar/);
    expect(res.err).toMatch(/nie dowód efektu programu/);
    const noCol = await run("firma,klimat,n,fte,placa_roczna\nfirma_001,41,40,500,90000\n", ["--porownaj"]);
    expect(noCol.code).toBe(1);
    expect(noCol.err).toMatch(/wymaga kolumny pomiar/);
  });

  it("uses no em-dash and no forbidden claims in user-facing text", () => {
    for (const f of ["scripts/fnp-wsad.js", "scripts/fnp-wsad.lib.js", "docs/WSAD.md", "docs/wsad-przyklad.csv"]) {
      const text = readFileSync(path.join(root, f), "utf8");
      expect(text).not.toContain(String.fromCharCode(0x2014));
      expect(text).not.toMatch(/\bROI\b|prognoz/i);
    }
  });

  it("stays out of the public bundle", () => {
    const files = readdirSync(path.join(root, "src"), { recursive: true }).filter((f) => /\.(js|jsx)$/.test(f) && !f.endsWith(".test.js"));
    for (const f of files) expect(readFileSync(path.join(root, "src", f), "utf8")).not.toContain("fnp-wsad");
  });
});
