export default function LedgerBox({ children, label, style = {} }) {
  return (
    <div style={{
      border: "1px solid var(--l-rule)",
      background: "#fff",
      position: "relative",
      ...style,
    }}>
      {label && (
        <div style={{
          position: "absolute",
          top: -10,
          left: 14,
          background: "var(--l-paper)",
          padding: "0 8px",
          fontFamily: "var(--mono)",
          fontSize: 10,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--l-mute)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
