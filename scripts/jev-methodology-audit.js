#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  formatReport,
  helpText,
  parseArgs,
  runAudit,
} from "./jev-methodology-audit.lib.js";

export async function main({
  argv = process.argv.slice(2),
  env = process.env,
  cwd = process.cwd(),
  stdout = process.stdout,
  stderr = process.stderr,
  exit = process.exit,
  readFileImpl,
  fetchImpl,
  loadSdk,
  callApi,
  loadConfig,
} = {}) {
  let flags;
  try {
    flags = parseArgs(argv);
  } catch (error) {
    stderr.write(`${error.message}\n`);
    return exit(1);
  }
  if (flags.help) {
    stdout.write(`${helpText()}\n`);
    return exit(0);
  }
  const root = path.resolve(flags.root || cwd);
  const configPath = path.resolve(root, flags.config || "scripts/jev-methodology-audit.config.js");
  let config;
  try {
    config = loadConfig
      ? await loadConfig(configPath)
      : (await import(pathToFileURL(configPath).href)).default;
  } catch (error) {
    stderr.write(`Nie można wczytać konfiguracji ${configPath}: ${error.message}\n`);
    return exit(1);
  }
  try {
    const result = await runAudit({
      config,
      root,
      env,
      flags,
      readFileImpl,
      fetchImpl,
      loadSdk,
      callApi,
    });
    writeResult(stdout, result, flags);
    return exit(result.code);
  } catch (error) {
    if (flags.json) {
      stdout.write(`${JSON.stringify({ ok: false, code: error.code || "ERROR", error: error.message }, null, 2)}\n`);
    } else {
      stderr.write(`${error.message}\n`);
      if (error.code === "MISSING_KEY") stderr.write(`${helpText()}\n`);
    }
    return exit(error.code === "MISSING_KEY" ? 2 : 1);
  }
}

function writeResult(stdout, result, flags) {
  if (flags.json) {
    stdout.write(`${JSON.stringify({
      ok: result.ok,
      mode: result.mode,
      model: result.model,
      sources: result.loaded,
      evaluation: result.evaluation,
      usage: result.usage || null,
      request: flags.dryRun ? result.request : undefined,
    }, null, 2)}\n`);
    return;
  }
  stdout.write(`${formatReport(result)}\n`);
  if (flags.dryRun) {
    stdout.write(`Pytania: ${Object.keys(result.request.questions).join(", ")}\n`);
  }
}

const isDirect = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isDirect) {
  await main();
}
