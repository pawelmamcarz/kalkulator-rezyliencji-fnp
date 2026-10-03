import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";

export default function Header() {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  return (
    <header style={{ padding: isMobile ? "18px 0 6px" : "24px 0 8px", borderBottom: "2px solid var(--l-rule)" }}>
      <div style={{
        fontFamily: "var(--mono)",
        fontSize: isMobile ? 16 : 18,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        textTransform: "uppercase",
      }}>
        Kalkulator Rezyliencji FNP
      </div>
      <nav aria-label="Nawigacja po kalkulatorze" style={{ display: "flex", flexWrap: "wrap", gap: "0 20px", marginTop: 4 }}>
        <a href="#dane">Dane</a>
        <a href="#wynik">Wynik</a>
        <a href="#dalej">Co dalej</a>
        <a href="#jak-liczymy">Jak to liczymy</a>
      </nav>
    </header>
  );
}
