import { DEFAULT_MODEL, callSystemOne } from "../../scripts/jev-client.js";
import { aggregate, buildRequest, mapLimit, validateResponses } from "../../scripts/jev-diagnoza.lib.js";
import { handleModeracja, handleStan, handleWpis, json, sameCode } from "./rotunda.js";

export { sameCode };

// Conference demo, paste tool (/rotunda/analiza/): booth visitors paste answers, Jev judges each one,
// code aggregates per team. Answer text is never stored or logged here;
// it is sent to TypeSafe for judgment only.

export const LIMITS = { maxAnswers: 40, maxText: 500, maxTeam: 40, minTeamSize: 3 };

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

const API = {
  "/api/mapa": { POST: (req, env) => handleMapa(req, env) },
  "/api/wpis": { POST: (req, env) => handleWpis(req, env) },
  "/api/stan": { GET: (req, env) => handleStan(req, env) },
  "/api/moderacja": { GET: (req, env) => handleModeracja(req, env), POST: (req, env) => handleModeracja(req, env) },
};

export default {
  async fetch(request, env, _ctx, passThrough = fetch) {
    const url = new URL(request.url);
    // The route pattern also matches e.g. /rotundaX; hand those to the calculator.
    if (url.pathname !== BASE && !url.pathname.startsWith(`${BASE}/`)) return passThrough(request);
    if (url.pathname === BASE) return Response.redirect(`${url.origin}${BASE}/${url.search}`, 301);
    const apiPath = url.pathname.slice(BASE.length);
    const route = Object.hasOwn(API, apiPath) ? API[apiPath] : null;
    if (route) {
      const handler = Object.hasOwn(route, request.method) ? route[request.method] : null;
      if (!handler) return json({ error: `Tylko ${Object.keys(route).join(" lub ")}.` }, 405);
      return handler(request, env);
    }
    if (url.pathname.startsWith(`${BASE}/api/`)) return json({ error: "Nie ma takiego adresu." }, 404);
    return env.ASSETS.fetch(request);
  },
};
