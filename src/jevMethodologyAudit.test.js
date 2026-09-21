import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import config from "../scripts/jev-methodology-audit.config.js";
import {
  EM_DASH,
  SYSTEMONE_URL,
  callSystemOne,
  callSystemOneWithSdk,
  choice,
  evaluateAnswers,
  formatReport,
  helpText,
  loadSources,
  mechanicalFindings,
  noul,
  parseArgs,
  resolveApiKey,
  runAudit,
  score,
  toApiQuestions,
  validateConfig,
} from "../scripts/jev-methodology-audit.lib.js";
import { main } from "../scripts/jev-methodology-audit.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const passingAnswers = {
  claim_vs_priory: { type: "choice", choice: "supports", confidence: 0.92 },
  ipsos_role: { type: "choice", choice: "context_not_calibration", confidence: 0.9 },
  claims_accounting_or_roi: { type: "noul", noul: 0.08 },
  headline_scope: { type: "noul", noul: 0.88 },
  five_percent_control: { type: "noul", noul: 0.84 },
  chilling_separate_money: { type: "noul", noul: 0.06 },
  climate_self_estimate: { type: "noul", noul: 0.93 },
  open_code_not_proof: { type: "noul", noul: 0.8 },
  p10p90_not_confidence_interval: { type: "noul", noul: 0.81 },
  epistemic_fidelity: { type: "score", score: 1.86, confidence: 0.77 },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Jev methodology audit config", () => {
  it("is a reviewable System One payload with Choice, Noul and Score gates", () => {
    expect(validateConfig(config)).toEqual([]);
    expect(config.model).toBe("jev-1.13.0");
    const types = Object.values(config.questions).map((question) => question.type);
    expect(new Set(types)).toEqual(new Set(["noul", "choice", "score"]));
    expect(Object.keys(config.questions)).toContain("claim_vs_priory");
    expect(Object.keys(config.questions)).toContain("ipsos_role");
    expect(toApiQuestions(config.questions).claim_vs_priory).not.toHaveProperty("gate");
  });

  it("points at priory and the public methodology disclaimers", () => {
    const paths = config.sources.map((source) => source.path);
    expect(paths).toEqual(expect.arrayContaining([
      "docs/PRIORY.md",
      "src/sections/Methodology.jsx",
      "src/sections/Limitations.jsx",
      "src/sections/Result.jsx",
    ]));
    expect(config.sources.find((source) => source.id === "priory").role).toBe("source_of_truth");
  });
});

describe("Jev primitives and gates", () => {
  it("builds noul, choice and score questions", () => {
    expect(noul("Is this a prior?", { max: 0.2 })).toMatchObject({ type: "noul", gate: { max: 0.2 } });
    expect(choice("Which role?", { a: "A", b: "B" }, { expect: "a" }).criteria).toEqual({ a: "A", b: "B" });
    expect(score("How consistent?", ["low", "mid", "high"], { min: 1 }).criteria).toHaveLength(3);
    expect(() => choice("bad")).toThrow(/criteria object/);
    expect(() => score("bad", ["only-one"])).toThrow(/two ordered/);
  });

  it("passes a mock Jev payload that honors the FNP contract", () => {
    const result = evaluateAnswers(passingAnswers, config.questions);
    expect(result.ok).toBe(true);
    expect(result.findings).toHaveLength(Object.keys(config.questions).length);
  });

  it("fails when public copy is judged as Ipsos calibration or an ROI claim", () => {
    const result = evaluateAnswers({
      ...passingAnswers,
      ipsos_role: { type: "choice", choice: "completed_calibration", confidence: 0.99 },
      claims_accounting_or_roi: { type: "noul", noul: 0.91 },
    }, config.questions);
    expect(result.ok).toBe(false);
    expect(result.findings.find((row) => row.id === "ipsos_role").reason).toBe("unexpected_choice");
    expect(result.findings.find((row) => row.id === "claims_accounting_or_roi").reason).toBe("above_max");
  });

  it("fails low-confidence choice and score even when the label matches", () => {
    const result = evaluateAnswers({
      ...passingAnswers,
      claim_vs_priory: { type: "choice", choice: "supports", confidence: 0.2 },
      epistemic_fidelity: { type: "score", score: 1.9, confidence: 0.1 },
    }, config.questions);
    expect(result.findings.find((row) => row.id === "claim_vs_priory").reason).toBe("low_confidence");
    expect(result.findings.find((row) => row.id === "epistemic_fidelity").reason).toBe("low_confidence");
  });

  it("fails a missing or malformed answer", () => {
    expect(evaluateAnswers({}, { q: noul("Yes?", { min: 0.5 }) }).findings[0].reason).toBe("missing_answer");
    expect(evaluateAnswers({ q: { noul: "x" } }, { q: noul("Yes?", { min: 0.5 }) }).findings[0].reason).toBe("invalid_noul");
  });

  it("rejects noul and score values outside the primitive domain before one-sided gates", () => {
    const result = evaluateAnswers({
      ...passingAnswers,
      headline_scope: { type: "noul", noul: 999 },
      claims_accounting_or_roi: { type: "noul", noul: -999 },
      epistemic_fidelity: { type: "score", score: 9, confidence: 0.99 },
    }, config.questions);
    expect(result.findings.find((row) => row.id === "headline_scope").reason).toBe("invalid_noul");
    expect(result.findings.find((row) => row.id === "claims_accounting_or_roi").reason).toBe("invalid_noul");
    expect(result.findings.find((row) => row.id === "epistemic_fidelity").reason).toBe("invalid_score");
  });

  it("rejects missing or nonnumeric confidence when a minimum is configured", () => {
    const missing = evaluateAnswers({
      ...passingAnswers,
      claim_vs_priory: { type: "choice", choice: "supports" },
      epistemic_fidelity: { type: "score", score: 1.9, confidence: "high" },
    }, config.questions);
    expect(missing.findings.find((row) => row.id === "claim_vs_priory").reason).toBe("invalid_confidence");
    expect(missing.findings.find((row) => row.id === "epistemic_fidelity").reason).toBe("invalid_confidence");
  });
});

