import { CLIMATE_ANCHORS, climateAnchor } from "../channels.js";

// The five behavioural sentences as labelled stops of the one 0–100 scale.
// Each sets the climate to its anchor value; the stop whose band holds the
// current value is pressed (inverted row plus bold, announced by aria-pressed).
// No hooks, so tests can call it directly.
export default function ClimateStops({ safety, onPick, labelledBy }) {
  const current = climateAnchor(safety).at;
  return (
    <div role="group" aria-labelledby={labelledBy} className="climate-anchors">
      {CLIMATE_ANCHORS.map((item) => (
        <button key={item.at} type="button" className={`climate-stop${item.at === current ? " on" : ""}`} aria-pressed={item.at === current}
          onClick={() => onPick(item.at)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
