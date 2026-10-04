// Shared input coercion for the engine and its callers.
//
// A value counts as a number only when it is a finite JS number or a string
// that, after trimming, is a plain decimal numeral ("41", " 41.5 ", "-3",
// "1e3"). Everything else is "missing": null, undefined, "", whitespace,
// booleans, arrays, objects, NaN, Infinity, "abc", "41%". `Number(x)` alone
// is not enough: Number(" ") === 0, Number(true) === 1 and Number([5]) === 5,
// so a blank field became climate 0 and `true` became climate 1.
const NUMERAL = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;

export function finiteOrNull(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!NUMERAL.test(text)) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

export function finiteOr(value, fallback) {
  const n = finiteOrNull(value);
  return n === null ? fallback : n;
}

// True for the values a form leaves behind when nothing was typed.
export function isBlankInput(value) {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}
