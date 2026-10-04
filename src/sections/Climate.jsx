import ClimateStops from "../components/ClimateStops.jsx";
import { climateAnchor } from "../channels.js";
import { sensitivityShort } from "../format.js";

// The instrument: five sentences, then the fine slider, then the
// own-estimate line the contract requires.
export default function Climate({ safety, up, sensitivity }) {
  const anchor = climateAnchor(safety);
  return (
    <section id="klimat" className="b-climate" aria-labelledby="klimat-pytanie">
      <h2 id="klimat-pytanie" className="climate-q">
        <label htmlFor="safety">Jak bezpiecznie jest u Was zgłosić problem albo przyznać się do błędu?</label>
      </h2>
      <ClimateStops safety={safety} onPick={(value) => up("safety", value)} labelledBy="klimat-pytanie" />
      <p className="climate-fine-label" aria-hidden="true">Dokładniej, od 0 do 100</p>
      <div className="climate-fine">
        <input id="safety" type="range" min={0} max={100} step={1} value={safety}
          aria-describedby="climate-help climate-anchor" aria-valuetext={`${safety} na 100. ${anchor.label}`}
          onChange={(event) => up("safety", Number(event.target.value))} />
        <span className="climate-value num" aria-hidden="true">{safety}/100</span>
      </div>
      {sensitivityShort(sensitivity) && <p id="wrazliwosc" className="small num">{sensitivityShort(sensitivity)}</p>}
      <span id="climate-anchor" className="sr-only">{anchor.label}</span>
      <p id="climate-help" className="climate-note small muted">To szacunek własny, nie pomiar.</p>
    </section>
  );
}
