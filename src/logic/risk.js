const CHANNELS = [
  {
    id: "continuity",
    label: "Rotacja i utrata wiedzy",
    labelEn: "Turnover and knowledge continuity",
    theories: ["Hirschman 1970"],
    evidence: ["mechanism only"],
  },
  {
    id: "operational",
    label: "Błędy i compliance",
    labelEn: "Errors and compliance",
    theories: ["Morrison & Milliken 2000"],
    evidence: ["mechanism only"],
  },
  {
    id: "capacity",
    label: "Ograniczenie zdolności pracy",
    labelEn: "Work capacity constraints",
    theories: ["Edmondson 1999", "Frazier et al. 2017"],
    evidence: ["association only"],
  },
  {
    id: "contribution",
    label: "Utracony wkład, innowacje i uczenie",
    labelEn: "Withheld contribution, innovation and learning",
    theories: ["Maynes & Podsakoff 2014"],
    evidence: ["voice taxonomy only"],
  },
  {
    id: "coordination",
    label: "Koordynacja, nadzór i governance",
    labelEn: "Coordination, oversight and governance",
    theories: ["Williamson 1967", "Jensen & Meckling 1976"],
    evidence: ["interpretive mechanism"],
  },
];

function riskLevel(safety) {
  if (safety < 40) return "elevated";
  if (safety < 60) return "watch";
  return "lower";
}

export function computeRiskProfile(params = {}) {
  const safety = Math.max(0, Math.min(100, Number(params.safety) || 0));
  const safetySource = ["survey", "estimate"].includes(params.safetySource) ? params.safetySource : null;
  const level = riskLevel(safety);

  return {
    safety,
    safetySource,
    overallLevel: safetySource ? level : null,
    inputQuality: safetySource === "survey" ? "measured" : safetySource === "estimate" ? "estimated" : "unknown",
    sourceStatus: "no-private-anchor-used",
    channels: CHANNELS.map((channel) => ({
      ...channel,
      level: safetySource ? level : null,
      score: null,
      monetaryValue: null,
      evidenceStatus: "verified-mechanism-not-valuation",
    })),
    limitations: [
      "Psychological safety is a team-level construct; a company-wide score can hide team variance.",
      "The profile signals exposure. It does not estimate causal effects or financial loss.",
      "Ipsos/FNP anchors remain pending until the private source report is audited page by page.",
    ],
  };
}

export const RISK_CHANNELS = CHANNELS;
export const VALUATION_CHANNEL_IDS = CHANNELS.map((channel) => channel.id);
