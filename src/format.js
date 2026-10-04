import { fmtCurrencyCompact } from "./logic/format.js";

// Amounts in Polish compact notation; below 1000 zł whole złoty (the engine
// formatter rounds them, so 0.4 zł prints "0 zł", not "0,4 zł").
export const money = (value) => fmtCurrencyCompact(value, "PLN", "pl");

const PERCENT = new Intl.NumberFormat("pl-PL", { style: "percent", maximumFractionDigits: 1 });
const PERCENT_STEP = 0.001;

// Share as a Polish percent with one decimal. A positive share that would
// round to 0% prints "poniżej 0,1%" so a non-zero amount never reads as 0%.
export function share(value) {
  if (value > 0 && value < PERCENT_STEP / 2) return `poniżej ${PERCENT.format(PERCENT_STEP)}`;
  return PERCENT.format(value);
}

// "od 2,39 do 3,96 mln zł": the unit is written once when both ends share it.
export function moneyRange(low, high) {
  const a = money(low), b = money(high);
  const unit = (text) => text.replace(/^[\d\s,\u00a0]+/, "");
  const ua = unit(a);
  return ua && ua === unit(b) ? `od ${a.slice(0, a.length - ua.length).trim()} do ${b}` : `od ${a} do ${b}`;
}

// Short form under the slider: "10 punktów niżej: X. 10 wyżej: Y."
export function sensitivityShort(sensitivity) {
  if (!sensitivity) return "";
  const { step, lower, higher } = sensitivity;
  const parts = [];
  if (lower) parts.push(`${step} punktów niżej: ${money(lower.total)}.`);
  if (higher) parts.push(lower ? `${step} wyżej: ${money(higher.total)}.` : `${step} punktów wyżej: ${money(higher.total)}.`);
  return parts.join(" ");
}

// Plain Polish number (decimal comma), e.g. a declared turnover of 14.5.
export const plNumber = (value) => Number(value).toLocaleString("pl-PL", { maximumFractionDigits: 2 });

// "Przy klimacie o 10 punktów niższym: X. Przy wyższym o 10: Y." Engine
// values for the same inputs; a side outside 0–100 is left out.
export function sensitivitySentence(sensitivity) {
  if (!sensitivity) return "";
  const { step, lower, higher } = sensitivity;
  const parts = [];
  if (lower) parts.push(`Przy klimacie o ${step} punktów niższym: ${money(lower.total)}.`);
  if (higher) parts.push(lower ? `Przy wyższym o ${step}: ${money(higher.total)}.` : `Przy klimacie o ${step} punktów wyższym: ${money(higher.total)}.`);
  return parts.join(" ");
}
