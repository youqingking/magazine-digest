import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pipelinePaths } from "../import/lib/content-pipeline.mjs";
import { releaseStateLock, readLocks } from "../lib/state-lock.mjs";
import { atomicWriteText } from "../lib/atomic-json.mjs";

const args = process.argv.slice(2);
const runIdIndex = args.indexOf("--run-id");
const runId = runIdIndex >= 0 ? args[runIdIndex + 1] : null;
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const baselineScenarioId = "data1a_readers_digest_12112025";

const report = {
  generated_at: new Date().toISOString(),
  status: "ok",
  run_id: runId,
  cleaned_locks: [],
  restored_state: {
    selected_scenario_id: null,
    current_scenario_id: null
  }
};

for (const lock of readLocks()) {
  fs.rmSync(lock.file, { force: true });
  report.cleaned_locks.push(lock.payload);
}

if (runId) {
  const snapshotPath = path.join(repoRoot, "output", "runs", runId, "runtime-state-snapshot.json");
  if (fs.existsSync(snapshotPath)) {
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
    if (snapshot.selected) atomicWriteText(pipelinePaths.runtimeScenarioSelected, snapshot.selected.toString("utf8"));
    if (snapshot.index) atomicWriteText(pipelinePaths.runtimeScenarioIndex, snapshot.index.toString("utf8"));
    if (snapshot.currentMeta) atomicWriteText(path.join(pipelinePaths.runtimeCurrentRoot, "scenario-meta.json"), snapshot.currentMeta.toString("utf8"));
    if (snapshot.currentBundle) atomicWriteText(path.join(pipelinePaths.runtimeCurrentRoot, "runtime.bundle.json"), snapshot.currentBundle.toString("utf8"));
  }
}

report.restored_state.selected_scenario_id = baselineScenarioId;
report.restored_state.current_scenario_id = baselineScenarioId;
console.log(JSON.stringify({ status: "ok", recovery: report }, null, 2));
