import LedgerSectionHeading from "../components/LedgerSectionHeading.jsx";
import SafeSpaceConcept from "./SafeSpaceConcept.jsx";

export default function NextSteps({ ready, params, up }) {
  return (
    <section id="dalej" style={{ padding: "28px 0" }}>
      <LedgerSectionHeading num="Krok 3" title="Co dalej" />
      <p style={{ marginTop: 14, maxWidth: 820 }}>
        Liczba pokazuje skalę, ale nie mówi, co zmienić. To sprawdza diagnoza Fundacji Nowe Przestrzenie: co w Waszych zespołach utrudnia mówienie o problemach. Działania dobiera się dopiero po diagnozie.
      </p>
      <div style={{ marginTop: 18 }}>
        <a className="fnp-btn" href="mailto:zapraszamy@noweprzestrzenie.pl?subject=Diagnoza%20FNP">
          Napisz do Fundacji
        </a>
        <p className="field-hint" style={{ marginTop: 6 }}>Otworzy się Twoja poczta. Nie dołączamy danych z kalkulatora.</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12, marginTop: 18 }}>
        <div style={{ flex: "1 1 220px", maxWidth: 360, minWidth: 0 }}>
          <label htmlFor="companyName" className="field-hint" style={{ display: "block" }}>Nazwa firmy na wydruku (opcjonalnie)</label>
          <input id="companyName" className="num-input" type="text" maxLength={120} value={params.companyName} autoComplete="off"
            onChange={(event) => up("companyName", event.target.value)} style={{ fontSize: 16, fontWeight: 400, marginTop: 4, padding: "0 10px", border: "1px solid var(--l-rule)", background: "#fff" }} />
        </div>
        <button type="button" className="fnp-btn ghost" disabled={!ready} onClick={() => window.print()}>
          Drukuj lub zapisz PDF
        </button>
      </div>
      <details id="safe-space" className="fold" style={{ marginTop: 22 }}>
        <summary>Model Safe Space: od wyniku do działań</summary>
        <SafeSpaceConcept />
      </details>
    </section>
  );
}
