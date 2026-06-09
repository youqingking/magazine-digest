import fs from "node:fs";
import path from "node:path";

import {
  currentRuntimePath,
  readJson,
  runtimeScenarioPath,
  stageTest1OutputPath,
  writeJson
} from "./content-contract.fixtures.mjs";
import {
  defaultScenarioRegistry,
  publishScenarioToCurrent,
  readJson as pipelineReadJson,
  retireScenario,
  setSelectedScenario,
  writeJson as pipelineWriteJson
} from "../import/lib/content-pipeline.mjs";

function snapshotFiles(paths) {
  const snapshot = new Map();
  for (const filePath of paths) {
    snapshot.set(filePath, fs.existsSync(filePath) ? fs.readFileSync(filePath) : null);
  }
  return snapshot;
}

function restoreSnapshot(snapshot) {
  for (const [filePath, content] of snapshot.entries()) {
    if (content === null) {
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
      }
      continue;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }
}

export async function runLifecycleTests() {
  const scenarioIndexPath = runtimeScenarioPath("index.json");
  const selectedPath = runtimeScenarioPath("selected.json");
  const currentMetaPath = currentRuntimePath("scenario-meta.json");
  const currentBundlePath = currentRuntimePath("runtime.bundle.json");
  const snapshot = snapshotFiles([scenarioIndexPath, selectedPath, currentMetaPath, currentBundlePath]);

  try {
    const indexBefore = readJson(scenarioIndexPath);
    const selectedBefore = readJson(selectedPath);
    const baselineScenarioId = selectedBefore.selected_scenario_id;

    const mixedScenarioId = "data1c_three_release_mixed_preview";
    setSelectedScenario({ scenarioId: mixedScenarioId, selectionSource: "test1_lifecycle_select" });
    const selectedAfterSelect = readJson(selectedPath);
    const currentAfterSelect = readJson(currentMetaPath);

    publishScenarioToCurrent({ scenarioId: mixedScenarioId, selectionSource: "test1_lifecycle_publish" });
    const selectedAfterPublish = readJson(selectedPath);
    const currentAfterPublish = readJson(currentMetaPath);

    const scenarioRegistry = pipelineReadJson(scenarioIndexPath, defaultScenarioRegistry());
    const mixedScenario = (scenarioRegistry.items || []).find((item) => item.scenario_id === mixedScenarioId);
    const cloneScenarioId = "stage_test1_preview_clone";
    const cloneBundlePath = runtimeScenarioPath(`${cloneScenarioId}.bundle.json`);
    fs.copyFileSync(path.join(path.dirname(scenarioIndexPath), path.basename(mixedScenario.bundle_path)), cloneBundlePath);
    scenarioRegistry.items.push({
      ...mixedScenario,
      scenario_id: cloneScenarioId,
      bundle_path: `mobile/fixtures/runtime/scenarios/${cloneScenarioId}.bundle.json`,
      status: "active",
      is_selected_for_current: false,
      selected_for_current_at: null
    });
    pipelineWriteJson(scenarioIndexPath, scenarioRegistry);

    retireScenario({ scenarioId: cloneScenarioId, reason: "test1_retire" });
    const afterRetire = readJson(scenarioIndexPath);

    publishScenarioToCurrent({ scenarioId: baselineScenarioId, selectionSource: "test1_lifecycle_rollback" });
    const currentAfterRollback = readJson(currentMetaPath);
    const selectedAfterRollback = readJson(selectedPath);

    const report = {
      generated_at: new Date().toISOString(),
      status:
        selectedAfterSelect.selected_scenario_id === mixedScenarioId &&
        currentAfterSelect.selected_scenario_id !== mixedScenarioId &&
        selectedAfterPublish.selected_scenario_id === mixedScenarioId &&
        currentAfterPublish.selected_scenario_id === mixedScenarioId &&
        (afterRetire.items || []).find((item) => item.scenario_id === cloneScenarioId)?.status === "retired" &&
        fs.existsSync(cloneBundlePath) &&
        currentAfterRollback.selected_scenario_id === baselineScenarioId &&
        selectedAfterRollback.selected_scenario_id === baselineScenarioId
          ? "passed"
          : "failed",
      assertions: {
        baseline_before: baselineScenarioId,
        selected_after_select: selectedAfterSelect.selected_scenario_id,
        current_after_select: currentAfterSelect.selected_scenario_id,
        current_after_publish: currentAfterPublish.selected_scenario_id,
        retired_clone_status: (afterRetire.items || []).find((item) => item.scenario_id === cloneScenarioId)?.status || null,
        clone_bundle_exists: fs.existsSync(cloneBundlePath),
        current_after_rollback: currentAfterRollback.selected_scenario_id
      }
    };

    writeJson(stageTest1OutputPath("lifecycle-report.json"), report);
    if (report.status !== "passed") {
      throw new Error("TEST1_LIFECYCLE_FAILED");
    }
    return report;
  } finally {
    restoreSnapshot(snapshot);
    const cloneBundlePath = runtimeScenarioPath("stage_test1_preview_clone.bundle.json");
    if (fs.existsSync(cloneBundlePath)) {
      fs.rmSync(cloneBundlePath, { force: true });
    }
  }
}
