import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import App from "./App.jsx";
import Result from "./sections/Result.jsx";
import Invitation from "./sections/Invitation.jsx";
import { DEFAULT_PARAMS } from "./inputs.js";
import { computeFnpAnalysis, computeFnpClimateSensitivity } from "./fnpModel.js";
import { money, share, sensitivityShort } from "./format.js";
import { readFileSync } from "node:fs";
import ClimateStops from "./components/ClimateStops.jsx";
import LiveBar from "./components/LiveBar.jsx";
import Headline from "./sections/Headline.jsx";
import Climate from "./sections/Climate.jsx";
import Diagnosis from "./sections/Diagnosis.jsx";
import { firmSummary, dataLabel } from "./firm.js";
import Disc from "./components/Disc.jsx";
import { discShare, discScale } from "./disc.js";
import { CLIMATE_ANCHORS } from "./channels.js";
import { validateInputs } from "./inputs.js";

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
    expect(flow).toContain(`10 punktów niżej: ${money(s.lower.total)}. 10 wyżej: ${money(s.higher.total)}.`.replace(/\s+/g, " "));
    expect(sensitivityShort(s)).toBe(`10 punktów niżej: ${money(s.lower.total)}. 10 wyżej: ${money(s.higher.total)}.`);
    const print = renderToString(createElement(Invitation, { params: { ...DEFAULT_PARAMS }, valuation: analysis.valuation, sensitivity: s }));
    expect(text(print)).toContain(line.replace(/\s+/g, " "));
  });

  it("omits a side that leaves the scale", () => {
    const s = computeFnpClimateSensitivity({ ...input, safety: 95 });
    const html = text(renderToString(createElement(Climate, { safety: 95, up: () => {}, sensitivity: s })));
    expect(html).toContain(`10 punktów niżej: ${money(s.lower.total)}.`.replace(/\s+/g, " "));
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

  it("has no scroll-only result button; the reset button appears once something changed", () => {
    expect(html).not.toContain("Zobacz wynik");
    expect(html).not.toMatch(/class="btn[^"]*"[^>]*href="#wynik"|href="#wynik"[^>]*class="btn/);
    expect(html).not.toContain("Przywróć przykład");
    const edited = { ...DEFAULT_PARAMS, safety: 10 };
    const firm = renderToString(createElement(Diagnosis, { params: edited, up: () => {}, errors: {}, reset: () => {} }));
    expect(firm).toContain("Przywróć przykład");
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
    expect(renderToString(createElement(LiveBar, { total: null, worst: 5e6 }))).not.toContain("live-bar");
    const valid = renderToString(createElement(LiveBar, { total: { base: 3.15e6, low: 2.39e6, high: 3.96e6 }, worst: 5e6 }));
    expect(valid).toContain('class="live-bar"');
    expect(valid).toContain('aria-hidden="true"');
    const css = readFileSync(new URL("./index.css", import.meta.url), "utf8");
    const printBlocks = css.slice(css.indexOf("@media print"));
    expect(printBlocks).toMatch(/\.live-bar\s*{\s*display:\s*none !important/);
    // The bar also serves the desktop layout, where nothing is sticky.
    expect(css.slice(0, css.indexOf("@media print"))).not.toMatch(/\.live-bar\s*{\s*display:\s*none/);
  });
});


describe("redesign: sentences first, the disc, the firm line", () => {
  const input = { revenue: DEFAULT_PARAMS.revenue, employees: DEFAULT_PARAMS.employees, avgSalary: DEFAULT_PARAMS.avgSalary, turnoverPct: DEFAULT_PARAMS.turnoverPct };
  const amount = (safety) => computeFnpAnalysis({ ...input, safety }).costs.totalTax;

  it("puts h1, amount, question and the first sentences before the firm fields in DOM order", () => {
    const at = (needle) => { const i = html.indexOf(needle); expect(i, needle).toBeGreaterThan(-1); return i; };
    const order = [
      at("<h1"),
      at('id="wynik-kwota"'),
      at("Jak bezpiecznie jest u Was zgłosić problem"),
      at(CLIMATE_ANCHORS[0].label),
      at(CLIMATE_ANCHORS[1].label),
      at('id="safety"'),
      at('id="firma"'),
      at('id="revenue"'),
      at('id="wynik"'),
      at('id="dalej"'),
    ];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(text(html.slice(at("<h1"), at('id="revenue"'))).replace(/\s/g, " ")).toContain(`${money(amount(41)).replace(/\s/g, " ")} rocznie`);
  });

  it("disc share is amount ÷ amount at climate 0, radius ∝ sqrt(share), zero at 100", () => {
    const worst = amount(0);
    expect(discShare(amount(41), worst)).toBeCloseTo(amount(41) / worst, 12);
    expect(discShare(worst, worst)).toBe(1);
    expect(discShare(amount(100), worst)).toBe(0);
    expect(discShare(5, 0)).toBe(0);
    for (const share of [0, 0.25, 0.5, 1]) expect(discScale(share)).toBeCloseTo(Math.sqrt(share), 12);
    // area ratio equals amount ratio
    expect(discScale(discShare(amount(75), worst)) ** 2 / discScale(discShare(amount(41), worst)) ** 2).toBeCloseTo(amount(75) / amount(41), 9);
    expect(renderToString(createElement(Disc, { share: 0 }))).toContain("scale(0)");
    expect(renderToString(createElement(Disc, { share: 0 }))).toContain('class="disc-ring"');
    const a = computeFnpAnalysis({ ...input, safety: 100 });
    const top = renderToString(createElement(Headline, { valuation: a.valuation, worst }));
    expect(top).toContain("scale(0)");
    expect(top).toContain('class="disc-ring"');
    expect(text(top)).toContain("Koło to 0% kwoty przy najniższej ocenie klimatu.");
    // a small share is still a visible dot
    expect(discScale(discShare(amount(92), worst))).toBeGreaterThan(0.2);
  });

  it("server output contains the default amount, the disc at its share and the example label", () => {
    const share = amount(41) / amount(0);
    expect(html).toContain(`scale(${Math.sqrt(share)})`);
    expect(text(html).replace(/\s/g, " ")).toContain("3,15 mln zł rocznie, od 2,39 do 3,96 mln zł");
    expect(text(html)).toContain("Przykładowa firma");
    expect(text(html)).toContain(`Koło to ${Math.round(share * 100)}% kwoty przy najniższej ocenie klimatu.`);
    expect(text(mainFlow)).not.toMatch(/model daje|Przy klimacie o 10/);
  });

  it("the firm line reflects the current values", () => {
    const line = (p, e) => firmSummary(p, e).replace(/\s/g, " ");
    expect(line(DEFAULT_PARAMS, {})).toBe("Przykładowa firma: 500 etatów, przychód 100 mln zł, koszty 92 mln zł, płaca 90 tys. zł, rotacja 16%.");
    expect(text(html)).toContain("Przykładowa firma: 500 etatów, przychód 100 mln zł, koszty 92 mln zł, płaca 90 tys. zł, rotacja 16%.");
    const mine = { ...DEFAULT_PARAMS, revenue: 2_500_000_000, turnoverPct: 14.5 };
    expect(line(mine, {})).toBe("Twoja firma: 500 etatów, przychód 2,5 mld zł, koszty 92 mln zł, płaca 90 tys. zł, rotacja 14,5%.");
    const broken = { ...DEFAULT_PARAMS, revenue: "" };
    expect(line(broken, validateInputs(broken))).toContain("przychód do poprawy");
    // a climate change alone keeps the example firm
    expect(line({ ...DEFAULT_PARAMS, safety: 10 }, {})).toMatch(/^Przykładowa firma, Twoja ocena klimatu:/);
  });

  it("the data disclosure is closed by default and opens itself on invalid input", () => {
    expect(html).toMatch(/aria-expanded="false"[^>]*>Zmień dane</);
    const panel = html.match(/<div id="([^"]+)" hidden="">/);
    expect(panel).not.toBeNull();
    expect(html).toContain(`aria-controls="${panel[1]}"`);
    const broken = { ...DEFAULT_PARAMS, revenue: "" };
    const firm = renderToString(createElement(Diagnosis, { params: broken, up: () => {}, errors: validateInputs(broken), reset: () => {} }));
    expect(firm).not.toContain("Zwiń dane");
    expect(firm).not.toMatch(/hidden=""/);
    expect(firm).toContain('id="revenue-error"');
  });

  it("labels the three states: example, example with own climate, own firm", () => {
    expect(dataLabel(DEFAULT_PARAMS)).toBe("Przykładowa firma");
    expect(dataLabel({ ...DEFAULT_PARAMS, safety: 10 })).toBe("Przykładowa firma, Twoja ocena klimatu");
    expect(dataLabel({ ...DEFAULT_PARAMS, employees: 200 })).toBe("Twoja firma");
    expect(dataLabel({ ...DEFAULT_PARAMS, employees: 200, safety: 10 })).toBe("Twoja firma");
    const a = computeFnpAnalysis({ ...input, safety: 10 });
    const own = text(renderToString(createElement(Headline, { valuation: a.valuation, worst: amount(0), label: dataLabel({ ...DEFAULT_PARAMS, safety: 10 }) })));
    expect(own).toContain("Przykładowa firma, Twoja ocena klimatu");
    expect(text(renderToString(createElement(Headline, { valuation: null })))).toContain("Popraw oznaczone pola");
  });

  it("has no ALL-CAPS CSS and no monospace anywhere in styles or components", () => {
    const css = readFileSync(new URL("./index.css", import.meta.url), "utf8");
    expect(css).not.toMatch(/text-transform:\s*uppercase/i);
    expect(css).not.toMatch(/--mono|monospace|IBM Plex Mono/i);
    expect(css).toMatch(/--font:\s*"Outfit"/);
    // orange is for the cost only: the disc fill is the one rule using it
    const uses = css.split("}").filter((rule) => /var\(--voice\)/.test(rule)).map((rule) => rule.split("{")[0].trim());
    expect(uses).toEqual([".disc-fill"]);
    expect(html).not.toMatch(/climate-stop-mark|#ff511f/i);
    expect(html).not.toMatch(/textTransform|text-transform:\s*uppercase|var\(--mono\)|monospace/i);
    const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    expect(indexHtml).toMatch(/family=Outfit[^"]*display=swap/);
    expect(indexHtml).not.toMatch(/Plex|Source\+Serif/);
  });

  it("keeps the contract strings", () => {
    const flow = text(mainFlow);
    expect(flow).toContain("To szacunek własny, nie pomiar.");
    expect(flow).toMatch(/Poza sumą, bez kwoty: Innowacje i uczenie się oraz Koordynacja i hierarchia ?\./);
    expect(html).toContain("Fundacja Nowe Przestrzenie × Paweł Mamcarz · silnik: Silence Tax");
    expect(html).not.toContain("\u2014");
    expect(html).not.toMatch(/KROK|Krok \d/);
  });
});
