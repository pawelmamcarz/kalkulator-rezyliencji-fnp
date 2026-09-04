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
        num="OBSZARY"
        title="Co składa się na wynik"
        kicker="Pięć obszarów, trzy w sumie"
      />
      <p style={{ fontFamily: "var(--serif)", fontSize: 17, lineHeight: 1.6, maxWidth: 820, marginTop: 22 }}>
        Sumujemy scenariusze rotacji, błędów i wypalenia. Badania uzasadniają rozważanie tych mechanizmów,
        ale ich przeliczniki pieniężne nadal są założeniami autora. Innowacje i koordynacja pozostają poza sumą.
      </p>

      <div style={{ marginTop: 24, borderTop: "2px solid var(--l-rule)" }}>
        {channels.map((channel, index) => {
          const copy = CHANNEL_COPY[channel.id];
          const split = splitChannel(channel);
          const inSum = split.inSum;
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
                    Zadeklarowana rotacja: {params.turnoverPct}%. Model łączy założenie związane z klimatem i nadwyżkę ponad punkt odniesienia 14,8%, z wagami 50/50. Liczbę odejść ogranicza deklaracja. Pochodzenie punktu odniesienia opisujemy w metodologii.
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
        {valuation ? "Kwoty w obszarach dotyczą wariantu bazowego. Są zaokrąglane do prezentacji, więc ich widoczna suma może nieznacznie różnić się od zaokrąglonego wyniku." : "Uzupełnij poprawne dane, aby zobaczyć kwoty w pięciu obszarach."}
      </p>
    </section>
  );
}
