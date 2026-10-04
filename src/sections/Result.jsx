import LedgerSectionHeading from "../components/LedgerSectionHeading.jsx";
import { CHANNEL_COPY, splitChannel } from "../channels.js";
import { money, share as percent, sensitivitySentence } from "../format.js";

export default function Result({ valuation, params, sensitivity }) {
  const total = valuation?.total;
  const profit = params.revenue - params.costs;
  const channels = (valuation?.channels || []).map((channel) => ({ id: channel.id, copy: CHANNEL_COPY[channel.id], split: splitChannel(channel) }));
  const inSum = channels.filter((channel) => channel.split.inSum);
  const outside = channels.filter((channel) => !channel.split.inSum);
  return (
    <section id="wynik" style={{ padding: "28px 0" }}>
      <LedgerSectionHeading num="Krok 2" title="Wynik" />
      <div role="status" aria-live="polite" aria-atomic="true" style={{ padding: "18px 0", borderBottom: "1px solid var(--l-rule)" }}>
        {total ? <>
          <p className="micro">Roczny scenariusz kosztów</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: "clamp(30px, 5vw, 48px)", fontWeight: 700, lineHeight: 1.2 }}>{money(total.base)}</p>
          <p style={{ fontFamily: "var(--mono)", marginTop: 6 }}>Zakres: od {money(total.low)} do {money(total.high)}</p>
          {sensitivitySentence(sensitivity) && <p id="wrazliwosc" style={{ marginTop: 6 }}>{sensitivitySentence(sensitivity)}</p>}
          <p style={{ marginTop: 10 }}>
            {params.revenue > 0 ? `To ${percent(total.base / params.revenue)} rocznych przychodów.` : "Przychody wynoszą 0 zł, więc nie liczymy udziału w przychodach."}
            {profit > 0 && params.revenue > 0 && ` To także ${percent(total.base / profit)} różnicy między przychodami a kosztami (${money(profit)}).`}
          </p>
          {profit <= 0 && <p style={{ marginTop: 8 }}>Koszty nie są niższe od przychodów, więc nie porównujemy wyniku z marżą.</p>}
          {params.safety === 100 && <p style={{ marginTop: 8 }}>Przy 100/100 nadwyżka wynosi zero z definicji modelu. Nie oznacza to braku błędów, odejść ani wypalenia.</p>}
          {params.avgSalary === 0 && <p style={{ marginTop: 8 }}>Przy płacy 0 zł koszty rotacji i wypalenia są zerowe. Błędy mają oddzielne koszty zdarzeń, więc nadal mogą zwiększać wynik.</p>}
        </> : <p>Uzupełnij lub popraw oznaczone pola w danych firmy. Wtedy pokażemy wynik.</p>}
      </div>
      {total && <>
        <h3 style={{ fontSize: 18, margin: "18px 0 4px" }}>Co składa się na kwotę</h3>
        <ul style={{ listStyle: "none" }}>
          {inSum.map(({ id, copy, split }) => (
            <li key={id} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "2px 16px", padding: "10px 0", borderBottom: "1px solid var(--l-grid)" }}>
              <span style={{ flex: "1 1 280px", minWidth: 0 }}><strong>{copy?.title}.</strong> {copy?.short}</span>
              <span style={{ fontFamily: "var(--mono)", fontWeight: 700, whiteSpace: "nowrap" }}>{money(split.headline)}</span>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 10 }}>Poza sumą, bez kwoty: {outside.map(({ copy }) => copy?.title).join(" oraz ")}.</p>
        <p style={{ marginTop: 14, maxWidth: 820, borderLeft: "3px solid var(--l-accent)", paddingLeft: 14 }}>
          To scenariusz przy założeniach autora, a nie wycena księgowa, prognoza, dowód przyczyny ani obietnica oszczędności. <a href="#jak-liczymy">Jak to liczymy</a>
        </p>
      </>}
    </section>
  );
}
