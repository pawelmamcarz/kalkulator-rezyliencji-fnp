import { DEFAULT_MODEL, callSystemOne } from "../../scripts/jev-client.js";
import { MIN_TEAM_SIZE, aggregate, buildRequest, mapLimit, validateResponses } from "../../scripts/jev-diagnoza.lib.js";
import { handleModeracja, handleStan, handleWpis, hashIp, json, sameCode } from "./rotunda.js";

export { sameCode };

// Conference demo, paste tool (/rotunda/analiza/): a demonstration on made-up answers,
// not a measurement of any team. Jev judges each answer, code aggregates per team.
// Answer text is never stored or logged here; it is sent to TypeSafe for judgment only.

// Team threshold is the project-wide anonymity threshold (MIN_TEAM_SIZE = 5).
// Jev-call ceiling per IP: maxAnswers × maxBatches per rateWindowMs = 25 × 3 = 75 per 10 min.
export const LIMITS = { maxAnswers: 25, maxText: 500, maxTeam: 40, minTeamSize: MIN_TEAM_SIZE, maxBatches: 3, rateWindowMs: 10 * 60 * 1000 };

export function validateDemoInput(body) {
  if (!body || typeof body !== "object") return "Niepoprawne zapytanie.";
  const rows = body.answers;
  if (validateResponses(rows).length) return "Każda odpowiedź potrzebuje zespołu i treści.";
  if (rows.length > LIMITS.maxAnswers) return `Maksymalnie ${LIMITS.maxAnswers} odpowiedzi naraz.`;
  if (rows.some((r) => r.text.length > LIMITS.maxText)) return `Odpowiedź może mieć najwyżej ${LIMITS.maxText} znaków.`;
  if (rows.some((r) => !r.team.trim() || r.team.length > LIMITS.maxTeam)) return `Nazwa zespołu: od 1 do ${LIMITS.maxTeam} znaków.`;
  return null;
}

export async function handleMapa(request, env, fetchImpl, now = () => new Date()) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Niepoprawny JSON." }, 400);
  }
  const invalid = validateDemoInput(body);
  if (invalid) return json({ error: invalid }, 400);
  if (!env.TYPESAFE_API_KEY || !env.DB || !env.DEMO_CODE) return json({ error: "Demo nie jest w pełni skonfigurowane." }, 503);
  const ipHash = await hashIp(request.headers.get("CF-Connecting-IP") ?? "unknown", env.DEMO_CODE);
  const createdAt = now().toISOString();
  const since = new Date(now().getTime() - LIMITS.rateWindowMs).toISOString();
  const reserved = await env.DB.prepare(
    `INSERT INTO mapa_requests (id, ip_hash, created_at)
     SELECT ?, ?, ? WHERE (SELECT COUNT(*) FROM mapa_requests WHERE ip_hash = ? AND created_at >= ?) < ?`,
  ).bind(crypto.randomUUID(), ipHash, createdAt, ipHash, since, LIMITS.maxBatches).run();
  if (!reserved?.meta?.changes) return json({ error: "Za dużo analiz z tego połączenia. Spróbuj za kilka minut." }, 429);
  const rows = body.answers.map((r) => ({ team: r.team.trim(), text: r.text.trim() }));
  try {
    const answers = await mapLimit(rows, 6, async (row) => {
      const res = await callSystemOne({ apiKey: env.TYPESAFE_API_KEY, ...buildRequest(row, DEFAULT_MODEL), fetchImpl });
      return res.answers;
    });
    const teams = aggregate(rows, answers, { minTeamSize: LIMITS.minTeamSize });
    // Per-answer judgments of a suppressed team are withheld too, or the table's suppression would be moot.
    const hiddenTeams = new Set(teams.filter((t) => t.suppressed).map((t) => t.team));
    return json({
      teams,
      answers: answers.map((a, i) => (hiddenTeams.has(rows[i].team) ? null : a)),
      minTeamSize: LIMITS.minTeamSize,
      maxAnswers: LIMITS.maxAnswers,
    });
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
