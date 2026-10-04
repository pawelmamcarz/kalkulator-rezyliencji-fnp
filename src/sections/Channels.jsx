import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";
import { CHANNEL_COPY, splitChannel } from "../channels.js";
import { TURNOVER_CLIMATE_WEIGHT } from "../logic/constants.js";
import { fnpTurnoverClimateShare } from "../fnpModel.js";
import { money, plNumber, share } from "../format.js";

export default function Channels({ valuation, params }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const channels = valuation?.channels || [];

  return (
    <section id="obszary" aria-labelledby="obszary-title">
      <h3 id="obszary-title">Pięć obszarów wyniku, trzy w sumie</h3>
      <p style={{ fontFamily: "var(--serif)", fontSize: 17, lineHeight: 1.6, maxWidth: 820 }}>
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
                <h4 style={{ fontFamily: "var(--serif)", fontSize: 20, margin: 0 }}>{copy?.title || channel.id}</h4>
                <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", margin: "8px 0 6px", lineHeight: 1.45 }}>
                  {copy?.image}
                </p>
                <p style={{ fontFamily: "var(--serif)", lineHeight: 1.5, color: "var(--l-ink-2)" }}>{copy?.body}</p>
                {channel.id === "continuity" && valuation && (
                  <p className="micro" style={{ marginTop: 8 }}>
                    Zadeklarowana rotacja: {plNumber(params.turnoverPct)}%. Model przypisuje klimatowi część odejść z Twojej firmy: przy klimacie {params.safety}/100 jest to {share(fnpTurnoverClimateShare(params.safety))} według krzywej modelu, a do kwoty wlicza tę część z wagą {plNumber(TURNOVER_CLIMATE_WEIGHT)}. Kwota rośnie proporcjonalnie do zadeklarowanej rotacji, a przy klimacie 100/100 wynosi zero. Szczegóły opisujemy niżej, w założeniach autora.
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
