import SafeSpaceConcept from "./SafeSpaceConcept.jsx";

export default function NextSteps({ ready, params, up }) {
  return (
    <section id="dalej" className="b-next block" aria-labelledby="dalej-tytul">
      <h2 id="dalej-tytul">Co dalej</h2>
      <p style={{ marginTop: 8 }}>
        Liczba pokazuje skalę, ale nie mówi, co zmienić. To sprawdza diagnoza Fundacji Nowe Przestrzenie, a działania dobiera się dopiero po niej.
      </p>
      <div className="next-actions">
        <a className="btn primary" href="mailto:zapraszamy@noweprzestrzenie.pl?subject=Diagnoza%20FNP">Napisz do Fundacji</a>
      </div>
      <p className="field-hint" style={{ marginTop: 8 }}>Otworzy się Twoja poczta. Nie dołączamy danych z kalkulatora.</p>
      <div className="print-row">
        <div style={{ flex: "1 1 220px", maxWidth: 360, minWidth: 0 }}>
          <label htmlFor="companyName" className="field-hint" style={{ display: "block" }}>Nazwa firmy na wydruku (opcjonalnie)</label>
          <input id="companyName" className="num-input" type="text" maxLength={120} value={params.companyName} autoComplete="off"
            onChange={(event) => up("companyName", event.target.value)} style={{ marginTop: 4 }} />
        </div>
        <button type="button" className="btn" disabled={!ready} onClick={() => window.print()}>Drukuj lub zapisz PDF</button>
      </div>
      <details id="safe-space" className="fold" style={{ marginTop: 24 }}>
        <summary>Model Safe Space: od wyniku do działań</summary>
        <SafeSpaceConcept />
      </details>
    </section>
  );
}
