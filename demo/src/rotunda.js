import { DEFAULT_MODEL, callSystemOne, noul, toApiQuestions } from "../../scripts/jev-client.js";
import { AREAS, CAUSES, questions as diagnosisQuestions } from "../../scripts/jev-diagnoza.lib.js";

// Rotunda booth game: „Czego nie powiedziałeś w tym miesiącu?”.
// An anonymous map of the room, not a measurement of any company.
// Answer text goes to TypeSafe for judgment; D1 keeps judgments, and text
// only with consent, after the checks, until a moderator rejects it.
// Nothing here logs answer text.

export const ROLES = {
  zarzad: "Zarząd",
  menedzer: "Menedżer / menedżerka",
  specjalista: "Specjalista / specjalistka",
};

export const STARTERS = {
  szef: "Nie powiedziałem/am szefowi, że…",
  blad: "Wiem o błędzie, ale…",
  pomysl: "Miałem/am pomysł, ale…",
  spotkanie: "Na spotkaniu wszyscy kiwali głową, a ja…",
  klient: "Klient nie wie, że…",
  zarzad: "Do zarządu nie dociera, że…",
  odejscie: "Gdybym odchodził/a, powiedział/abym, że…",
  wolne: "Przemilczałem/am, bo…",
};

export const CAUSE_LABELS = {
  lek: "Lęk przed konsekwencjami",
  bezsens: "Nic się nie zmieni",
  brak_kanalu: "Brak kanału lub czasu",
  lojalnosc: "Ochrona innych",
};

export const AREA_IDS = Object.keys(AREAS);
export const CAUSE_IDS = Object.keys(CAUSES);

export const ROTUNDA = {
  maxText: 200,
  minRoleSize: 3,
  maxQuotes: 12,
  rateLimit: 5,
  rateWindowMs: 10 * 60 * 1000,
  threshold: 0.5,
};

const BOOTH = "`odpowiedz` to anonimowe dokończenie zdania wpisane przez uczestnika konferencji na stoisku. Za zgodą autora może pojawić się jako cytat na wspólnym ekranie.";

// Asked only when the visitor consents to a quote; both gate storing the text.
export const QUOTE_CHECKS = {
  dane_osobowe: noul(`${BOOTH} Czy wypowiedź zawiera dane, po których można rozpoznać konkretną osobę lub organizację: imię, nazwisko, pseudonim, nazwę firmy, instytucji, marki lub projektu, konkretne miejsce (miasto, oddział, adres, budynek) albo stanowisko wskazujące jedną, rozpoznawalną osobę? Ogólne określenia ról, takie jak „szef”, „zarząd”, „klient”, „zespół” czy „kolega”, nie są takimi danymi.`),
  obrazliwe: noul(`${BOOTH} Czy wypowiedź zawiera obelgi, wulgaryzmy, poniżające określenia osób lub grup albo treści nienawistne? Rzeczowa, nawet ostra krytyka przełożonych, firmy lub decyzji bez wyzwisk i wulgaryzmów nie jest obraźliwa.`),
};

export function buildWpisRequest({ starter, text, consent }, model = DEFAULT_MODEL) {
  const qs = consent ? { ...diagnosisQuestions, ...QUOTE_CHECKS } : diagnosisQuestions;
  return { model, state: { odpowiedz: `${STARTERS[starter]} ${text}` }, questions: toApiQuestions(qs) };
}

export const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

export function sameCode(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !b) return false;
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < y.length; i++) diff |= (x[i] ?? 0) ^ y[i];
  return diff === 0;
}

const has = (obj, key) => typeof key === "string" && Object.hasOwn(obj, key);

export function validateWpis(body) {
  if (!body || typeof body !== "object") return "Niepoprawne zapytanie.";
  if (!has(ROLES, body.rola)) return "Wybierz rolę.";
  if (!has(STARTERS, body.starter)) return "Nieznana karta.";
  if (typeof body.consent !== "boolean") return "Brak decyzji o zgodzie na cytat.";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length < 1 || text.length > ROTUNDA.maxText) return `Dokończ zdanie: od 1 do ${ROTUNDA.maxText} znaków.`;
  return null;
}

