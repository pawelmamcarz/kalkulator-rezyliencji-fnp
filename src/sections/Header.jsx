import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";

export default function Header() {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  return (
    <header style={{ padding: "30px 0 18px", borderBottom: "2px solid var(--l-rule)" }}>
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 14,
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "baseline",
      }}>
        <div>
          <div className="micro">Fundacja Nowe Przestrzenie × Paweł Mamcarz</div>
          <div style={{
            fontFamily: "var(--mono)",
            fontSize: isMobile ? 22 : 28,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            marginTop: 6,
          }}>
            Kalkulator Rezyliencji FNP
          </div>
        </div>
        <div className="micro" style={{ textAlign: isMobile ? "left" : "right", lineHeight: 1.6 }}>
          <div>wersja beta · tryb ostrożny</div>
          <div>silnik: Silence Tax · {__APP_VERSION__}</div>
        </div>
      </div>
    </header>
  );
}
