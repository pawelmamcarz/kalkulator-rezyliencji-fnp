import { finiteOrNull, isBlankInput } from "./logic/numbers.js";

export const DEFAULT_PARAMS = {
  companyName: "", revenue: 100_000_000, costs: 92_000_000,
  employees: 500, avgSalary: 90_000, turnoverPct: 16, safety: 41,
  safetySource: "estimate", surveySafety: "", surveyScope: "", surveyConfirmed: false, scopeMode: "conservative", valuationEnabled: true,
};

export const INPUT_FIELDS = [
  { key: "revenue", label: "Przychody roczne", min: 0, max: 1e13, unit: "zł", hint: "Ostatni pełny rok. Służą tylko do obliczenia procentu." },
  { key: "costs", label: "Koszty roczne", min: 0, max: 1e13, unit: "zł", hint: "Ten sam rok. Służą tylko do porównania z marżą." },
  { key: "employees", label: "Liczba etatów", min: 1, max: 5_000_000, unit: "etatów", hint: "Średnio w roku. Dwa pół etatu to jeden etat." },
  { key: "avgSalary", label: "Roczna płaca brutto na etat", min: 0, max: 10_000_000, unit: "zł", hint: "Średnio, z premiami, bez składek pracodawcy." },
  { key: "turnoverPct", label: "Rotacja roczna", min: 0, max: 100, unit: "%", hint: "Ile osób na 100 zatrudnionych odeszło w ciągu roku. Kwota rotacji rośnie proporcjonalnie do tej liczby." },
];

// Only finite numbers or trimmed numeric strings count; whitespace is blank,
// and booleans or arrays are not numbers (Number(" ") === 0, Number(true) === 1).
export function inputError(value, { min, max }) {
  if (isBlankInput(value)) return "Uzupełnij pole, aby obliczyć wynik.";
  const number = finiteOrNull(value);
  if (number === null) return "Wpisz skończoną liczbę.";
  if (number < min || number > max) return `Wpisz liczbę od ${min.toLocaleString("pl-PL")} do ${max.toLocaleString("pl-PL")}.`;
  return "";
}

export function scenarioSafety(params) {
  return params.safetySource === "survey" ? params.surveySafety : params.safety;
}

export function validateInputs(params) {
  const fields = [...INPUT_FIELDS];
  fields.push(params.safetySource === "survey"
    ? { key: "surveySafety", min: 0, max: 100 }
    : { key: "safety", min: 0, max: 100 });
  const errors = Object.fromEntries(fields.map((field) => [field.key, inputError(params[field.key], field)]).filter(([, error]) => error));
  if (params.safetySource === "survey") {
    if (!["whole", "part", "unknown"].includes(params.surveyScope)) errors.surveyScope = "Wybierz zakres badanej grupy.";
    if (params.surveyConfirmed !== true) errors.surveyConfirmed = "Potwierdź zgodność skali i sposobu jej przeliczenia.";
  }
  return errors;
}
