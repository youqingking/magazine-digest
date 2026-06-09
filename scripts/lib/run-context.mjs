import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { atomicWriteJson } from "./atomic-json.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export function createRunId(prefix = "run") {
  return `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomUUID().slice(0, 8)}`;
}

export function createRunContext(options = {}) {
  const runId = options.runId || createRunId(options.prefix || "automation");
  const root = path.join(repoRoot, "output", "runs", runId);
  fs.mkdirSync(root, { recursive: true });
  const context = {
    run_id: runId,
    root,
    script: options.script || process.argv[1] || "unknown",
    profile: options.profile || "read_only",
    created_at: new Date().toISOString()
  };
  atomicWriteJson(path.join(root, "run-context.json"), context);
  return context;
}

export function contextEnv(context, options = {}) {
  return {
    ...process.env,
    RUN_ID: context.run_id,
    RUN_CONTEXT_ROOT: context.root,
    RUN_PROFILE: context.profile,
    RUN_SANDBOX_ONLY: options.sandboxOnly ? "1" : "0"
  };
}
