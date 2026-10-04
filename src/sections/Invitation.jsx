import { CHANNEL_COPY, splitChannel } from "../channels.js";
import { INPUT_FIELDS } from "../inputs.js";
import { money, share, sensitivitySentence } from "../format.js";

export default function Invitation({ params, valuation, sensitivity }) {
  const total = valuation?.total;
  const name = params.companyName?.trim() || "Organizacja bez nazwy";
  return (
    <div className="invitation-print-only">
      <p>Fundacja Nowe Przestrzenie × Paweł Mamcarz</p>
      <h2>Kalkulator Rezyliencji FNP</h2>
      <p style={{ overflowWrap: "anywhere" }}>{name}</p>
      <p>Scenariusz roczny · tryb ostrożny · szacunek własny, nie pomiar</p>
      {total ? <>
        <p className="print-amount">Wariant bazowy: {money(total.base)}</p>
        <p>Zakres P10–P90: {money(total.low)} – {money(total.high)}</p>
        {sensitivitySentence(sensitivity) && <p>{sensitivitySentence(sensitivity)}</p>}
        <p>{params.revenue > 0 ? `${share(total.base / params.revenue)} przychodów` : "Udział w przychodach: nie obliczamy przy 0 zł"}</p>
        <h3>Dane wejściowe</h3>
        <ul style={{ paddingLeft: 18 }}>
          {INPUT_FIELDS.map((field) => <li key={field.key}>{field.label}: {Number(params[field.key]).toLocaleString("pl-PL")} {field.unit}</li>)}
          <li>Klimat organizacji: {params.safety}/100, szacunek własny</li>
        </ul>
        <h3>Obszary</h3>
        <ol style={{ paddingLeft: 18 }}>
          {valuation.channels.map((channel) => {
            const split = splitChannel(channel);
            return <li key={channel.id}>{CHANNEL_COPY[channel.id]?.title}: {split.inSum ? money(split.headline) : "poza sumą"}</li>;
          })}
        </ol>
        <p style={{ marginTop: 18 }}>Wynik to nadwyżka względem modelowego klimatu 100/100. Nie jest wyceną księgową, prognozą, oszacowaniem przyczynowym ani obietnicą oszczędności. Nie należy ponownie odejmować go od zysku.</p>
        <p style={{ marginTop: 10 }}>Zakres obejmuje środkowe 80% symulowanych kosztów przy założeniach autora, nie przedział ufności z badania. Efekt mrożenia opisuje mechanizm milczenia, bez osobnej kwoty. Kontekst Ipsos × FNP 2026 nie oznacza zakończonej kalibracji.</p>
      </> : <p style={{ marginTop: 20 }}>Brak wyniku: uzupełnij lub popraw pola danych w kalkulatorze.</p>}
      <p style={{ marginTop: 18 }}>Kontakt w sprawie diagnozy FNP: zapraszamy@noweprzestrzenie.pl</p>
      <p style={{ marginTop: 12, fontSize: 11 }}>Metodologia: https://fnp.silence-tax.com/#jak-liczymy<br />silnik: Silence Tax · wersja {__APP_VERSION__} · kompilacja {__BUILD_DATE__}</p>
    </div>
  );
}
