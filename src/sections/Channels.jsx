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
        kicker="Główna liczba = rotacja, błędy, wypalenie"
      />
      <p style={{ fontFamily: "var(--serif)", fontSize: 17, lineHeight: 1.6, maxWidth: 820, marginTop: 22 }}>
        Do sumy wchodzą trzy pozycje, które da się obronić liczbami: rotacja, błędy i wypalenie.
        Innowacje i hierarchia są opisane, ale bez złotówek w głównej liczbie.
      </p>

      <div style={{ marginTop: 24, borderTop: "2px solid var(--l-rule)" }}>
        {channels.map((channel, index) => {
          const copy = CHANNEL_COPY[channel.id];
          const split = splitChannel(channel);
          const inSum = split.headline > 0;
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
                    Wpisałeś rotację {params.turnoverPct}%. Scenariusz miesza to z klimatem i ze średnią GUS (14,8%). Nie doliczy więcej odejść, niż wynika z Twojej stawki.
                  </p>
                )}
              </div>
              <div style={{ textAlign: isMobile ? "left" : "right" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: inSum ? 22 : 16, fontWeight: 700 }}>
                  {inSum ? money(split.headline) : "poza sumą"}
                </div>
                {!inSum && (
                  <div className="micro" style={{ marginTop: 6 }}>
                    opis, bez kwoty w głównej liczbie
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <p className="micro" style={{ marginTop: 16, lineHeight: 1.55 }}>
        Pasmo w nagłówku to Monte Carlo na rotacji, błędach i wypaleniu. Rozrzut założeń, nie przedział ufności z badania.
      </p>
    </section>
  );
}
