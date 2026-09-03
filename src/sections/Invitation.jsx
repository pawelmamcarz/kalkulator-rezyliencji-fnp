import { fmtCurrencyCompact as fmt } from "../logic.js";
import { CHANNEL_COPY, splitChannel } from "../channels.js";

export default function Invitation({ params, valuation }) {
  const total = valuation?.total;
  const money = (n) => fmt(n, "PLN", "pl");
  const name = params.companyName?.trim() || "Twoja organizacja";

  return (
    <div className="invitation-print-only" aria-hidden="true">
      <div className="micro">Fundacja Nowe Przestrzenie × Paweł Mamcarz</div>
      <h1 style={{ fontFamily: "var(--mono)", fontSize: 28, textTransform: "uppercase", margin: "12px 0 8px" }}>
        Zaproszenie do rozmowy
      </h1>
      <p style={{ fontFamily: "var(--serif)", fontSize: 16, marginBottom: 18 }}>
        Kalkulator Rezyliencji FNP · scenariusz skali, nie wycena księgowa
      </p>
      <p style={{ fontFamily: "var(--mono)", fontSize: 14 }}>{name}</p>
      {total && (
        <p style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, margin: "12px 0 20px" }}>
          {money(total.low)} – {money(total.high)}
          <span style={{ display: "block", fontSize: 12, fontWeight: 400, marginTop: 4 }}>
            wariant bazowy {money(total.base)} · tryb ostrożny
          </span>
        </p>
      )}
      <ol style={{ paddingLeft: 18, lineHeight: 1.6 }}>
        {(valuation?.channels || []).map((channel) => {
          const split = splitChannel(channel);
          return (
            <li key={channel.id}>
              {CHANNEL_COPY[channel.id]?.title}: {split.headline > 0 ? money(split.headline) : "poza sumą"}
            </li>
          );
        })}
      </ol>
      <p style={{ marginTop: 22, fontSize: 14, lineHeight: 1.5 }}>
        Chcesz realny pomiar zamiast scenariusza? Diagnoza FNP.
        Kontakt: pawel@mamcarz.com
      </p>
      <p className="micro" style={{ marginTop: 28 }}>
        Silnik: Silence Tax · {__APP_VERSION__} · badania publiczne, założenia autorskie, kontekst Ipsos × FNP 2026
      </p>
    </div>
  );
}
