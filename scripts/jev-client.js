// Minimal TypeSafe System One client, free of Node file APIs so it can run
// in the conference demo Worker as well as in offline scripts.

export const SYSTEMONE_URL = "https://api.typesafe.ai/v1/systemone";

export const DEFAULT_MODEL = "jev-1.13.0";

export function noul(instructions, criteriaOrGate, maybeGate) {
  const hasCriteria = isNoulCriteria(criteriaOrGate);
  const criteria = hasCriteria ? criteriaOrGate : undefined;
  const gate = hasCriteria ? maybeGate : criteriaOrGate;
  return stripUndefined({ type: "noul", instructions, criteria, gate });
}

export function choice(instructions, criteria, gate) {
  if (!criteria || typeof criteria !== "object" || Array.isArray(criteria)) {
    throw new Error("choice() requires a criteria object");
  }
  return stripUndefined({ type: "choice", instructions, criteria, gate });
}

export function score(instructions, criteria, gate) {
  if (!Array.isArray(criteria) || criteria.length < 2) {
    throw new Error("score() requires at least two ordered level descriptions");
  }
  return stripUndefined({ type: "score", instructions, criteria, gate });
}

export function resolveApiKey(env = globalThis.process?.env ?? {}) {
  const key = typeof env.TYPESAFE_API_KEY === "string" ? env.TYPESAFE_API_KEY.trim() : "";
  return key || null;
}

export function toApiQuestions(questions) {
  return Object.fromEntries(Object.entries(questions).map(([id, question]) => {
    const payload = { type: question.type, instructions: question.instructions };
    if (question.criteria !== undefined) payload.criteria = question.criteria;
    return [id, payload];
  }));
}

export async function callSystemOne({
  apiKey,
  model,
  state,
  questions,
  endpoint = SYSTEMONE_URL,
  fetchImpl = globalThis.fetch,
}) {
  if (!apiKey) {
    const error = new Error("Missing TYPESAFE_API_KEY");
    error.code = "MISSING_KEY";
    throw error;
  }
  if (typeof fetchImpl !== "function") {
    throw new Error("fetch is not available; pass fetchImpl or use Node 20+");
  }
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, state, questions }),
  });
  const body = await readJson(response);
  if (!response.ok) {
    const error = new Error(`TypeSafe System One HTTP ${response.status}`);
    error.code = "SYSTEMONE_HTTP";
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

function isNoulCriteria(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)
    && ("true" in value || "false" in value));
}

function stripUndefined(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
