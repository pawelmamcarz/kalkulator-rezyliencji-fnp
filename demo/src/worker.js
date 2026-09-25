import { DEFAULT_MODEL, callSystemOne } from "../../scripts/jev-client.js";
import { aggregate, buildRequest, mapLimit, validateResponses } from "../../scripts/jev-diagnoza.lib.js";

// Conference demo: booth visitors paste answers, Jev judges each one,
// code aggregates per team. Answer text is never stored or logged here;
// it is sent to TypeSafe for judgment only.

export const LIMITS = { maxAnswers: 40, maxText: 500, maxTeam: 40, minTeamSize: 3 };

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

function sameCode(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !b) return false;
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < y.length; i++) diff |= (x[i] ?? 0) ^ y[i];
  return diff === 0;
}

export function validateDemoInput(body) {
  if (!body || typeof body !== "object") return "Niepoprawne zapytanie.";
  const rows = body.answers;
  if (validateResponses(rows).length) return "Każda odpowiedź potrzebuje zespołu i treści.";
  if (rows.length > LIMITS.maxAnswers) return `Maksymalnie ${LIMITS.maxAnswers} odpowiedzi naraz.`;
  if (rows.some((r) => r.text.length > LIMITS.maxText)) return `Odpowiedź może mieć najwyżej ${LIMITS.maxText} znaków.`;
  if (rows.some((r) => !r.team.trim() || r.team.length > LIMITS.maxTeam)) return `Nazwa zespołu: od 1 do ${LIMITS.maxTeam} znaków.`;
  return null;
}

export async function handleMapa(request, env, fetchImpl) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Niepoprawny JSON." }, 400);
  }
  if (!sameCode(body?.code, env.DEMO_CODE)) return json({ error: "Niepoprawny kod dostępu." }, 403);
  const invalid = validateDemoInput(body);
  if (invalid) return json({ error: invalid }, 400);
  if (!env.TYPESAFE_API_KEY) return json({ error: "Demo nie ma skonfigurowanego klucza." }, 503);
  const rows = body.answers.map((r) => ({ team: r.team.trim(), text: r.text.trim() }));
  try {
    const answers = await mapLimit(rows, 6, async (row) => {
      const res = await callSystemOne({ apiKey: env.TYPESAFE_API_KEY, ...buildRequest(row, DEFAULT_MODEL), fetchImpl });
      return res.answers;
    });
    return json({ teams: aggregate(rows, answers, { minTeamSize: LIMITS.minTeamSize }), answers, minTeamSize: LIMITS.minTeamSize });
  } catch (error) {
    return json({ error: "Jev nie odpowiedział. Spróbuj ponownie za chwilę.", status: error.status ?? null }, 502);
  }
}

// Mounted on fnp.silence-tax.com/rotunda* in front of the calculator Worker.
export const BASE = "/rotunda";

export default {
  async fetch(request, env, _ctx, passThrough = fetch) {
    const url = new URL(request.url);
    // The route pattern also matches e.g. /rotundaX; hand those to the calculator.
    if (url.pathname !== BASE && !url.pathname.startsWith(`${BASE}/`)) return passThrough(request);
    if (url.pathname === BASE) return Response.redirect(`${url.origin}${BASE}/${url.search}`, 301);
    if (url.pathname === `${BASE}/api/mapa`) {
      if (request.method !== "POST") return json({ error: "Tylko POST." }, 405);
      return handleMapa(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
