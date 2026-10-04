// The one bold element. The orange area is proportional to the cost: the
// amount divided by what the same firm would pay at climate 0. Radius is the
// square root of that share, so a half-size cost is half the area. The blue
// ring marks the climate-0 outline and stays visible even when the cost is 0.
// Decorative for screen readers; the caption next to it carries the number.
import { discScale } from "../disc.js";


export default function Disc({ share, className = "disc" }) {
  const scale = discScale(share);
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle className="disc-fill" cx="50" cy="50" r="48" style={{ transform: `scale(${scale})` }} />
      <circle className="disc-ring" cx="50" cy="50" r="48" />
    </svg>
  );
}
