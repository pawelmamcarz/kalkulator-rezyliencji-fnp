import { hashIp, json, sameCode, MOD_CODE_MIN, MOD_HEADERS } from "./rotunda.js";

export async function questions(request, env) {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare("SELECT question FROM questions WHERE approved=1 ORDER BY created DESC LIMIT 30").all();
    return json({ questions: results });
  }
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 300) return json({ error: "Wpisz pytanie do 300 znaków." }, 400);
  const sender = await hashIp(request.headers.get("CF-Connecting-IP") || "unknown", env.DEMO_CODE);
  const now = Date.now();
  const result = await env.DB.prepare("INSERT INTO questions(id, question, created, sender) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM questions WHERE sender=? AND created>?) < 80")
    .bind(crypto.randomUUID(), question, now, sender, sender, now - 600000).run();
  return result.meta.changes ? json({ ok: true }) : json({ error: "Spróbuj ponownie za chwilę." }, 429);
}

export async function moderateQuestions(request, env) {
  if (!env.MOD_CODE || env.MOD_CODE.length < MOD_CODE_MIN || !sameCode(request.headers.get(MOD_HEADERS.mod) || "", env.MOD_CODE)) return json({ error: "Sprawdź hasło moderatora." }, 403);
  if (request.method === "GET") {
    const { results } = await env.DB.prepare("SELECT id, question, approved FROM questions ORDER BY approved, created LIMIT 100").all();
    return json({ questions: results });
  }
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== "string" || !["approve","remove"].includes(body.action)) return json({error:"Niepoprawna decyzja."},400);
  await env.DB.prepare(body.action === "approve" ? "UPDATE questions SET approved=1 WHERE id=?" : "DELETE FROM questions WHERE id=?").bind(body.id).run();
  return json({ok:true});
}
