import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import App from "./App.jsx";

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
