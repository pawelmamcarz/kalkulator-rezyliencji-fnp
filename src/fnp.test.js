import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeFullModelAnalysis, PL_AVG_SAFETY } from "./logic.js";
import { CHANNEL_COPY, splitChannel } from "./channels.js";
import { FNP_PROBLEM_DIST, fnpAnalysisParams } from "./fnpModel.js";

const srcDir = path.dirname(fileURLToPath(import.meta.url));
const sectionsDir = path.join(srcDir, "sections");
const readSection = (name) => readFileSync(path.join(sectionsDir, name), "utf8");

const FNP_DEFAULTS = fnpAnalysisParams({
  revenue: 100_000_000,
  costs: 92_000_000,
  employees: 500,
  avgSalary: 90_000,
  turnoverPct: 16,
  safety: PL_AVG_SAFETY,
  safetySource: "estimate",
  scopeMode: "conservative",
});

describe("FNP public calculator contract", () => {
  it("exposes five reporting channels with FNP narrative labels", () => {
    expect(Object.keys(CHANNEL_COPY)).toEqual([
      "continuity",
      "operational",
      "capacity",
      "contribution",
      "coordination",
    ]);
    expect(CHANNEL_COPY.continuity.title).toBe("Rotacja i utrata wiedzy");
    expect(CHANNEL_COPY.capacity.title).toBe("Wypalenie i pasywność");
  });

  it("default firm stays at or under 5% of revenue in ostrożny mode", () => {
    const analysis = computeFullModelAnalysis(FNP_DEFAULTS, { iterations: 50, seed: 1 });
    expect(analysis.costs.scopeMode).toBe("conservative");
    expect(analysis.costs.totalTax).toBeGreaterThan(0);
    expect(analysis.costs.totalTax / FNP_DEFAULTS.revenue).toBeLessThanOrEqual(0.05);
    expect(Number.isFinite(analysis.costs.totalTaxFull)).toBe(true);
  });

  it("ready valuation uses estimate source without a 7-item survey", () => {
    const analysis = computeFullModelAnalysis(FNP_DEFAULTS, { iterations: 200, seed: 1 });
    expect(analysis.valuation.ready).toBe(true);
    expect(analysis.valuation.channels).toHaveLength(5);
    expect(analysis.valuation.total.base).toBe(analysis.costs.totalTax);
  });

  it("channel headlines sum to LINE 99 and two areas stay out of the sum", () => {
    const analysis = computeFullModelAnalysis(FNP_DEFAULTS, { iterations: 50, seed: 1 });
    const splits = analysis.valuation.channels.map(splitChannel);
    const headlineSum = splits.reduce((sum, s) => sum + s.headline, 0);
    expect(headlineSum).toBeCloseTo(analysis.costs.totalTax, 6);
    const byId = Object.fromEntries(analysis.valuation.channels.map((ch) => [ch.id, splitChannel(ch)]));
    expect(byId.contribution.headline).toBe(0);
    expect(byId.coordination.headline).toBe(0);
    expect(byId.continuity.headline).toBeGreaterThan(0);
    expect(byId.operational.headline).toBeGreaterThan(0);
    expect(byId.capacity.headline).toBeGreaterThan(0);
  });

  it("uses the FNP problem mix, not the academic per-head critical rate", () => {
    expect(FNP_PROBLEM_DIST.find((d) => d.id === "critical").count).toBeLessThan(0.02);
    expect(FNP_PROBLEM_DIST.find((d) => d.id === "major").count).toBeLessThan(0.1);
  });

  it("declared turnover moves the continuity headline and cannot invent extra leavers", () => {
    const input = {
      revenue: 100_000_000,
      employees: 500,
      avgSalary: 90_000,
      safety: PL_AVG_SAFETY,
    };
    const high = computeFullModelAnalysis(fnpAnalysisParams({ ...input, turnoverPct: 16 }), { iterations: 20, seed: 1 });
    const low = computeFullModelAnalysis(fnpAnalysisParams({ ...input, turnoverPct: 3 }), { iterations: 20, seed: 1 });
    const highTurnover = splitChannel(high.valuation.channels.find((ch) => ch.id === "continuity")).headline;
    const lowTurnover = splitChannel(low.valuation.channels.find((ch) => ch.id === "continuity")).headline;
    expect(lowTurnover).toBeLessThan(highTurnover);
    const payroll = input.employees * input.avgSalary;
    expect(lowTurnover).toBeLessThan(payroll * 0.03 * 0.75 * 2);
  });
});

describe("FNP × Ipsos context section copy", () => {
  const context = readSection("Context.jsx");

  it("shows the three report figures", () => {
    for (const figure of ["71%", "68%", "73%"]) {
      expect(context).toContain(figure);
    }
  });

  it("names its source: Fundacja Nowe Przestrzenie, Ipsos and the report title", () => {
    expect(context).toMatch(/Fundacj[ai] Nowe Przestrzenie/);
    expect(context).toContain("Ipsos");
    expect(context).toMatch(/Ile kosztuje milczenie\?/);
  });

  it("says the figures are context, not converted to złote and not a calibration base", () => {
    expect(context).toMatch(/kontekst/i);
    expect(context).toMatch(/nie przelicza[^.]*na złote/);
    expect(context).toMatch(/nie jest na nich skalibrowany/);
  });

  it("contains no money amounts, ROI or return claims", () => {
    expect(context).not.toMatch(/\d[\d\s.,]*\s*(zł|PLN|mln|mld|tys\.)/i);
    expect(context).not.toMatch(/\bROI\b/);
    expect(context).not.toMatch(/zwrot/i);
  });

  it("never claims the model is calibrated on Ipsos (negated statement allowed)", () => {
    // Every sentence that mentions calibration must negate it before the verb.
    const sentences = context.split(/(?<=[.!?])\s+/);
    const calibrationSentences = sentences.filter((sentence) => /kalibr/i.test(sentence));
    expect(calibrationSentences.length).toBeGreaterThan(0);
    for (const sentence of calibrationSentences) {
      expect(sentence).toMatch(/\bnie\b[^.!?]*kalibr/i);
    }
    expect(context).not.toMatch(/kalibr\w*\s+(na|na podstawie|w oparciu o)\s+(danych\s+|badaniu\s+|raporcie\s+)?Ipsos/i);
  });
});

describe("public section copy style", () => {
  it("has no em-dash characters in src/sections/*.jsx", () => {
    const files = readdirSync(sectionsDir).filter((f) => f.endsWith(".jsx"));
    expect(files.length).toBeGreaterThan(0);
    const offenders = files.filter((f) => readSection(f).includes("\u2014"));
    expect(offenders).toEqual([]);
  });
});
