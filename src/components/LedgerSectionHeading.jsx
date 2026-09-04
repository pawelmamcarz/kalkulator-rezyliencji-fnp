import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";

export default function LedgerSectionHeading({ num, title, kicker }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "auto minmax(0, 1fr)",
      gap: isMobile ? 4 : 24,
      alignItems: isMobile ? "start" : "baseline",
      borderTop: "2px solid var(--l-rule)",
      paddingTop: 14,
    }}>
      <div style={{
        fontFamily: "var(--mono)",
        fontSize: 11,
        letterSpacing: "0.2em",
        color: "var(--l-stamp)",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}>
        {num}
      </div>
      <h2 style={{
        fontFamily: "var(--mono)",
        fontSize: isMobile ? 24 : 36,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        textTransform: "uppercase",
        margin: 0,
        color: "var(--l-ink)",
      }}>
        {title}
      </h2>
      {kicker && (
        <div style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.2em",
          color: "var(--l-mute)",
          textTransform: "uppercase",
          gridColumn: isMobile ? "auto" : "2",
        }}>
          {kicker}
        </div>
      )}
    </div>
  );
}
