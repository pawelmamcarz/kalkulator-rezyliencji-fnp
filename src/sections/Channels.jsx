import { fmtCurrencyCompact as fmt } from "../logic.js";
import LedgerSectionHeading from "../components/LedgerSectionHeading.jsx";
import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";
import { CHANNEL_COPY, splitChannel } from "../channels.js";

export default function Channels({ valuation, params }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const channels = valuation?.channels || [];
  const money = (n) => fmt(n, "PLN", "pl");

  return (
    <section id="obszary" style={{ padding: "48px 0" }}>
      <LedgerSectionHeading
        num="KROK 2"
        title="Pięć obszarów strat"
        kicker="Główna liczba = rdzeń scenariusza"
      />
      <p style={{ fontFamily: "var(--serif)", fontSize: 17, lineHeight: 1.6, maxWidth: 820, marginTop: 22 }}>
        Tryb ostrożny wlicza do głównej liczby tylko moduły rdzenia: rotację, błędy i wypalenie.
        Pozostałe obszary zostają widoczne jako potencjał po walidacji, nie jako obietnica.
      </p>

      <div style={{ marginTop: 24, borderTop: "2px solid var(--l-rule)" }}>
        {channels.map((channel, index) => {
          const copy = CHANNEL_COPY[channel.id];
          const split = splitChannel(channel);
          return (
            <article
              key={channel.id}
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "52px 1.6fr 1fr",
                gap: 16,
                padding: "22px 0",
                borderBottom: "1px solid var(--l-rule)",
                alignItems: "start",
              }}
            >
              <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong style={{ fontFamily: "var(--serif)", fontSize: 20 }}>{copy?.title || channel.id}</strong>
                <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", margin: "8px 0 6px", lineHeight: 1.45 }}>
                  {copy?.image}
                </p>
                <p style={{ fontFamily: "var(--serif)", lineHeight: 1.5, color: "var(--l-ink-2)" }}>{copy?.body}</p>
                {channel.id === "continuity" && (
                  <p className="micro" style={{ marginTop: 8 }}>
                    Twoja zadeklarowana rotacja: {params.turnoverPct}%. Model liczy nadwyżkę względem klimatu, nie wkleja tej stawki 1:1.
                  </p>
                )}
              </div>
              <div style={{ textAlign: isMobile ? "left" : "right" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700 }}>
                  {money(split.headline)}
                </div>
                {split.pending > 0 && (
                  <div className="micro" style={{ marginTop: 6 }}>
                    w walidacji: +{money(split.pending)}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <p className="micro" style={{ marginTop: 16, lineHeight: 1.55 }}>
        Zakres P10–P90 w nagłówku pochodzi z Monte Carlo na module rdzenia. To prior strukturalny, nie empiryczny przedział ufności.
        Parametry bez kalibracji empirycznej są w silniku oznaczone jako założenia autorskie.
      </p>
    </section>
  );
}
