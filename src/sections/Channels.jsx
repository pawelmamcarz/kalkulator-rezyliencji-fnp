import { CHANNEL_COPY, splitChannel } from "../channels.js";
import { TURNOVER_CLIMATE_WEIGHT } from "../logic/constants.js";
import { fnpTurnoverClimateShare } from "../fnpModel.js";
import { money, plNumber, share } from "../format.js";

export default function Channels({ valuation, params }) {
  const channels = valuation?.channels || [];

  return (
    <section id="obszary" aria-labelledby="obszary-title">
      <h3 id="obszary-title">Pięć obszarów wyniku, trzy w sumie</h3>
      <p>
        Sumujemy scenariusze rotacji, błędów i wypalenia. Badania uzasadniają rozważanie tych mechanizmów,
        ale ich przeliczniki pieniężne nadal są założeniami autora. Innowacje i koordynacja pozostają poza sumą.
      </p>

      <div style={{ marginTop: 20 }}>
        {channels.map((channel, index) => {
          const copy = CHANNEL_COPY[channel.id];
          const split = splitChannel(channel);
          const inSum = split.inSum;
          return (
            <article
              key={channel.id}
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: "8px 24px",
                padding: "18px 0",
                borderTop: "1px solid var(--hairline)",
              }}
            >
              <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                <h4 style={{ margin: 0 }}>{index + 1}. {copy?.title || channel.id}</h4>
                <p style={{ margin: "6px 0" }}>
                  {copy?.image}
                </p>
                <p className="muted">{copy?.body}</p>
                {channel.id === "continuity" && valuation && (
                  <p className="small muted" style={{ marginTop: 8 }}>
                    Zadeklarowana rotacja: {plNumber(params.turnoverPct)}%. Model przypisuje klimatowi część odejść z Twojej firmy: przy klimacie {params.safety}/100 jest to {share(fnpTurnoverClimateShare(params.safety))} według krzywej modelu, a do kwoty wlicza tę część z wagą {plNumber(TURNOVER_CLIMATE_WEIGHT)}. Kwota rośnie proporcjonalnie do zadeklarowanej rotacji, a przy klimacie 100/100 wynosi zero. Szczegóły opisujemy niżej, w założeniach autora.
                  </p>
                )}
              </div>
              <div>
                <div className="num" style={{ fontSize: inSum ? 20 : 17, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {inSum ? money(split.headline) : "poza sumą"}
                </div>
                {!inSum && (
                  <div className="small muted" style={{ marginTop: 4 }}>
                    opis, bez kwoty w głównej liczbie
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <p className="small muted" style={{ marginTop: 16 }}>
        {valuation ? "Kwoty w obszarach dotyczą wariantu bazowego. Są zaokrąglane do prezentacji, więc ich widoczna suma może nieznacznie różnić się od zaokrąglonego wyniku." : "Uzupełnij poprawne dane, aby zobaczyć kwoty w pięciu obszarach."}
      </p>
    </section>
  );
}
