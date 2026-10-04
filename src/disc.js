// The disc encodes the amount as AREA: share = amount ÷ amount at climate 0,
// radius ∝ sqrt(share), so a half-size cost is half the area.
export function discShare(amount, worst) {
  if (!(worst > 0) || !(amount > 0)) return 0;
  return Math.min(1, amount / worst);
}

export const discScale = (share) => Math.sqrt(Math.max(0, Math.min(1, share)));
