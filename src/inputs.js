export const DEFAULT_PARAMS = {
  companyName: "", revenue: 100_000_000, costs: 92_000_000,
  employees: 500, avgSalary: 90_000, turnoverPct: 16, safety: 41,
  safetySource: "estimate", scopeMode: "conservative", valuationEnabled: true,
};

export const INPUT_FIELDS = [
  { key: "revenue", label: "Przychody roczne", min: 0, max: 1e13, unit: "zł", hint: "Przychody za ostatni pełny rok, w złotych." },
  { key: "costs", label: "Koszty roczne", min: 0, max: 1e13, unit: "zł", hint: "Ten sam rok i zakres organizacji co przychody. Służą do porównania z wynikiem finansowym." },
  { key: "employees", label: "Zatrudnienie w etatach (FTE)", min: 1, max: 5_000_000, unit: "FTE", hint: "Średnioroczne pełne etaty. Dwie osoby na pół etatu to 1 FTE." },
  { key: "avgSalary", label: "Wynagrodzenie brutto na etat / rok", min: 0, max: 10_000_000, unit: "zł", hint: "Roczna płaca brutto na pełny etat, z premiami, bez składek pracodawcy. Płacę miesięczną pomnóż przez 12." },
  { key: "turnoverPct", label: "Roczna rotacja pracowników", min: 0, max: 100, unit: "%", hint: "Odejścia w roku ÷ średnie zatrudnienie × 100%. Przy rotacji powyżej 100% model nie obsługuje tej sytuacji." },
];

export function inputError(value, { min, max }) {
  if (value === "" || value == null) return "Uzupełnij pole, aby obliczyć wynik.";
  const number = Number(value);
  if (!Number.isFinite(number)) return "Wpisz skończoną liczbę.";
  if (number < min || number > max) return `Wpisz liczbę od ${min.toLocaleString("pl-PL")} do ${max.toLocaleString("pl-PL")}.`;
  return "";
}

export function validateInputs(params) {
  const fields = [...INPUT_FIELDS, { key: "safety", min: 0, max: 100 }];
  return Object.fromEntries(fields.map((field) => [field.key, inputError(params[field.key], field)]).filter(([, error]) => error));
}
