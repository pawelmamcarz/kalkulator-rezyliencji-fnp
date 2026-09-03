const SR_ONLY = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export default function Redact({ children }) {
  return (
    <span className="redact-wrap">
      <span className="redact l" aria-hidden="true">{children}</span>
      <span style={SR_ONLY}>{children}</span>
    </span>
  );
}
