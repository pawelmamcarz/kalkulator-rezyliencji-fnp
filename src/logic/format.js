import { PLN_EUR_RATE, PLN_USD_RATE } from "./constants.js";

export const fmt = (v) => {
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(0) + "k";
  return v.toFixed(0);
};
export const fmtPLN = (v) => fmt(v) + " PLN";
export const fmtPct = (v) => (v * 100).toFixed(1) + "%";

// PLN-per-unit FX rates: converting a PLN amount to EUR/USD divides by the rate.
const FX = { PLN: 1, EUR: PLN_EUR_RATE, USD: PLN_USD_RATE };

// Currency-aware compact formatter shared across sections (hero LINE 99,
// modules, diagnosis, optimizer, pitch, sticky bar, ST-13 filing). The FX
// division and Intl options must stay identical everywhere so the same total
// reads the same in every place. Input `n` is a PLN amount.
export const fmtCurrencyCompact = (n, currency, lang) => {
  const rate = FX[currency] ?? 1;
  return new Intl.NumberFormat(lang === "pl" ? "pl-PL" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    notation: "compact",
    maximumSignificantDigits: 3,
  }).format(n / rate);
};
