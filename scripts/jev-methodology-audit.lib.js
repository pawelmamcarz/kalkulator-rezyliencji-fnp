import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_MODEL,
  SYSTEMONE_URL,
  callSystemOne,
  choice,
  noul,
  resolveApiKey,
  score,
  toApiQuestions,
} from "./jev-client.js";

export { DEFAULT_MODEL, SYSTEMONE_URL, callSystemOne, choice, noul, resolveApiKey, score, toApiQuestions };

export const EM_DASH = "\u2014";

export function validateConfig(config) {
  const errors = [];
  if (!config || typeof config !== "object") {
    return ["config must be an object"];
  }
  if (!config.model || typeof config.model !== "string") {
    errors.push("config.model is required");
  }
  if (!Array.isArray(config.sources) || config.sources.length === 0) {
    errors.push("config.sources must be a non-empty array");
  } else {
    for (const source of config.sources) {
      if (!source?.id || !source?.path) errors.push("each source needs id and path");
    }
  }
  if (!config.questions || typeof config.questions !== "object") {
    errors.push("config.questions must be an object");
  } else {
    for (const [id, question] of Object.entries(config.questions)) {
      errors.push(...validateQuestion(id, question));
    }
  }
  return errors;
}

export async function loadSources({ sources, root, readFileImpl = readFile }) {
  const state = {};
  const loaded = [];
  for (const source of sources) {
    const filePath = path.resolve(root, source.path);
    const text = await readFileImpl(filePath, "utf8");
    if (typeof text !== "string" || !text.trim()) {
      throw new Error(`Empty audit source: ${source.id} (${source.path})`);
    }
    state[source.id] = text;
    loaded.push({
      id: source.id,
      path: source.path,
      role: source.role || "copy",
      bytes: Buffer.byteLength(text, "utf8"),
      emDash: text.includes(EM_DASH),
    });
  }
  return { state, loaded };
}

export function mechanicalFindings(loaded) {
  return loaded
    .filter((source) => source.emDash)
    .map((source) => ({
      id: `emdash_${source.id}`,
      ok: false,
      kind: "mechanical",
      reason: "em_dash",
      detail: `${source.path} zawiera pauzę (U+2014). Użyj przecinka, dwukropka, kropki albo półpauzy.`,
    }));
}

export function evaluateAnswers(answers, questions) {
  const findings = Object.entries(questions).map(([id, question]) => (
    evaluateGate(id, question, answers?.[id])
  ));
  return { ok: findings.every((row) => row.ok), findings };
}

export async function callSystemOneWithSdk({
  apiKey,
  model,
  state,
  questions,
  loadSdk = () => import("@typesafe-ai/sdk"),
}) {
  if (!apiKey) {
    const error = new Error("Missing TYPESAFE_API_KEY");
    error.code = "MISSING_KEY";
    throw error;
  }
  let sdk;
  try {
    sdk = await loadSdk();
  } catch (cause) {
    const error = new Error("Optional @typesafe-ai/sdk is not installed. Use HTTP (default) or add it as a devDependency.");
    error.code = "SDK_MISSING";
    error.cause = cause;
    throw error;
  }
  const Client = sdk.TypeSafeClient;
  if (typeof Client !== "function") {
    throw new Error("@typesafe-ai/sdk does not export TypeSafeClient");
  }
  const client = new Client({ apiKey, defaultModel: model });
  return client.systemOne({ model, state, questions });
}

export function formatReport({ model, loaded, evaluation, usage, mode }) {
  const lines = [
    `Audyt metodologii Jev (${model})${mode ? `, tryb: ${mode}` : ""}`,
    `Źródła: ${loaded.map((source) => `${source.id} (${source.bytes} B)`).join(", ")}`,
  ];
  for (const finding of evaluation.findings) {
    const mark = finding.ok ? "PASS" : "FAIL";
    lines.push(`${mark.padEnd(4)}  ${finding.id}: ${finding.detail}`);
  }
  const passed = evaluation.findings.filter((row) => row.ok).length;
  lines.push(`Wynik: ${passed}/${evaluation.findings.length} bramek spełnionych.`);
  if (usage?.input_tokens != null) {
    lines.push(`Tokeny wejściowe: ${usage.input_tokens}`);
  }
  return lines.join("\n");
}

