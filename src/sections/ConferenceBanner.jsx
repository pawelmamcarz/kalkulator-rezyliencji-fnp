import { CONFERENCE } from "../conference.js";
import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";

export default function ConferenceBanner() {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const { date, name, registrationUrl } = CONFERENCE;

  return (
    <aside
      aria-label="Zapowiedź konferencji"
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: isMobile ? 12 : 20,
        marginTop: 24,
        padding: isMobile ? 16 : "14px 20px",
        border: "1px solid var(--l-rule)",
        background: "#fff",
      }}
    >
      <div>
        <div className="micro" style={{ color: "var(--l-stamp)" }}>{date}</div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, textTransform: "uppercase", margin: "6px 0 0", lineHeight: 1.35 }}>
          {name}
        </p>
      </div>
      {registrationUrl && (
        <a className="fnp-btn ghost" href={registrationUrl} target="_blank" rel="noopener noreferrer">
          Zarejestruj się
        </a>
      )}
    </aside>
  );
}
