import { fmtCurrencyCompact as fmt } from "../logic.js";
import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";
import Redact from "../components/Redact.jsx";

export default function Hero({ valuation, params }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const total = valuation?.total;
  const ofRevenue = params.revenue > 0 && total ? total.base / params.revenue : 0;
  const profit = params.revenue - params.costs;
  const margin = params.revenue > 0 ? profit / params.revenue : 0;
  const monthsOfProfit = profit > 0 && total ? total.base / (profit / 12) : 0;
  const pctLabel = `${Math.round(ofRevenue * 1000) / 10}%`;

  let scaleNote = "W trybie ostrożnym zwykle wychodzi kilka procent przychodu. Dla wielu firm to cała marża. To scenariusz skali, nie pozycja w księgach.";
  if (ofRevenue > 0.05) {
    scaleNote = `Tu wychodzi ${pctLabel} przychodu. To rząd wielkości, nie pozycja w księgach. Kilka procent przychodu często zjada całą marżę.`;
  }
  if (margin > 0 && ofRevenue > margin) {
    scaleNote += " Liczba przekracza zadeklarowaną marżę.";
  } else if (monthsOfProfit >= 6) {
    scaleNote += ` To mniej więcej ${Math.round(monthsOfProfit)} miesięcy zadeklarowanego zysku.`;
  }

  return (
    <section style={{ padding: isMobile ? "32px 0 40px" : "48px 0 56px" }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.25fr 1fr", gap: 40 }}>
        <div>
          <div className="micro">Scenariusz skali, nie wycena księgowa</div>
          <h1 style={{
            fontFamily: "var(--mono)",
            fontSize: "clamp(34px, 5vw, 64px)",
            lineHeight: 0.98,
            letterSpacing: 0,
            textTransform: "uppercase",
            margin: "10px 0 20px",
          }}>
            Ile Twoja organizacja traci na <Redact>milczeniu</Redact>?
          </h1>
          <p style={{ fontFamily: "var(--serif)", fontSize: 18, lineHeight: 1.55, maxWidth: 640 }}>
            Wpisujesz dane, które firma zna z głowy, i oceniasz klimat.
            Kalkulator pokazuje, ile to może kosztować w roku. Potem jest miejsce na diagnozę FNP.
          </p>
        </div>
        <div style={{ borderTop: "3px solid var(--l-ink)", borderBottom: "1px solid var(--l-rule)", padding: "22px 0" }}>
          <div className="micro">Roczny scenariusz kosztu · tryb ostrożny</div>
          {total ? (
            <>
              <div style={{ fontFamily: "var(--mono)", fontSize: isMobile ? 28 : 34, fontWeight: 700, marginTop: 12 }}>
                {fmt(total.low, "PLN", "pl")} – {fmt(total.high, "PLN", "pl")}
              </div>
              <div className="micro" style={{ marginTop: 8 }}>
                wariant bazowy: {fmt(total.base, "PLN", "pl")}
                {ofRevenue > 0 ? ` · ${pctLabel} przychodów` : ""}
              </div>
              <p style={{ fontFamily: "var(--serif)", fontSize: 14, lineHeight: 1.5, marginTop: 14, color: "var(--l-ink-2)" }}>
                {scaleNote}
              </p>
            </>
          ) : (
            <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, marginTop: 12 }}>
              Uzupełnij dane
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