export async function hashIp(ip, secret) {
  const data = new TextEncoder().encode(`${ip}|${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

// Code owns policy; Jev supplies per-entry probabilities only.
export function toJudgment(answers, consent) {
  const silence = num(answers?.milczenie?.noul);
  if (silence === null) throw new Error("Incomplete Jev answer");
  const silent = silence >= ROTUNDA.threshold;
  const scores = Object.fromEntries(CAUSE_IDS.map((id) => [id, num(answers[`przyczyna_${id}`]?.noul) ?? 0]));
  const area = AREA_IDS.includes(answers.obszar?.choice) ? answers.obszar.choice : "brak";
  const causes = silent ? CAUSE_IDS.filter((id) => scores[id] >= ROTUNDA.threshold) : [];
  const topCause = silent ? CAUSE_IDS.reduce((best, id) => (scores[id] > scores[best] ? id : best), CAUSE_IDS[0]) : null;
  const judgment = { silence, silent, area, causes, topCause, severity: num(answers.nasilenie?.score) ?? 0 };
  // Missing checks count as failed: the text is then not stored.
  const checks = consent
    ? { dane_osobowe: num(answers.dane_osobowe?.noul) ?? 1, obrazliwe: num(answers.obrazliwe?.noul) ?? 1 }
    : null;
  return { judgment, checks };
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export async function handleWpis(request, env, fetchImpl, now = () => new Date()) {
  const body = await readBody(request);
  if (body === undefined) return json({ error: "Niepoprawny JSON." }, 400);
  if (!sameCode(body?.code, env.DEMO_CODE)) return json({ error: "Niepoprawny kod dostępu." }, 403);
  const invalid = validateWpis(body);
  if (invalid) return json({ error: invalid }, 400);
  if (!env.TYPESAFE_API_KEY || !env.DB) return json({ error: "Demo nie jest w pełni skonfigurowane." }, 503);

  const entry = { rola: body.rola, starter: body.starter, text: body.text.trim(), consent: body.consent };
  const ipHash = await hashIp(request.headers.get("CF-Connecting-IP") ?? "unknown", env.DEMO_CODE);
  const since = new Date(now().getTime() - ROTUNDA.rateWindowMs).toISOString();
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM wpisy WHERE ip_hash = ? AND created_at >= ?")
    .bind(ipHash, since).first();
  if ((recent?.n ?? 0) >= ROTUNDA.rateLimit) {
    return json({ error: "Za dużo wpisów z tego urządzenia. Spróbuj ponownie za kilka minut." }, 429);
  }

  let judgment;
  let checks;
  try {
    const res = await callSystemOne({ apiKey: env.TYPESAFE_API_KEY, ...buildWpisRequest(entry), fetchImpl });
    ({ judgment, checks } = toJudgment(res.answers, entry.consent));
  } catch {
    return json({ error: "Jev nie odpowiedział. Spróbuj ponownie za chwilę." }, 502);
  }

  const storeText = Boolean(checks && checks.dane_osobowe < ROTUNDA.threshold && checks.obrazliwe < ROTUNDA.threshold);
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO wpisy (id, created_at, rola, starter, silence, area, top_cause, causes, severity, text, quote_status, ip_hash, dane_osobowe, obrazliwe)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id, now().toISOString(), entry.rola, entry.starter, judgment.silence, judgment.area, judgment.topCause,
    JSON.stringify(judgment.causes), judgment.severity,
    storeText ? `${STARTERS[entry.starter]} ${entry.text}` : null,
    storeText ? "pending" : null,
    ipHash,
    storeText ? checks.dane_osobowe : null,
    storeText ? checks.obrazliwe : null,
  ).run();

  const hall = await env.DB.prepare(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN silence >= ? THEN 1 ELSE 0 END) AS silent,
            SUM(CASE WHEN silence >= ? AND top_cause = ? THEN 1 ELSE 0 END) AS same
       FROM wpisy`,
  ).bind(ROTUNDA.threshold, ROTUNDA.threshold, judgment.topCause).first();
  const silentCount = hall?.silent ?? 0;
  const topCauseShare = judgment.topCause && silentCount ? (hall.same ?? 0) / silentCount : null;

  return json({
    id,
    judgment,
    hall: { total: hall?.total ?? 0, topCauseShare },
    quote: storeText ? "pending" : "not_stored",
  });
}

const zeros = (ids) => Object.fromEntries(ids.map((id) => [id, 0]));

