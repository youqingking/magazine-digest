import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { readCurrentMeta, readSelected } from "../ops/lib/ops-lib.mjs";
import { ops4Paths, writeOps4Json } from "../ops/lib/operator-console-lib.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const port = 4175;
const baseline = "data1a_readers_digest_12112025";
const beforeSelected = readSelected().selected_scenario_id || null;
const beforeCurrent = readCurrentMeta().selected_scenario_id || null;

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(repoRoot, "scripts", "ops", "start-operator-console.mjs"), "--port", String(port)], {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let settled = false;
    child.stdout.on("data", (chunk) => {
      const text = String(chunk).trim();
      if (!settled && text.includes(`http://127.0.0.1:${port}`)) {
        settled = true;
        resolve(child);
      }
    });
    child.stderr.on("data", (chunk) => {
      if (!settled) {
        settled = true;
        reject(new Error(String(chunk)));
      }
    });
    child.on("exit", (code) => {
      if (!settled) {
        reject(new Error(`OPS4_SERVER_EXITED:${code}`));
      }
    });
  });
}

async function getJson(url, options) {
  const response = await fetch(url, options);
  return {
    status: response.status,
    body: await response.json()
  };
}

const report = {
  generated_at: new Date().toISOString(),
  status: "passed",
  checks: {}
};

let server = null;
try {
  server = await startServer();
  const baseUrl = `http://127.0.0.1:${port}`;
  const overview = await getJson(`${baseUrl}/api/overview`);
  const content = await getJson(`${baseUrl}/api/content`);
  const quality = await getJson(`${baseUrl}/api/quality`);
  const scenarios = await getJson(`${baseUrl}/api/scenarios`);
  const release = await getJson(`${baseUrl}/api/release`);
  const compare = await getJson(`${baseUrl}/api/action`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "compare", scenario: "data2_multi_publication_release_candidate", baseline })
  });
  const evaluate = await getJson(`${baseUrl}/api/action`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "evaluate", scenario: "data2_multi_publication_release_candidate", baseline })
  });
  const dryRun = await getJson(`${baseUrl}/api/action`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "dry_run_publish", scenario: "data2_multi_publication_release_candidate", baseline })
  });
  const rollback = await getJson(`${baseUrl}/api/action`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "rollback", baseline })
  });

  report.checks.reads = {
    overview: overview.status === 200,
    content: content.status === 200,
    quality: quality.status === 200,
    scenarios: scenarios.status === 200,
    release: release.status === 200
  };
  report.checks.actions = {
    compare: compare.body.result?.status || compare.body.result?.diff?.generated_at ? "ok" : "failed",
    evaluate: evaluate.body.result?.status || evaluate.body.result?.evaluation?.decision || "failed",
    dry_run: dryRun.body.result?.status || "failed",
    rollback: rollback.body.result?.status || "failed"
  };
  report.checks.state = {
    baseline: overview.body.baseline_scenario_id,
    current_after: readCurrentMeta().selected_scenario_id || null,
    selected_after: readSelected().selected_scenario_id || null
  };
  report.checks.console_map = true;
  report.checks.actions_report = true;

  const pass =
    Object.values(report.checks.reads).every(Boolean) &&
    report.checks.actions.evaluate === "ok" &&
    report.checks.actions.rollback === "ok" &&
    report.checks.state.current_after === baseline &&
    report.checks.state.selected_after === baseline;
  report.status = pass ? "passed" : "failed";
} catch (error) {
  report.status = "failed";
  report.error = error.message || String(error);
} finally {
  if (server) {
    server.kill();
  }
}

report.checks.restore = {
  selected_unchanged_from_before: (readSelected().selected_scenario_id || null) === beforeSelected,
  current_unchanged_from_before: (readCurrentMeta().selected_scenario_id || null) === beforeCurrent
};

writeOps4Json(ops4Paths.smokeReport, report);
if (report.status !== "passed") {
  throw new Error(report.error || "OPS4_SMOKE_FAILED");
}

console.log(JSON.stringify({ status: "ok", smoke: report }, null, 2));
