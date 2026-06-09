import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { atomicWriteJson } from "../lib/atomic-json.mjs";
import { createRunContext, contextEnv } from "../lib/run-context.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const profiles = JSON.parse(fs.readFileSync(path.join(repoRoot, "scripts", "lib", "script-profiles.json"), "utf8"));
const outputRoot = path.join(repoRoot, "output", "stage-test2");
fs.mkdirSync(outputRoot, { recursive: true });

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function runScript(scriptRelativePath, scriptArgs = [], options = {}) {
  const profile = profiles.scripts[scriptRelativePath] || { profile: "read_only", parallel_safe: true };
  const context = createRunContext({
    prefix: options.prefix || "suite",
    script: scriptRelativePath,
    profile: profile.profile
  });
  const childEnv = contextEnv(context, { sandboxOnly: options.sandboxOnly !== false });
  if (options.failFast) childEnv.STATE_LOCK_FAIL_FAST = "1";
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(repoRoot, scriptRelativePath), ...scriptArgs], {
      cwd: repoRoot,
      env: childEnv,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("close", (code) => {
      resolve({
        script: scriptRelativePath,
        args: scriptArgs,
        profile,
        run_id: context.run_id,
        sandbox_root: context.root,
        code,
        stdout,
        stderr
      });
    });
  });
}

async function runParallelReadOnlySuite() {
  const results = await Promise.all([
    runScript("scripts/ops/compare-scenarios.mjs", ["--from", "data1a_readers_digest_12112025", "--to", "data2_multi_publication_release_candidate"], { prefix: "parallel-ro" }),
    runScript("scripts/ops/evaluate-promotion.mjs", ["--scenario", "data2_multi_publication_release_candidate", "--use-existing-reports"], { prefix: "parallel-ro" })
  ]);
  return {
    suite: "parallel-read-only",
    status: results.every((item) => item.code === 0) ? "passed" : "failed",
    results: results.map((item) => ({
      script: item.script,
      profile: item.profile.profile,
      run_id: item.run_id,
      sandbox_root: item.sandbox_root,
      code: item.code
    }))
  };
}

async function runStatefulConflictSuite() {
  const holder = runScript("scripts/ops/hold-state-lock.mjs", ["4000"], {
    prefix: "stateful-conflict",
    sandboxOnly: true
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
  const blocked = await runScript("scripts/ops/rollback-scenario.mjs", ["--scenario", "data1a_readers_digest_12112025"], {
    prefix: "stateful-conflict",
    sandboxOnly: true,
    failFast: true
  });
  const holderResult = await holder;
  const blockedConflict = blocked.code !== 0 && (blocked.stderr.includes("STATE_LOCK_BUSY") || blocked.stdout.includes("STATE_LOCK_BUSY"));
  return {
    suite: "stateful-conflict",
    status: holderResult.code === 0 && blockedConflict ? "passed" : "failed",
    results: [
      {
        script: holderResult.script,
        profile: holderResult.profile.profile,
        run_id: holderResult.run_id,
        code: holderResult.code
      },
      {
        script: blocked.script,
        profile: blocked.profile.profile,
        run_id: blocked.run_id,
        code: blocked.code,
        blocked: blockedConflict
      }
    ]
  };
}

const args = parseArgs(process.argv.slice(2));
const suite = args.suite || "parallel-read-only";
let report;
if (suite === "parallel-read-only") {
  report = await runParallelReadOnlySuite();
} else if (suite === "stateful-conflict") {
  report = await runStatefulConflictSuite();
} else {
  throw new Error(`TEST2_UNKNOWN_SUITE:${suite}`);
}

report.generated_at = new Date().toISOString();
atomicWriteJson(path.join(outputRoot, "orchestration-report.json"), report);
console.log(JSON.stringify({ status: report.status === "passed" ? "ok" : "failed", suite: report }, null, 2));
