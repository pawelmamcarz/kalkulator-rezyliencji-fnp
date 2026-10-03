export const DEFAULT_PARAMS = {
  companyName: "", revenue: 100_000_000, costs: 92_000_000,
  employees: 500, avgSalary: 90_000, turnoverPct: 16, safety: 41,
  safetySource: "estimate", scopeMode: "conservative", valuationEnabled: true,
};

export const INPUT_FIELDS = [
  { key: "revenue", label: "Przychody roczne", min: 0, max: 1e13, unit: "zł", hint: "Ostatni pełny rok. Służą tylko do obliczenia procentu." },
  { key: "costs", label: "Koszty roczne", min: 0, max: 1e13, unit: "zł", hint: "Ten sam rok. Służą tylko do porównania z marżą." },
  { key: "employees", label: "Liczba etatów", min: 1, max: 5_000_000, unit: "etatów", hint: "Średnio w roku. Dwa pół etatu to jeden etat." },
  { key: "avgSalary", label: "Roczna płaca brutto na etat", min: 0, max: 10_000_000, unit: "zł", hint: "Średnio, z premiami, bez składek pracodawcy." },
  { key: "turnoverPct", label: "Rotacja roczna", min: 0, max: 100, unit: "%", hint: "Ile osób na 100 zatrudnionych odeszło w ciągu roku." },
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
