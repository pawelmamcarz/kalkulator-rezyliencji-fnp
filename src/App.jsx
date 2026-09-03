import { useParamsState } from "./hooks/useParamsState.js";
import { useCostCalculation } from "./hooks/useCostCalculation.js";
import useMediaQuery, { MOBILE_QUERY } from "./hooks/useMediaQuery.js";
import Header from "./sections/Header.jsx";
import Hero from "./sections/Hero.jsx";
import Diagnosis from "./sections/Diagnosis.jsx";
import Channels from "./sections/Channels.jsx";
import Triangle from "./sections/Triangle.jsx";
import Limitations from "./sections/Limitations.jsx";
import Footer from "./sections/Footer.jsx";
import Invitation from "./sections/Invitation.jsx";

export default function App() {
  const { params, up } = useParamsState();
  const analysis = useCostCalculation(params);
  const isMobile = useMediaQuery(MOBILE_QUERY);

  return (
    <div className="l-board l-gutters" style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 16px" : "0 48px" }}>
      <Header />
      <Hero valuation={analysis.valuation} params={params} />
      <Diagnosis params={params} up={up} />
      <Channels valuation={analysis.valuation} params={params} />
      <Triangle />
      <Limitations />
      <Footer />
      <Invitation params={params} valuation={analysis.valuation} />
    </div>
  );
}