export function parseArgs(argv) {
  const flags = {
    dryRun: false,
    json: false,
    sdk: false,
    help: false,
    config: null,
    root: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") flags.dryRun = true;
    else if (arg === "--json") flags.json = true;
    else if (arg === "--sdk") flags.sdk = true;
    else if (arg === "--help" || arg === "-h") flags.help = true;
    else if (arg === "--config") flags.config = argv[++i];
    else if (arg === "--root") flags.root = argv[++i];
    else if (arg.startsWith("--")) {
      throw new Error(`Unknown flag: ${arg}`);
    }
  }
  return flags;
}

export function helpText() {
  return [
    "Audyt metodologii Jev (offline/CI, nie bundel publiczny).",
    "",
    "Użycie:",
    "  TYPESAFE_API_KEY=... npm run jev:audit",
    "  npm run jev:audit -- --dry-run",
    "",
    "Flagi:",
    "  --dry-run   Zbuduj zadanie i sprawdź źródła, bez wywołania API",
    "  --json      Wypisz wynik jako JSON",
    "  --sdk       Użyj opcjonalnego @typesafe-ai/sdk zamiast HTTP",
    "  --config    Ścieżka do pliku konfiguracyjnego",
    "  --root      Katalog repozytorium (domyślnie cwd)",
    "",
    "Klucz tylko z TYPESAFE_API_KEY. Nie commituj sekretów i nie wstrzykuj klucza do klienta.",
  ].join("\n");
}

export async function runAudit({
  config,
  root,
  env = process.env,
  flags = {},
  readFileImpl = readFile,
  fetchImpl = globalThis.fetch,
  loadSdk,
  callApi,
}) {
  const errors = validateConfig(config);
  if (errors.length) {
    const error = new Error(errors.join("; "));
    error.code = "INVALID_CONFIG";
    throw error;
  }
  const { state, loaded } = await loadSources({ sources: config.sources, root, readFileImpl });
  const questions = toApiQuestions(config.questions);
  const request = { model: config.model, state, questions };
  const mechanical = mechanicalFindings(loaded);
  if (mechanical.length) {
    return {
      ok: false,
      code: 1,
      mode: "mechanical",
      model: config.model,
      loaded,
      request,
      evaluation: { ok: false, findings: mechanical },
    };
  }
  if (flags.dryRun) {
    return {
      ok: true,
      code: 0,
      mode: "dry-run",
      model: config.model,
      loaded,
      request,
      evaluation: {
        ok: true,
        findings: [{
          id: "dry_run",
          ok: true,
          kind: "mechanical",
          detail: "Zadanie System One zbudowane. Brak wywołania API.",
        }],
      },
    };
  }
  const apiKey = resolveApiKey(env);
  if (!apiKey) {
    const error = new Error("Brak TYPESAFE_API_KEY. Ustaw klucz środowiskowy albo uruchom: npm run jev:audit -- --dry-run");
    error.code = "MISSING_KEY";
    throw error;
  }
  const caller = callApi || (flags.sdk
    ? (payload) => callSystemOneWithSdk({ ...payload, loadSdk })
    : (payload) => callSystemOne({ ...payload, endpoint: config.endpoint || SYSTEMONE_URL, fetchImpl }));
  const response = await caller({
    apiKey,
    model: config.model,
    state,
    questions,
  });
  const evaluation = evaluateAnswers(response.answers, config.questions);
  return {
    ok: evaluation.ok,
    code: evaluation.ok ? 0 : 1,
    mode: flags.sdk ? "sdk" : "http",
    model: response.model || config.model,
    loaded,
    request,
    response,
    usage: response.usage,
    evaluation,
  };
}

