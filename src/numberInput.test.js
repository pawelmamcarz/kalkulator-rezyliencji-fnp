import { describe, it, expect } from "vitest";
import { formatNumberInput, formatTyped, parseNumberInput, reformat } from "./numberInput.js";
import { validateInputs, DEFAULT_PARAMS } from "./inputs.js";

const NB = " ";
const show = (s) => s.replaceAll(NB, " ");

describe("number fields: parse", () => {
  it("accepts digits with any grouping spaces and gives today's number", () => {
    for (const text of ["100000000", "100 000 000", `100${NB}000${NB}000`, "100 000 000", " 100000000 "]) {
      expect(parseNumberInput(text)).toBe(100_000_000);
    }
    expect(parseNumberInput("2500000000")).toBe(2_500_000_000);
  });

  it("returns '' for an empty field and NaN for other text, so validation shows the field error", () => {
    expect(parseNumberInput("")).toBe("");
    expect(parseNumberInput("   ")).toBe("");
    for (const text of ["1e8", "abc", "1,5", "12a", "1.00.000", "100.000 000", "100.000,5", "1.5", "100.0000", ".100.000", "100.000."]) {
      expect(parseNumberInput(text)).toBeNaN();
      expect(validateInputs({ ...DEFAULT_PARAMS, revenue: parseNumberInput(text) }).revenue).toBe("Wpisz skończoną liczbę.");
    }
    expect(validateInputs({ ...DEFAULT_PARAMS, revenue: parseNumberInput("") }).revenue).toBe("Uzupełnij pole, aby obliczyć wynik.");
    expect(validateInputs({ ...DEFAULT_PARAMS, revenue: parseNumberInput("-5") }).revenue).toMatch(/^Wpisz liczbę od 0/);
  });

  it("accepts thousands grouped with dots, spaces or non-breaking spaces", () => {
    for (const text of ["100.000.000", " 100.000.000 ", "100 000 000", `100${NB}000${NB}000`]) {
      expect(parseNumberInput(text)).toBe(100_000_000);
    }
    expect(parseNumberInput("2.500.000.000")).toBe(2_500_000_000);
    expect(parseNumberInput("90.000")).toBe(90_000);
  });

  it("percent fields take a decimal comma or point", () => {
    expect(parseNumberInput("16,5", { decimal: true })).toBe(16.5);
    expect(parseNumberInput("16.5", { decimal: true })).toBe(16.5);
    expect(parseNumberInput("16,", { decimal: true })).toBe(16);
    expect(parseNumberInput("1,2,3", { decimal: true })).toBeNaN();
  });
});

describe("number fields: format", () => {
  it("groups thousands with a non-breaking space", () => {
    expect(formatNumberInput(100_000_000)).toBe(`100${NB}000${NB}000`);
    expect(show(formatNumberInput(92_000_000))).toBe("92 000 000");
    expect(formatNumberInput(500)).toBe("500");
    expect(formatNumberInput("")).toBe("");
    expect(formatNumberInput(16.5, { decimal: true })).toBe("16,5");
  });

  it("keeps text that does not parse unchanged", () => {
    expect(formatTyped("1.00.000")).toBe("1.00.000");
    expect(show(formatTyped("100.000.000"))).toBe("100 000 000");
    expect(formatTyped("1e8")).toBe("1e8");
  });

  it("keeps the caret after the same digit while grouping changes", () => {
    // typing 2500000000 digit by digit, caret at the end
    let text = "";
    for (const digit of "2500000000") {
      const next = reformat(text + digit, text.length + 1);
      text = next.text;
      expect(next.caret).toBe(text.length);
    }
    expect(show(text)).toBe("2 500 000 000");
    // inserting 9 after "2 5" (caret 3 -> text "2 59500 000 000"? no: raw insert)
    const inserted = reformat("2 5900 000 000", 4);
    expect(show(inserted.text)).toBe("25 900 000 000");
    expect(show(inserted.text.slice(0, inserted.caret))).toBe("25 9");
    // deleting a digit in the middle
    const deleted = reformat(`25${NB}90${NB}000${NB}000`, 5);
    expect(show(deleted.text)).toBe("2 590 000 000");
    expect(show(deleted.text.slice(0, deleted.caret))).toBe("2 590");
    expect(deleted.value).toBe(2_590_000_000);
    // pasted with dots: regrouped with spaces, caret still at the end
    const pasted = reformat("100.000.000", 11);
    expect(show(pasted.text)).toBe("100 000 000");
    expect(pasted).toMatchObject({ caret: 11, value: 100_000_000 });
    // malformed dots: unchanged, caret where it was, field error
    expect(reformat("1.00.000", 8)).toMatchObject({ text: "1.00.000", caret: 8 });
    expect(reformat("1.00.000", 8).value).toBeNaN();
  });
});
