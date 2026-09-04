import useMediaQuery, { MOBILE_QUERY } from "../hooks/useMediaQuery.js";

export default function Footer() {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  return (
    <footer style={{ padding: "48px 0 60px", borderTop: "2px solid var(--l-rule)", marginTop: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr 1fr", gap: isMobile ? 24 : 40 }}>
        <div>
          <div style={{ fontFamily: "var(--mono)", fontWeight: 700, textTransform: "uppercase" }}>
            Kalkulator Rezyliencji FNP
          </div>
          <p style={{ fontFamily: "var(--serif)", fontSize: 14, lineHeight: 1.5, marginTop: 12, maxWidth: 480 }}>
            Współpraca Fundacji Nowe Przestrzenie i Pawła Mamcarza, eksperta Fundacji i współtwórcy kalkulatora.
            Silnik obliczeniowy: Silence Tax (MIT).
          </p>
        </div>
        <div>
          <div className="micro">Kontakt</div>
          <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 13 }}>
            <a href="mailto:pawel@mamcarz.com" style={{ color: "var(--l-ink)" }}>pawel@mamcarz.com</a>
          </div>
          <div style={{ marginTop: 6, fontFamily: "var(--mono)", fontSize: 11, color: "var(--l-mute)" }}>
            ORCID 0009-0002-3274-4226
          </div>
        </div>
        <div>
          <div className="micro">Silnik</div>
          <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 13 }}>
            <a href="https://github.com/pawelmamcarz/kalkulator-rezyliencji-fnp" style={{ color: "var(--l-ink)" }}>
              Kod kalkulatora FNP i priory
            </a>
          </div>
          <div style={{ marginTop: 6, fontFamily: "var(--mono)", fontSize: 11, color: "var(--l-mute)" }}>
            obliczenia w przeglądarce · MIT
          </div>
        </div>
      </div>
      <div style={{
        marginTop: 28,
        paddingTop: 16,
        borderTop: "1px solid var(--l-rule)",
        fontFamily: "var(--mono)",
        fontSize: 10,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--l-mute)",
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}>
        <span>Fundacja Nowe Przestrzenie × Paweł Mamcarz · silnik: Silence Tax</span>
        <span>{__APP_VERSION__}</span>
      </div>
    </footer>
  );
}
