import LedgerSectionHeading from "../components/LedgerSectionHeading.jsx";
import NumberField from "../components/NumberField.jsx";
import ClimateStops from "../components/ClimateStops.jsx";
import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";
import { climateAnchor } from "../channels.js";
import { DEFAULT_PARAMS, INPUT_FIELDS } from "../inputs.js";

// Fields that take a decimal comma (percent); the rest are whole numbers.
const DECIMAL_FIELDS = new Set(["turnoverPct"]);

export default function Diagnosis({ params, up, errors, reset }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const anchor = climateAnchor(params.safety);
  const box = { padding: isMobile ? 14 : 18, border: "1px solid var(--l-rule)", background: "#fff", minWidth: 0 };
  return (
    <section id="dane" style={{ padding: "28px 0" }}>
      <LedgerSectionHeading num="Krok 1" title="Dane firmy" />
      <p style={{ marginTop: 14 }}>Wpisaliśmy przykładową firmę. Zastąp dane własnymi. Liczymy w przeglądarce, niczego nie wysyłamy.</p>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 16, marginTop: 18 }}>
        {INPUT_FIELDS.map(({ key, label, unit, hint }) => (
          <div key={key} style={box}>
            <label htmlFor={key} style={{ display: "block", fontWeight: 600 }}>{label}</label>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "8px 0" }}>
              <NumberField id={key} className="num-input" decimal={DECIMAL_FIELDS.has(key)} required value={params[key]}
                aria-invalid={!!errors[key]} aria-describedby={`${key}-hint${errors[key] ? ` ${key}-error` : ""}`}
                onValue={(value) => up(key, value)} />
              <span>{unit}</span>
            </div>
            <p id={`${key}-hint`} className="field-hint">{hint}</p>
            {errors[key] && <p id={`${key}-error`} className="field-error">{errors[key]}</p>}
          </div>
        ))}
      </div>
      <div style={{ ...box, padding: isMobile ? 14 : 22, marginTop: isMobile ? 12 : 16 }}>
        <label htmlFor="safety" style={{ display: "block", fontWeight: 600, fontSize: 19, lineHeight: 1.35 }}>Jak bezpiecznie jest u Was zgłosić problem albo przyznać się do błędu?</label>
        <p id="climate-help" className="field-hint" style={{ marginTop: 6 }}>To szacunek własny, nie pomiar. Startowe {DEFAULT_PARAMS.safety} to przykład, nie wynik badania Twojej firmy.</p>
        <div className="climate-now">
          <span style={{ fontFamily: "var(--mono)", fontSize: 24, fontVariantNumeric: "tabular-nums" }}>{params.safety}/100</span>
          <span id="climate-anchor" style={{ fontWeight: 600 }}>{anchor.label}</span>
        </div>
        <input id="safety" type="range" min={0} max={100} step={1} value={params.safety}
          aria-describedby="climate-help climate-anchor" aria-valuetext={`${params.safety} na 100. ${anchor.label}`}
          onChange={(event) => up("safety", Number(event.target.value))} />
        <ClimateStops safety={params.safety} onPick={(value) => up("safety", value)} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
        <button type="button" className="fnp-btn ghost" onClick={reset}>Przywróć przykład</button>
      </div>
    </section>
  );
}
