import LedgerSectionHeading from "../components/LedgerSectionHeading.jsx";
import Limitations from "./Limitations.jsx";
import Channels from "./Channels.jsx";
import Methodology from "./Methodology.jsx";
import Context from "./Context.jsx";

// Everything beyond form, result and next step. Native <details> keeps the
// full text in the prerendered HTML for crawlers and visitors without JS.
export default function HowWeCalculate({ valuation, params }) {
  return (
    <section id="jak-liczymy" aria-labelledby="jak-liczymy-title" style={{ padding: "28px 0" }}>
      <LedgerSectionHeading num="Szczegóły" title="Jak to liczymy" titleId="jak-liczymy-title" />
      <details className="fold howto" style={{ marginTop: 14 }}>
        <summary>Założenia, badania, ograniczenia i źródła</summary>
        <div className="methodology">
          <p>Rezyliencja to zdolność organizacji do reagowania na trudności i uczenia się. Ten kalkulator opisuje jeden jej aspekt: warunki, w których pracownicy zabierają głos.</p>
          <Limitations />
          <Channels valuation={valuation} params={params} />
          <Methodology />
          <Context />
        </div>
      </details>
    </section>
  );
}
