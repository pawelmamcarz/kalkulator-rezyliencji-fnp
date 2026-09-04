import { fmtCurrencyCompact as fmt } from "../logic/format.js";
import LedgerSectionHeading from "../components/LedgerSectionHeading.jsx";

export default function Result({ valuation, params }) {
  const total = valuation?.total;
  const ofRevenue = total && params.revenue > 0 ? total.base / params.revenue : null;
  const pct = ofRevenue === null ? null : new Intl.NumberFormat("pl-PL", { style: "percent", maximumFractionDigits: 1 }).format(ofRevenue);
  const profit = params.revenue - params.costs;
  return (
    <section id="wynik" style={{ padding: "40px 0" }}>
      <LedgerSectionHeading num="KROK 2" title="Roczny scenariusz kosztu" kicker="Tryb ostrożny" />
      <div role="status" aria-live="polite" aria-atomic="true" style={{ padding: "24px 0", borderBottom: "1px solid var(--l-rule)" }}>
        {total ? <>
          <p className="micro">Wariant bazowy</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: "clamp(30px, 5vw, 48px)", fontWeight: 700 }}>{fmt(total.base, "PLN", "pl")}</p>
          <p>{pct !== null ? `${pct} zadeklarowanych przychodów rocznych.` : "Przychody wynoszą 0 zł, więc udziału procentowego nie obliczamy."}</p>
          <p style={{ marginTop: 14, fontFamily: "var(--mono)" }}>Zakres P10–P90: {fmt(total.low, "PLN", "pl")} – {fmt(total.high, "PLN", "pl")}</p>
        </> : <p>Uzupełnij lub popraw oznaczone pola w danych organizacji. Wynik będzie dostępny po wpisaniu poprawnych wartości.</p>}
      </div>
      {total && <div style={{ marginTop: 18, maxWidth: 820 }}>
        <p>To nadwyżka względem modelowego klimatu 100/100, po korektach i zsumowaniu trzech obszarów. Zakres obejmuje środkowe 80% symulowanych kosztów. Nie jest przedziałem ufności z badania ani dolną i górną granicą możliwej straty.</p>
        {params.safety === 100 && <p style={{ marginTop: 12 }}>Przy 100/100 nadwyżka wynosi zero z definicji modelu. Nie oznacza to braku błędów, odejść ani wypalenia.</p>}
        {params.avgSalary === 0 && <p style={{ marginTop: 12 }}>Przy płacy 0 zł koszty rotacji i wypalenia są zerowe. Błędy mają oddzielne koszty zdarzeń, więc nadal mogą zwiększać wynik.</p>}
        {profit > 0 && params.revenue > 0 && <p style={{ marginTop: 12 }}>Zadeklarowana różnica przychodów i kosztów to {fmt(profit, "PLN", "pl")}. Scenariusz odpowiada {new Intl.NumberFormat("pl-PL", { style: "percent", maximumFractionDigits: 1 }).format(total.base / profit)} tej różnicy. To porównanie skali, kwoty nie należy ponownie odejmować od zysku.</p>}
        {profit <= 0 && <p style={{ marginTop: 12 }}>Koszty są równe przychodom lub od nich wyższe. Nie przeliczamy scenariusza na udział w dodatnim zysku.</p>}
        <p style={{ marginTop: 12 }}><a href="#metodologia">Sprawdź założenia i sposób liczenia</a> lub <a href="#dane">zmień dane</a>.</p>
      </div>}
    </section>
  );
}