describe("TypeSafe HTTP client", () => {
  it("reads TYPESAFE_API_KEY only from the environment helper", () => {
    expect(resolveApiKey({})).toBeNull();
    expect(resolveApiKey({ TYPESAFE_API_KEY: "  " })).toBeNull();
    expect(resolveApiKey({ TYPESAFE_API_KEY: " sk-test " })).toBe("sk-test");
  });

  it("posts a Bearer System One request and never puts the key in the body", async () => {
    const fetchImpl = vi.fn(async (url, init) => {
      expect(url).toBe(SYSTEMONE_URL);
      expect(init.headers.Authorization).toBe("Bearer test-key");
      const body = JSON.parse(init.body);
      expect(body).toEqual({
        model: "jev-1.13.0",
        state: { priory: "prior" },
        questions: { ok: { type: "noul", instructions: "Yes?" } },
      });
      expect(init.body).not.toContain("test-key");
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          model: "jev-1.13.0",
          answers: { ok: { type: "noul", noul: 0.9 } },
          usage: { input_tokens: 12, output_tokens: 3 },
        }),
      };
    });
    const response = await callSystemOne({
      apiKey: "test-key",
      model: "jev-1.13.0",
      state: { priory: "prior" },
      questions: { ok: { type: "noul", instructions: "Yes?" } },
      fetchImpl,
    });
    expect(response.answers.ok.noul).toBe(0.9);
  });

  it("surfaces HTTP and missing-key errors without calling the network", async () => {
    await expect(callSystemOne({ apiKey: null, model: "jev-1.13.0", state: {}, questions: {} }))
      .rejects.toMatchObject({ code: "MISSING_KEY" });
    await expect(callSystemOne({
      apiKey: "bad",
      model: "jev-1.13.0",
      state: {},
      questions: {},
      fetchImpl: async () => ({ ok: false, status: 401, text: async () => "{\"detail\":\"no\"}" }),
    })).rejects.toMatchObject({ code: "SYSTEMONE_HTTP", status: 401 });
  });

  it("uses an injected SDK and reports a missing optional package", async () => {
    const systemOne = vi.fn(async () => ({ answers: passingAnswers }));
    const response = await callSystemOneWithSdk({
      apiKey: "k",
      model: "jev-1.13.0",
      state: { a: "b" },
      questions: {},
      loadSdk: async () => ({ TypeSafeClient: class { constructor() { this.systemOne = systemOne; } } }),
    });
    expect(response.answers).toBe(passingAnswers);
    expect(systemOne).toHaveBeenCalledOnce();
    await expect(callSystemOneWithSdk({
      apiKey: "k",
      model: "jev-1.13.0",
      state: {},
      questions: {},
      loadSdk: async () => { throw new Error("Cannot find package"); },
    })).rejects.toMatchObject({ code: "SDK_MISSING" });
  });
});

