import { CHANNEL_COPY, splitChannel } from "../channels.js";
import { money, share as percent } from "../format.js";

// "Co składa się na kwotę": the three areas in the sum, the two outside it,
// the share of revenue and the one caveat sentence.
export default function Result({ valuation, params }) {
  const total = valuation?.total;
  const profit = params.revenue - params.costs;
  const channels = (valuation?.channels || []).map((channel) => ({ id: channel.id, copy: CHANNEL_COPY[channel.id], split: splitChannel(channel) }));
  const inSum = channels.filter((channel) => channel.split.inSum);
  const outside = channels.filter((channel) => !channel.split.inSum);
  return (
    <section id="wynik" className="b-areas block" aria-labelledby="wynik-tytul">
      <h2 id="wynik-tytul">Co składa się na kwotę</h2>
      {total ? <>
        <ul className="areas">
          {inSum.map(({ id, copy, split }) => (
            <li key={id}>
              <span><strong>{copy?.title}.</strong> <span className="muted">{copy?.short}</span></span>
              <span className="area-amount num">{money(split.headline)}</span>
            </li>
          ))}
        </ul>
        <p className="areas-more small">Poza sumą, bez kwoty: {outside.map(({ copy }) => copy?.title).join(" oraz ")}.</p>
        <p className="small num" style={{ marginTop: 10 }}>
          {params.revenue > 0 ? `To ${percent(total.base / params.revenue)} rocznych przychodów.` : "Przychody wynoszą 0 zł, więc nie liczymy udziału w przychodach."}
          {profit > 0 && params.revenue > 0 && ` To także ${percent(total.base / profit)} różnicy między przychodami a kosztami (${money(profit)}).`}
        </p>
        {profit <= 0 && <p className="small" style={{ marginTop: 6 }}>Koszty nie są niższe od przychodów, więc nie porównujemy wyniku z marżą.</p>}
        {params.safety === 100 && <p className="small" style={{ marginTop: 6 }}>Przy 100/100 nadwyżka wynosi zero z definicji modelu. Nie oznacza to braku błędów, odejść ani wypalenia.</p>}
        {params.avgSalary === 0 && <p className="small" style={{ marginTop: 6 }}>Przy płacy 0 zł koszty rotacji i wypalenia są zerowe. Błędy mają oddzielne koszty zdarzeń, więc nadal mogą zwiększać wynik.</p>}
        <p className="caveat small">
          To scenariusz przy założeniach autora, a nie wycena księgowa, prognoza, dowód przyczyny ani obietnica oszczędności. <a href="#jak-liczymy">Jak to liczymy</a>
        </p>
      </> : <p style={{ marginTop: 10 }}>Uzupełnij lub popraw oznaczone pola w danych firmy. Wtedy pokażemy wynik.</p>}
    </section>
  );
}
