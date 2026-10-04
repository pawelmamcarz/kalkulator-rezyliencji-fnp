import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import App from "./App.jsx";
import Result from "./sections/Result.jsx";
import Invitation from "./sections/Invitation.jsx";
import { DEFAULT_PARAMS } from "./inputs.js";
import { computeFnpAnalysis, computeFnpClimateSensitivity } from "./fnpModel.js";
import { money, share } from "./format.js";
import { readFileSync } from "node:fs";
import ClimateStops from "./components/ClimateStops.jsx";
import LiveBar from "./components/LiveBar.jsx";
import { CLIMATE_ANCHORS } from "./channels.js";

// Server-rendered page structure: short main flow, full methodology kept in a
// collapsed <details> for crawlers and visitors without JS.
const html = renderToString(createElement(App));
const text = (fragment) => fragment
  .replace(/<details[\s\S]*?<\/summary>/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&[a-z#0-9]+;/gi, " ")
  .replace(/\s+/g, " ")
  .trim();
const words = (s) => s.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const howtoAt = html.indexOf('class="fold howto"');
const mainFlow = html.slice(0, html.indexOf("<details"));

describe("public page structure", () => {
  it("has one h1 and the collapsed methodology with the efekt-mrozenia anchor", () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(howtoAt).toBeGreaterThan(0);
    expect(html).not.toMatch(/class="fold howto"[^>]*\sopen/);
    expect(html.indexOf('id="efekt-mrozenia"')).toBeGreaterThan(howtoAt);
    expect(html.indexOf('id="metodologia"')).toBeGreaterThan(howtoAt);
  });

  it("keeps the main flow short and free of jargon", () => {
    const flow = text(mainFlow);
    expect(words(flow)).toBeLessThanOrEqual(450);
    expect(flow).not.toMatch(/priory|kalibr|P10|Monte Carlo|sigmoid|overlap|FTE|tryb ostrożny|Silence Tax|rezyliencja to/i);
    expect(flow).toContain("szacunek własny, nie pomiar");
    expect(flow).toContain("Poza sumą");
    expect(flow).toMatch(/nie wycena księgowa, prognoza/);
  });

  it("keeps the required footer line, no em-dashes", () => {
    expect(html).toContain("Fundacja Nowe Przestrzenie × Paweł Mamcarz · silnik: Silence Tax");
    expect(html).not.toContain("—");
  });
});

describe("result block", () => {
  const flow = text(mainFlow);
  const input = { revenue: DEFAULT_PARAMS.revenue, employees: DEFAULT_PARAMS.employees, avgSalary: DEFAULT_PARAMS.avgSalary, turnoverPct: DEFAULT_PARAMS.turnoverPct, safety: DEFAULT_PARAMS.safety };
  const analysis = computeFnpAnalysis(input);

  it("prints the climate sensitivity line with the engine's values", () => {
    const s = computeFnpClimateSensitivity(input);
    expect(s.lower.total).toBe(computeFnpAnalysis({ ...input, safety: input.safety - 10 }).costs.totalTax);
    expect(s.higher.total).toBe(computeFnpAnalysis({ ...input, safety: input.safety + 10 }).costs.totalTax);
    const line = `Przy klimacie o 10 punktów niższym: ${money(s.lower.total)}. Przy wyższym o 10: ${money(s.higher.total)}.`;
    expect(flow).toContain(line.replace(/\s+/g, " "));
    const print = renderToString(createElement(Invitation, { params: { ...DEFAULT_PARAMS }, valuation: analysis.valuation, sensitivity: s }));
    expect(text(print)).toContain(line.replace(/\s+/g, " "));
  });

  it("omits a side that leaves the scale", () => {
    const s = computeFnpClimateSensitivity({ ...input, safety: 95 });
    const html = text(renderToString(createElement(Result, { valuation: computeFnpAnalysis({ ...input, safety: 95 }).valuation, params: { ...DEFAULT_PARAMS, safety: 95 }, sensitivity: s })));
    expect(html).toContain(`Przy klimacie o 10 punktów niższym: ${money(s.lower.total)}.`.replace(/\s+/g, " "));
    expect(html).not.toMatch(/wyższ/);
  });

  it("prints components that add up to the printed total", () => {
    const headline = analysis.costs.components.filter((c) => c.inHeadline);
    for (const c of headline) expect(flow).toContain(money(c.value).replace(/\s+/g, " "));
    expect(flow).toContain(money(analysis.costs.totalTax).replace(/\s+/g, " "));
    const sum = headline.reduce((acc, c) => acc + c.value, 0);
    expect(sum).toBeCloseTo(analysis.costs.totalTax, 6);
    // Rounded parts stay within rounding of the rounded total (3 significant digits).
    const parsed = (v) => Number(money(v).replace(/[^0-9,]/g, "").replace(",", ".")) * (/mln/.test(money(v)) ? 1e6 : 1e3);
    const printedSum = headline.reduce((acc, c) => acc + parsed(c.value), 0);
    expect(Math.abs(printedSum - parsed(analysis.costs.totalTax)) / parsed(analysis.costs.totalTax)).toBeLessThan(0.01);
  });

  it("formats small amounts as whole złoty and a tiny positive share as poniżej 0,1%", () => {
    expect(money(0.4).replace(/\s/g, " ")).toBe("0 zł");
    expect(money(57.6).replace(/\s/g, " ")).toBe("58 zł");
    expect(money(999.4).replace(/\s/g, " ")).toBe("999 zł");
    expect(share(0.0001)).toBe("poniżej 0,1%");
    expect(share(0)).toBe("0%");
    expect(share(0.0317).replace(/\s/g, " ")).toBe("3,2%");
    const tiny = { ...DEFAULT_PARAMS, employees: 1, avgSalary: 1, revenue: 1e12 };
    const a = computeFnpAnalysis(tiny);
    const html = text(renderToString(createElement(Result, { valuation: a.valuation, params: tiny, sensitivity: computeFnpClimateSensitivity(tiny) })));
    expect(a.costs.totalTax).toBeGreaterThan(0);
    expect(html).toContain("To poniżej 0,1% rocznych przychodów.");
    expect(html).not.toMatch(/\d,\d+ zł/);
  });

  it("has no national turnover reference in the visible main flow", () => {
    expect(flow).not.toMatch(/14,8|14\.8|GUS/);
  });
});


describe("climate control and live result", () => {
  it("labels the slider with the question and keeps the own-estimate line next to it", () => {
    expect(html).toMatch(/<label for="safety"[^>]*>Jak bezpiecznie jest u Was zgłosić problem albo przyznać się do błędu\?<\/label>/);
    expect(html).toMatch(/id="climate-help"[^>]*>To szacunek własny, nie pomiar\./);
    expect(html).toMatch(/id="safety"[^>]*aria-describedby="climate-help climate-anchor"/);
  });

  it("has no scroll-only result button, keeps the reset button", () => {
    expect(html).not.toContain("Zobacz wynik");
    expect(html).not.toMatch(/class="fnp-btn"[^>]*href="#wynik"|href="#wynik"[^>]*class="fnp-btn"/);
    expect(html).toContain("Przywróć przykład");
  });

  it("each sentence is a button that sets its anchor value; the current one is pressed", () => {
    const buttons = (safety, onPick = () => {}) => ClimateStops({ safety, onPick }).props.children;
    const picked = [];
    for (const button of buttons(41, (v) => picked.push(v))) button.props.onClick();
    expect(picked).toEqual(CLIMATE_ANCHORS.map((a) => a.at));
    for (const { at } of CLIMATE_ANCHORS) {
      const pressed = buttons(at).filter((b) => b.props["aria-pressed"]).map((b) => b.key);
      expect(pressed).toEqual([String(at)]);
    }
    expect(buttons(41).filter((b) => b.props["aria-pressed"]).map((b) => b.key)).toEqual(["35"]);
    expect(html).toMatch(/<button type="button" class="climate-stop on" aria-pressed="true">/);
    expect(html.match(/class="climate-stop( on)?"/g)).toHaveLength(5);
  });

  it("number fields show grouped digits and the numeric keypad", () => {
    expect(html).toMatch(/id="revenue"[^>]*inputMode="numeric"|inputMode="numeric"[^>]*id="revenue"/i);
    expect(html).toMatch(/id="revenue"[^>]*value="100\u00a0000\u00a0000"|value="100\u00a0000\u00a0000"[^>]*id="revenue"/);
    expect(html).toMatch(/id="turnoverPct"[^>]*inputMode="decimal"|inputMode="decimal"[^>]*id="turnoverPct"/i);
  });

  it("the fixed bar is not rendered when inputs are invalid and is hidden in print", () => {
    expect(renderToString(createElement(LiveBar, { total: null, safety: 41 }))).not.toContain("live-bar");
    const valid = renderToString(createElement(LiveBar, { total: { base: 3.15e6, low: 2.39e6, high: 3.96e6 }, safety: 41 }));
    expect(valid).toContain('class="live-bar"');
    expect(valid).toContain('aria-hidden="true"');
    const css = readFileSync(new URL("./index.css", import.meta.url), "utf8");
    const printBlocks = css.match(/@media print\s*{[^@]*}/g).join("\n");
    expect(printBlocks).toMatch(/\.live-bar\s*{\s*display:\s*none/);
  });
});