function validateQuestion(id, question) {
  const errors = [];
  if (!question || !["noul", "choice", "score"].includes(question.type)) {
    errors.push(`${id}: type must be noul, choice, or score`);
    return errors;
  }
  if (!question.instructions || typeof question.instructions !== "string") {
    errors.push(`${id}: instructions are required`);
  }
  if (question.type === "choice") {
    if (!question.criteria || typeof question.criteria !== "object" || Array.isArray(question.criteria)) {
      errors.push(`${id}: choice requires a criteria object`);
    }
  }
  if (question.type === "score") {
    if (!Array.isArray(question.criteria) || question.criteria.length < 2) {
      errors.push(`${id}: score requires at least two criteria levels`);
    }
  }
  if (!question.gate || typeof question.gate !== "object") {
    errors.push(`${id}: gate thresholds are required`);
  } else {
    errors.push(...validateGate(id, question));
  }
  return errors;
}

function validateGate(id, question) {
  const { gate } = question;
  if (question.type === "choice" && gate.expect == null) {
    return [`${id}: choice gate needs expect`];
  }
  if (question.type !== "choice" && gate.min == null && gate.max == null) {
    return [`${id}: ${question.type} gate needs min and/or max`];
  }
  return [];
}

function evaluateGate(id, question, answer) {
  const gate = question.gate || {};
  if (!answer || typeof answer !== "object") {
    return {
      id,
      ok: false,
      kind: question.type,
      reason: "missing_answer",
      detail: "Brak odpowiedzi modelu.",
    };
  }
  if (question.type === "noul") {
    const value = Number(answer.noul);
    if (!inUnitInterval(value)) {
      return fail(id, "noul", "invalid_noul", `Niepoprawna wartość noul: ${answer.noul}`);
    }
    if (gate.min != null && value < gate.min) {
      return fail(id, "noul", "below_min", `noul=${value} < min=${gate.min}`);
    }
    if (gate.max != null && value > gate.max) {
      return fail(id, "noul", "above_max", `noul=${value} > max=${gate.max}`);
    }
    return pass(id, "noul", `noul=${value}`);
  }
  if (question.type === "choice") {
    const expected = Array.isArray(gate.expect) ? gate.expect : [gate.expect];
    if (!expected.includes(answer.choice)) {
      return fail(id, "choice", "unexpected_choice", `choice=${answer.choice}, oczekiwano: ${expected.join("|")}`);
    }
    const confidence = readConfidence(answer, gate);
    if (confidence.error) {
      return fail(id, "choice", confidence.error, `choice=${answer.choice}, ${confidence.detail}`);
    }
    return pass(id, "choice", `choice=${answer.choice}, confidence=${confidence.value ?? "n/a"}`);
  }
  const value = Number(answer.score);
  const lastLevel = Array.isArray(question.criteria) ? question.criteria.length - 1 : Infinity;
  if (!Number.isFinite(value) || value < 0 || value > lastLevel) {
    return fail(id, "score", "invalid_score", `Niepoprawna wartość score: ${answer.score}`);
  }
  if (gate.min != null && value < gate.min) {
    return fail(id, "score", "below_min", `score=${value} < min=${gate.min}`);
  }
  if (gate.max != null && value > gate.max) {
    return fail(id, "score", "above_max", `score=${value} > max=${gate.max}`);
  }
  const confidence = readConfidence(answer, gate);
  if (confidence.error) return fail(id, "score", confidence.error, `score=${value}, ${confidence.detail}`);
  return pass(id, "score", `score=${value}, confidence=${confidence.value ?? "n/a"}`);
}

function inUnitInterval(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function readConfidence(answer, gate) {
  if (gate.minConfidence == null) {
    const value = answer.confidence == null ? null : Number(answer.confidence);
    return { value: Number.isFinite(value) ? value : null };
  }
  const value = Number(answer.confidence);
  if (!inUnitInterval(value)) {
    return {
      error: "invalid_confidence",
      detail: `Niepoprawna wartość confidence: ${answer.confidence}`,
    };
  }
  if (value < gate.minConfidence) {
    return {
      error: "low_confidence",
      detail: `confidence=${value} < ${gate.minConfidence}`,
    };
  }
  return { value };
}

function pass(id, kind, detail) {
  return { id, ok: true, kind, detail };
}

function fail(id, kind, reason, detail) {
  return { id, ok: false, kind, reason, detail };
}

