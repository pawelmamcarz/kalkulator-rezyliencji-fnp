import LedgerSectionHeading from "../components/LedgerSectionHeading.jsx";
import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";
import { CLIMATE_ANCHORS, climateAnchor } from "../channels.js";
import { INPUT_FIELDS } from "../inputs.js";

export default function Diagnosis({ params, up, errors, reset }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const anchor = climateAnchor(params.safety);
  return (
    <section id="dane" style={{ padding: "40px 0" }}>
      <LedgerSectionHeading num="KROK 1" title="Dane organizacji" kicker="Jeden rok, ten sam zakres danych" />
      <p style={{ marginTop: 20 }}>Na początek wpisaliśmy dane przykładowej firmy. Zastąp je własnymi. Obliczenia odbywają się w przeglądarce, wpisane dane nie są wysyłane ani zapisywane na serwerze. Odświeżenie strony przywraca przykład.</p>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginTop: 24 }}>
        {INPUT_FIELDS.map(({ key, label, min, max, unit, hint }) => (
          <div key={key} style={{ padding: 18, border: "1px solid var(--l-rule)", background: "#fff", minWidth: 0 }}>
            <label htmlFor={key} style={{ display: "block", fontWeight: 600 }}>{label}</label>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "12px 0" }}>
              <input id={key} className="num-input" type="number" inputMode="decimal" min={min} max={max} step="any" required value={params[key]}
                aria-invalid={!!errors[key]} aria-describedby={`${key}-hint${errors[key] ? ` ${key}-error` : ""}`}
                onChange={(event) => up(key, event.target.value === "" ? "" : Number(event.target.value))} />
              <span>{unit}</span>
            </div>
            <p id={`${key}-hint`} className="field-hint">{hint}</p>
            {errors[key] && <p id={`${key}-error`} className="field-error">{errors[key]}</p>}
          </div>
        ))}
        <div style={{ padding: 18, border: "1px solid var(--l-rule)", background: "#fff", minWidth: 0 }}>
          <label htmlFor="companyName" style={{ display: "block", fontWeight: 600 }}>Nazwa organizacji (opcjonalnie)</label>
          <input id="companyName" className="num-input" type="text" maxLength={120} value={params.companyName} placeholder="Do wydruku" autoComplete="off"
            onChange={(event) => up("companyName", event.target.value)} style={{ margin: "12px 0", fontSize: 18 }} />
          <p className="field-hint">Pojawi się tylko na Twoim wydruku.</p>
        </div>
      </div>
      <p className="field-hint" style={{ marginTop: 16 }}>Kwota zależy od etatów, płacy, rotacji i klimatu. Przychód służy do obliczenia procentu, a koszty do porównania z marżą. Wszystkie kwoty podaj w złotych.</p>
      <div style={{ padding: isMobile ? 18 : 24, marginTop: 28, border: "1px solid var(--l-rule)", background: "#fff" }}>
        <label htmlFor="safety" style={{ display: "block", fontWeight: 600 }}>Klimat organizacji: szacunek własny, nie pomiar</label>
        <p id="climate-help" className="field-hint" style={{ marginTop: 8 }}>Jak bezpieczne jest zgłaszanie problemów i przyznawanie się do błędów? Wybierz opis najbliższy codziennym zachowaniom. Początkowe 41/100 to przykład, nie wynik badania Twojej firmy.</p>
        <div style={{ fontFamily: "var(--mono)", fontSize: 24, marginTop: 14 }}>{params.safety}/100</div>
        <input id="safety" type="range" min={0} max={100} step={1} value={params.safety}
          aria-describedby="climate-help climate-anchor" aria-valuetext={`${params.safety} na 100. ${anchor.label}`}
          onChange={(event) => up("safety", Number(event.target.value))} />
        <p id="climate-anchor" style={{ fontWeight: 600, marginTop: 8 }}>{anchor.label}</p>
        <ul className="climate-anchors">
          {CLIMATE_ANCHORS.map((item) => <li key={item.at}><strong>{item.at}/100:</strong> {item.label}</li>)}
        </ul>
        <p className="field-hint" style={{ marginTop: 16 }}>Suwak nie zastępuje ankiety zespołu. Ocenę warto porównać z doświadczeniami pracowników, w tym z obawą przed konsekwencjami zgłoszenia. <a href="#efekt-mrozenia">Przeczytaj o efekcie mrożenia.</a></p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
        <a className="fnp-btn" href="#wynik">Zobacz wynik</a>
        <button type="button" className="fnp-btn ghost" onClick={reset}>Przywróć dane przykładowe</button>
      </div>
    </section>
  );
}
