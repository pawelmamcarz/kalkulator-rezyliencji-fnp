import { useParamsState } from "./hooks/useParamsState.js";
import { useCostCalculation } from "./hooks/useCostCalculation.js";
import useConferenceMode from "./hooks/useConferenceMode.js";
import useOpenDetailsOnHash from "./hooks/useOpenDetailsOnHash.js";
import Header from "./sections/Header.jsx";
import Hero from "./sections/Hero.jsx";
import Headline from "./sections/Headline.jsx";
import Climate from "./sections/Climate.jsx";
import Diagnosis from "./sections/Diagnosis.jsx";
import { dataLabel } from "./firm.js";
import Result from "./sections/Result.jsx";
import NextSteps from "./sections/NextSteps.jsx";
import ConferenceBanner from "./sections/ConferenceBanner.jsx";
import HowWeCalculate from "./sections/HowWeCalculate.jsx";
import Footer from "./sections/Footer.jsx";
import Invitation from "./sections/Invitation.jsx";
import LiveBar from "./components/LiveBar.jsx";

// DOM order is the phone's visual order. From 1024 px the CSS grid stacks the
// disc and the breakdown in the right column (see index.css).
export default function App() {
  const { params, up, reset, errors } = useParamsState();
  const analysis = useCostCalculation(params);
  // Visitors from the conference QR (?konferencja) are already at the event,
  // so they do not see the conference announcement. Everything else is shared.
  const conference = useConferenceMode();
  useOpenDetailsOnHash();

  return (
    <div className="page">
      <a className="skip-link" href="#klimat">Przejdź do pytania o klimat</a>
      <LiveBar total={analysis?.valuation?.total} worst={analysis?.worst} />
      <Header />
      <main>
        <div className="flow">
          <Hero />
          <div className="b-disc">
            <h2 className="sr-only">Wynik</h2>
            <Headline valuation={analysis?.valuation} worst={analysis?.worst} label={dataLabel(params)} />
          </div>
          <Climate safety={params.safety} up={up} sensitivity={analysis?.sensitivity} />
          <Diagnosis params={params} up={up} errors={errors} reset={reset} />
          <Result valuation={analysis?.valuation} params={params} />
          <NextSteps ready={!!analysis} params={params} up={up} />
        </div>
        {!conference && <ConferenceBanner />}
        <HowWeCalculate valuation={analysis?.valuation} params={params} />
      </main>
      <Footer />
      <Invitation params={params} valuation={analysis?.valuation} sensitivity={analysis?.sensitivity} />
    </div>
  );
}
