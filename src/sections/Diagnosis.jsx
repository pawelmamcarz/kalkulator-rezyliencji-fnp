import { fmtCurrencyCompact as fmt } from "../logic.js";
import LedgerSectionHeading from "../components/LedgerSectionHeading.jsx";
import LedgerBox from "../components/LedgerBox.jsx";
import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";
import { CLIMATE_ANCHORS, climateAnchor } from "../channels.js";

function MoneyField({ label, value, onChange, min = 0, step = 1000 }) {
  return (
    <LedgerBox label={label} style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <span className="micro">{label}</span>
        <strong style={{ fontFamily: "var(--mono)", fontSize: 18 }}>{fmt(value, "PLN", "pl")}</strong>
      </div>
      <input
        className="num-input"
        type="number"
        min={min}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ marginTop: 8, textAlign: "left", fontSize: 16 }}
      />
    </LedgerBox>
  );
}

function NumberField({ label, value, onChange, min, max, step, display }) {
  return (
    <LedgerBox label={label} style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <span className="micro">{label}</span>
        <strong style={{ fontFamily: "var(--mono)", fontSize: 18 }}>{display}</strong>
      </div>
      <input
        className="num-input"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ marginTop: 8, textAlign: "left", fontSize: 16 }}
      />
    </LedgerBox>
  );
}

export default function Diagnosis({ params, up }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const anchor = climateAnchor(params.safety);

  return (
    <section id="dane" style={{ padding: "48px 0" }}>
      <LedgerSectionHeading
        num="KROK 1"
        title="Dane, które znasz z głowy"
        kicker="Żadnych ankiet, żadnych danych osobowych"
      />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginTop: 28 }}>
        <LedgerBox label="Nazwa organizacji (opcjonalnie)" style={{ padding: 18, gridColumn: isMobile ? "auto" : "1 / -1" }}>
          <input
            className="num-input"
            type="text"
            value={params.companyName}
            placeholder="np. Przykładowa Firma S.A."
            aria-label="Nazwa organizacji"
            onChange={(event) => up("companyName", event.target.value)}
            style={{ textAlign: "left", fontWeight: 400, fontSize: 18 }}
          />
        </LedgerBox>
        <MoneyField label="Przychody roczne" value={params.revenue} onChange={(v) => up("revenue", v)} step={1_000_000} />
        <MoneyField label="Koszty roczne" value={params.costs} onChange={(v) => up("costs", v)} step={1_000_000} />
        <NumberField label="Zatrudnienie" value={params.employees} min={1} max={5_000_000} step={1} display={`${params.employees} FTE`} onChange={(v) => up("employees", v)} />
        <MoneyField label="Przeciętne wynagrodzenie brutto / rok" value={params.avgSalary} onChange={(v) => up("avgSalary", v)} step={1000} />
        <NumberField label="Rotacja" value={params.turnoverPct} min={0} max={100} step={0.5} display={`${params.turnoverPct}%`} onChange={(v) => up("turnoverPct", v)} />
      </div>
      <p className="micro" style={{ marginTop: 12, lineHeight: 1.5 }}>
        Główna liczba wychodzi z etatów, płacy, rotacji i klimatu. Koszty służą tylko do marży. Przychód pokazuje, ile to procent firmy.
      </p>

      <LedgerBox label="Klimat organizacji · szacunek własny, nie pomiar" style={{ padding: 22, marginTop: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <span className="micro">Jeden suwak 0–100</span>
          <strong style={{ fontFamily: "var(--mono)", fontSize: 22 }}>{params.safety}/100</strong>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={params.safety}
          aria-label="Ocena klimatu organizacji"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={params.safety}
          aria-valuetext={`${params.safety} na 100. ${anchor.label}`}
          onChange={(event) => up("safety", Number(event.target.value))}
          style={{ marginTop: 16 }}
        />
        <p style={{ fontFamily: "var(--serif)", fontSize: 16, marginTop: 12 }}>
          {anchor.label}
        </p>
        <div className="anchor-row" style={{ flexWrap: "wrap" }}>
          {CLIMATE_ANCHORS.map((item) => (
            <span key={item.at} className="micro" style={{ color: Math.abs(params.safety - item.at) < 12 ? "var(--l-ink)" : "var(--l-mute)" }}>
              {item.at}
            </span>
          ))}
        </div>
        <p className="micro" style={{ marginTop: 14, lineHeight: 1.5 }}>
          To nie jest ankieta Edmondson. Zapisujemy, jak Ty widzisz klimat.
          Żeby zmierzyć, jak jest w zespołach, potrzebna jest diagnoza FNP.
        </p>
      </LedgerBox>
    </section>
  );
}
