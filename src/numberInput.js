// Text <-> number for the company-data fields. Polish typography groups
// thousands with a non-breaking space (100 000 000) and writes decimals with
// a comma. The parsed value is what validation and the engine receive:
// a finite number, "" for an empty field, or NaN for text that is not a
// number (validateInputs then shows "Wpisz skończoną liczbę.").
export const GROUP = "\u00a0";
const SPACES = /[\s\u00a0\u202f\u2009]/g;
const SPACE = /[\s\u00a0\u202f\u2009]/;

const pattern = (decimal) => (decimal ? /^-?\d+([.,]\d*)?$/ : /^-?\d+$/);
// Whole numbers pasted with dots as thousands separators, e.g. 100.000.000.
// Only exact groups of three count; 1.00.000, 100.000 000 and 1.5 do not.
const DOT_GROUPED = /^-?\d{1,3}(\.\d{3})+$/;

// Dot-grouped whole numbers become space-grouped (same length, so a caret
// position still points at the same character); everything else is kept.
function undot(text, decimal) {
  const raw = String(text ?? "");
  if (decimal) return raw;
  return DOT_GROUPED.test(raw.trim()) ? raw.replaceAll(".", " ") : raw;
}

export function parseNumberInput(text, { decimal = false } = {}) {
  const compact = undot(text, decimal).replace(SPACES, "");
  if (compact === "") return "";
  if (!pattern(decimal).test(compact)) return NaN;
  return Number(compact.replace(",", "."));
}

const groupDigits = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP);

// Display form of what the visitor typed: digits grouped, decimal comma.
// Text that does not parse is returned unchanged so nothing is lost.
export function formatTyped(text, { decimal = false } = {}) {
  const compact = undot(text, decimal).replace(SPACES, "");
  if (compact === "" || !pattern(decimal).test(compact)) return String(text ?? "");
  const [, sign, int, sep, frac] = compact.match(/^(-?)(\d+)([.,]?)(\d*)$/);
  return sign + (decimal ? int : groupDigits(int)) + (sep ? "," + frac : "");
}

export function formatNumberInput(value, { decimal = false } = {}) {
  if (value === "" || value === null || value === undefined) return "";
  if (typeof value !== "number" || !Number.isFinite(value)) return String(value);
  return formatTyped(String(value), { decimal });
}

// Reformat after an edit and keep the caret after the same number of
// significant (non-space) characters, so grouping never moves it.
export function reformat(text, caret, options) {
  const formatted = formatTyped(text, options);
  const significant = undot(text, options?.decimal).slice(0, caret).replace(SPACES, "").length;
  let position = 0;
  for (let seen = 0; position < formatted.length && seen < significant; position += 1) {
    if (!SPACE.test(formatted[position])) seen += 1;
  }
  return { text: formatted, caret: position, value: parseNumberInput(text, options) };
}
