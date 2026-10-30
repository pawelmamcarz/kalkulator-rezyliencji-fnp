import ClimateStops from "../components/ClimateStops.jsx";
import { climateAnchor } from "../channels.js";
import { sensitivityShort } from "../format.js";
import NumberField from "../components/NumberField.jsx";

// The instrument: five sentences, then the fine slider, then the
// own-estimate line the contract requires.
export default function Climate({ safety, up, sensitivity, params = {}, errors = {} }) {
  const survey = params.safetySource === "survey";
  const anchor = climateAnchor(safety);
  return (
    <section id="klimat" className="b-climate" aria-label="Ocena klimatu organizacji">
      <fieldset className="climate-source">
        <legend>Skąd pochodzi ocena klimatu?</legend>
        <label><input type="radio" name="safetySource" checked={!survey} onChange={() => up("safetySource", "estimate")} /> Szybki szacunek</label>
        <label><input type="radio" name="safetySource" checked={survey} onChange={() => up("safetySource", "survey")} /> Mam wynik badania</label>
      </fieldset>
      {survey ? <div className="survey-inputs">
        <p className="small muted" id="survey-help">Wpisz wynik tylko, jeśli jego skala jest zgodna z oceną klimatu w tym modelu: 0 oznacza najniższe, a 100 najwyższe bezpieczeństwo zgłaszania problemów. Samo przeliczenie procentu ani potwierdzenie poniżej nie dowodzi zgodności. Porównaj pytania, znaczenie wyniku i sposób przeliczenia z oceną zgłaszania problemów w tym modelu. Kalkulator tego nie weryfikuje i nie importuje danych z ankiet.</p>
        <div className="field">
          <label htmlFor="surveySafety">Wynik badania na zgodnej skali 0–100</label>
          <NumberField id="surveySafety" className="num-input" decimal value={params.surveySafety} onValue={(value) => up("surveySafety", value)} aria-describedby="survey-help" />
          {params.surveySafety !== "" && errors.surveySafety && <p className="field-error" role="status">{errors.surveySafety}</p>}
        </div>
        <fieldset className="survey-scope"><legend>Kogo obejmuje wynik?</legend>
          <label><input type="radio" name="surveyScope" checked={params.surveyScope === "whole"} onChange={() => up("surveyScope", "whole")} /> Całą organizację</label>
          <label><input type="radio" name="surveyScope" checked={params.surveyScope === "part"} onChange={() => up("surveyScope", "part")} /> Część organizacji</label>
          <label><input type="radio" name="surveyScope" checked={params.surveyScope === "unknown"} onChange={() => up("surveyScope", "unknown")} /> Nie wiem</label>
        </fieldset>
        <p className="small muted">Wynik części organizacji nie opisuje automatycznie całej firmy. Ocena zakresu i reprezentatywności pozostaje po stronie użytkownika.</p>
        {["part", "unknown"].includes(params.surveyScope) && <>
          <p className="small muted">Dane o etatach, płacach, rotacji, przychodach i kosztach muszą dotyczyć tej samej grupy co wynik. Jeżeli nie znasz grupy lub nie masz danych dla niej, nie potwierdzaj zgodności.</p>
          <label className="survey-confirm"><input type="checkbox" required aria-describedby="survey-scope-confirm-help" checked={params.surveyScopeConfirmed === true} onChange={(event) => up("surveyScopeConfirmed", event.target.checked)} /> Potwierdzam, że dane wejściowe dotyczą tej samej badanej grupy.</label>
          <p id="survey-scope-confirm-help" className="field-hint" role="status">{errors.surveyScopeConfirmed ? "Potwierdź zakres danych, aby zobaczyć wynik." : "Zakres danych potwierdzony przez użytkownika."}</p>
        </>}
        <label className="survey-confirm"><input type="checkbox" checked={params.surveyConfirmed === true} onChange={(event) => up("surveyConfirmed", event.target.checked)} /> Potwierdzam, że wynik i sposób jego przeliczenia są zgodne z tą skalą.</label>
        <p className="small muted">Wynik finansowy pozostaje scenariuszem zależnym od założeń, nie pomiarem strat.</p>
      </div> : <>
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
      </>}
    </section>
  );
}