export function summarize(rows) {
  const group = { n: rows.length, silent: 0, causes: zeros(CAUSE_IDS), areas: zeros(AREA_IDS) };
  for (const row of rows) {
    if (row.silence < ROTUNDA.threshold) continue;
    group.silent += 1;
    if (has(group.areas, row.area)) group.areas[row.area] += 1;
    let causes;
    try {
      causes = JSON.parse(row.causes ?? "[]");
    } catch {
      causes = [];
    }
    for (const c of Array.isArray(causes) ? causes : []) if (has(group.causes, c)) group.causes[c] += 1;
  }
  return group;
}

export async function handleStan(request, env, now = () => new Date()) {
  const url = new URL(request.url);
  if (!sameCode(url.searchParams.get("code") ?? undefined, env.DEMO_CODE)) return json({ error: "Niepoprawny kod dostępu." }, 403);
  if (!env.DB) return json({ error: "Demo nie jest w pełni skonfigurowane." }, 503);
  const { results: rows = [] } = await env.DB.prepare("SELECT rola, silence, area, causes FROM wpisy").all();
  const { results: quotes = [] } = await env.DB.prepare(
    `SELECT id, text, rola, top_cause FROM wpisy
      WHERE quote_status = 'approved' AND text IS NOT NULL
      ORDER BY moderated_at DESC, created_at DESC LIMIT ?`,
  ).bind(ROTUNDA.maxQuotes).all();
  const overall = summarize(rows);
  const byRole = Object.fromEntries(Object.keys(ROLES).map((rola) => {
    const list = rows.filter((r) => r.rola === rola);
    return [rola, list.length < ROTUNDA.minRoleSize ? { n: list.length, suppressed: true } : summarize(list)];
  }));
  return json({
    total: overall.n,
    silentShare: overall.n ? overall.silent / overall.n : 0,
    updatedAt: now().toISOString(),
    overall,
    byRole,
    quotes: quotes.map((q) => ({ id: q.id, text: q.text, rola: q.rola, topCause: q.top_cause ?? null })),
  });
}

export async function handleModeracja(request, env, now = () => new Date()) {
  const isPost = request.method === "POST";
  let code;
  let mod;
  let body;
  if (isPost) {
    body = await readBody(request);
    if (body === undefined) return json({ error: "Niepoprawny JSON." }, 400);
    code = body?.code;
    mod = body?.mod;
  } else {
    const url = new URL(request.url);
    code = url.searchParams.get("code") ?? undefined;
    mod = url.searchParams.get("mod") ?? undefined;
  }
  // Evaluate both so timing does not reveal which code was wrong.
  const okCode = sameCode(code, env.DEMO_CODE);
  const okMod = sameCode(mod, env.MOD_CODE);
  if (!okCode || !okMod) return json({ error: "Niepoprawny kod moderatora." }, 403);
  if (!env.DB) return json({ error: "Demo nie jest w pełni skonfigurowane." }, 503);

  if (!isPost) {
    const { results = [] } = await env.DB.prepare(
      `SELECT id, text, rola, created_at, dane_osobowe, obrazliwe FROM wpisy
        WHERE quote_status = 'pending' AND text IS NOT NULL ORDER BY created_at ASC`,
    ).all();
    return json({
      pending: results.map((r) => ({
        id: r.id, text: r.text, rola: r.rola, createdAt: r.created_at, dane_osobowe: r.dane_osobowe, obrazliwe: r.obrazliwe,
      })),
    });
  }

  if (typeof body.id !== "string" || !body.id) return json({ error: "Brak identyfikatora wpisu." }, 400);
  if (body.decision !== "approve" && body.decision !== "reject") return json({ error: "Decyzja: approve albo reject." }, 400);
  const stmt = body.decision === "approve"
    ? "UPDATE wpisy SET quote_status = 'approved', moderated_at = ? WHERE id = ? AND quote_status IN ('pending', 'approved') AND text IS NOT NULL"
    : "UPDATE wpisy SET quote_status = 'rejected', text = NULL, moderated_at = ? WHERE id = ? AND text IS NOT NULL";
  const res = await env.DB.prepare(stmt).bind(now().toISOString(), body.id).run();
  if (!res?.meta?.changes) return json({ error: "Nie ma takiego cytatu do moderacji." }, 404);
  return json({ ok: true });
}
