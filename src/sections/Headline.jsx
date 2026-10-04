import Disc from "../components/Disc.jsx";
import { discShare } from "../disc.js";
import { money, moneyRange } from "../format.js";

const PERCENT = new Intl.NumberFormat("pl-PL", { style: "percent", maximumFractionDigits: 0 });

// "3,15 mln zł" -> ["3,15 mln", "zł"], so the unit can be set smaller.
const split = (text) => {
  const at = text.lastIndexOf("zł");
  return at > 0 ? [text.slice(0, at).trim(), "zł"] : [text, ""];
};

// Disc, amount, range and one caption. The label says whose numbers these are.
export default function Headline({ valuation, worst, label = "Przykładowa firma" }) {
  const total = valuation?.total;
  if (!total) {
    return (
      <div className="disc-block" id="wynik-kwota">
        <Disc share={0} />
        <p>Popraw oznaczone pola w danych firmy. Wtedy pokażemy kwotę.</p>
      </div>
    );
  }
  const share = discShare(total.base, worst);
  const [amount, unit] = split(money(total.base));
  return (
    <div className="disc-block" id="wynik-kwota">
      <Disc share={share} />
      <div>
        <p className="disc-label">{label}</p>
        <p className="disc-amount num">{amount}{"\u00a0"}{unit}</p>
        <p className="disc-range num">{total.high > 0 ? `rocznie, ${moneyRange(total.low, total.high)}` : "rocznie, przy klimacie 100/100"}</p>
      </div>
      <p className="disc-notes small num">Koło to {PERCENT.format(share)} kwoty przy najniższej ocenie klimatu.</p>
    </div>
  );
}
