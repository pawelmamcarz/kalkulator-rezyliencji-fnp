import { useId, useState } from "react";
import NumberField from "../components/NumberField.jsx";
import { INPUT_FIELDS } from "../inputs.js";
import { FIRM_KEYS, firmSummary, isEdited } from "../firm.js";

// Fields that take a decimal comma (percent, part-time FTE); the rest are whole numbers.
const DECIMAL_FIELDS = new Set(["turnoverPct", "employees"]);
// The firm in one line; the five fields open in place on request and open
// themselves while any field is invalid.
// Plausibility hints that do not block the result.
function softWarning(key, params) {
  const salary = Number(params.avgSalary);
  if (key === "avgSalary" && salary > 0 && salary < 50_000) return "Czy to kwota roczna? Płacę miesięczną pomnóż przez 12.";
  return "";
}

export default function Diagnosis({ params, up, errors, reset }) {
  const [open, setOpen] = useState(false);
  const panel = useId();
  const invalid = FIRM_KEYS.some((key) => errors[key]);
  const expanded = open || invalid;
  const edited = isEdited(params);
  return (
    <section id="dane" className="b-firm block" aria-labelledby="dane-tytul">
      <h2 id="dane-tytul" className="sr-only">Dane firmy</h2>
      <p className="firm-line num" id="firma">{firmSummary(params, errors)}</p>
      {errors.surveyScopeConfirmed && params.surveyConfirmed && <p className="field-hint" role="status">Potwierdź zakres badania w sekcji oceny klimatu, aby zobaczyć wynik.</p>}
      <div className="firm-actions">
        {!invalid && (
          <button type="button" className="btn" aria-expanded={expanded} aria-controls={panel} onClick={() => setOpen(!expanded)}>
            {expanded ? "Zwiń dane" : "Zmień dane"}
          </button>
        )}
        {edited && <button type="button" className="btn" onClick={reset}>Przywróć przykład</button>}
      </div>
      <div id={panel} hidden={!expanded}>
        <p className="small muted" style={{ marginTop: 16 }}>Liczymy w przeglądarce. Wpisanych danych ani wyniku nie wysyłamy i nie zapisujemy.</p>
        <div className="fields">
          {INPUT_FIELDS.map(({ key, label, unit, hint }) => (
            <div key={key} className="field">
              <label htmlFor={key}>{label}</label>
              <div className="field-row">
                <NumberField id={key} className="num-input" decimal={DECIMAL_FIELDS.has(key)} required value={params[key]}
                  aria-invalid={!!errors[key]} aria-describedby={`${key}-hint${errors[key] ? ` ${key}-error` : ""}`}
                  onValue={(value) => up(key, value)} />
                <span className="field-unit">{unit}</span>
              </div>
              <p id={`${key}-hint`} className="field-hint">{hint}</p>
              {errors[key] && <p id={`${key}-error`} className="field-error">{errors[key]}</p>}
              {!errors[key] && softWarning(key, params) && <p className="field-hint" role="status">{softWarning(key, params)}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
