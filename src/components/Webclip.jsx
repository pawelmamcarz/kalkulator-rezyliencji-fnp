import { useState } from "react";
import { CLIMATE_ANCHORS } from "../channels.js";
import { computeFnpAnalysis } from "../fnpModel.js";
import { DEFAULT_PARAMS } from "../inputs.js";
import { money } from "../format.js";
import "../embed.css";

export default function Webclip() {
  const [safety, setSafety] = useState(DEFAULT_PARAMS.safety);
  const { valuation } = computeFnpAnalysis({ ...DEFAULT_PARAMS, safety });

  return (
    <main className="webclip">
      <h1>Ile może kosztować milczenie?</h1>
      <label htmlFor="climate">Jak mówi się o problemach w zespole?</label>
      <select id="climate" value={safety} onChange={(event) => setSafety(Number(event.target.value))}>
        <option value={DEFAULT_PARAMS.safety}>Wybierz opis zespołu</option>
        {CLIMATE_ANCHORS.map(({ at, label }) => <option key={at} value={at}>{label}</option>)}
      </select>
      <div className="webclip-result">
        <output htmlFor="climate"><strong>{money(valuation.total.base)}</strong> rocznie</output>
        <span>Przykładowa firma · scenariusz</span>
      </div>
      <a href="https://fnp.silence-tax.com/" target="_blank" rel="noopener">Policz dla swojej firmy</a>
    </main>
  );
}