describe("source loading and mechanical checks", () => {
  it("loads the real priory and methodology files from this repo", async () => {
    const { state, loaded } = await loadSources({ sources: config.sources, root, readFileImpl: readFile });
    expect(state.priory).toContain("scenariusz skali");
    expect(state.methodology).toContain("Ipsos × FNP");
    expect(state.limitations).toContain("nie mówimy o kalibracji");
    expect(loaded.every((source) => source.emDash === false)).toBe(true);
    expect(mechanicalFindings(loaded)).toEqual([]);
  });

  it("fails mechanical review when a source uses an em dash", () => {
    const findings = mechanicalFindings([{ id: "methodology", path: "x.jsx", bytes: 4, emDash: true }]);
    expect(findings[0]).toMatchObject({ ok: false, reason: "em_dash" });
    expect(findings[0].detail).not.toContain(EM_DASH);
  });
});

describe("runAudit orchestration", () => {
  const tinyConfig = {
    model: "jev-1.13.0",
    sources: [{ id: "priory", path: "docs/PRIORY.md", role: "source_of_truth" }],
    questions: {
      claims_accounting_or_roi: noul("ROI claim?", { max: 0.35 }),
    },
  };

  it("dry-run builds a request without a key or fetch", async () => {
    const result = await runAudit({
      config,
      root,
      env: {},
      flags: { dryRun: true },
    });
    expect(result.ok).toBe(true);
    expect(result.mode).toBe("dry-run");
    expect(result.request.questions.ipsos_role.type).toBe("choice");
    expect(result.request.state.priory).toContain("Prior oznacza");
    expect(formatReport(result)).toContain("dry-run");
  });

  it("rejects a missing key with a stable code", async () => {
    await expect(runAudit({ config: tinyConfig, root, env: {} }))
      .rejects.toMatchObject({ code: "MISSING_KEY" });
  });

  it("evaluates a mocked System One response", async () => {
    const result = await runAudit({
      config,
      root,
      env: { TYPESAFE_API_KEY: "test-key" },
      callApi: async ({ apiKey, state, questions }) => {
        expect(apiKey).toBe("test-key");
        expect(state.methodology).toContain("Założenia autora");
        expect(questions).not.toHaveProperty("gate");
        return { model: "jev-1.13.0", answers: passingAnswers, usage: { input_tokens: 80 } };
      },
    });
    expect(result.ok).toBe(true);
    expect(result.code).toBe(0);
    expect(formatReport(result)).toMatch(/10\/10/);
  });
});

describe("CLI", () => {
  it("parses flags and prints help", () => {
    expect(parseArgs(["--dry-run", "--json"])).toMatchObject({ dryRun: true, json: true });
    expect(helpText()).toContain("TYPESAFE_API_KEY");
    expect(() => parseArgs(["--nope"])).toThrow(/Unknown flag/);
  });

  it("exits 2 without a key and 0 on mocked success", async () => {
    const missing = await captureMain({ argv: [], env: {} });
    expect(missing.code).toBe(2);
    expect(missing.stderr).toContain("TYPESAFE_API_KEY");

    const dry = await captureMain({ argv: ["--dry-run", "--json"], env: {} });
    expect(dry.code).toBe(0);
    const payload = JSON.parse(dry.stdout);
    expect(payload.ok).toBe(true);
    expect(payload.request.questions.claim_vs_priory.type).toBe("choice");
  });
});

describe("public bundle stays free of Jev", () => {
  it("does not import TypeSafe or the audit script from the calculator entrypoints", () => {
    const app = readFileSync(path.join(root, "src/App.jsx"), "utf8");
    const logic = readFileSync(path.join(root, "src/logic.js"), "utf8");
    const vite = readFileSync(path.join(root, "vite.config.js"), "utf8");
    for (const text of [app, logic, vite]) {
      expect(text).not.toMatch(/typesafe|jev-methodology|TYPESAFE_API_KEY/i);
    }
    expect(logic).not.toMatch(/highsOptimizer/);
  });
});

async function captureMain({ argv, env }) {
  let code = 0;
  let stdout = "";
  let stderr = "";
  await main({
    argv,
    env,
    cwd: root,
    stdout: { write(chunk) { stdout += chunk; } },
    stderr: { write(chunk) { stderr += chunk; } },
    exit(next) { code = next; },
  });
  return { code, stdout, stderr };
}
