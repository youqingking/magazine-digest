import path from "node:path";

import { repoRoot, readJson, writeJson } from "../import/lib/content-pipeline.mjs";
import { readSelected, readCurrentMeta } from "../ops/lib/ops-lib.mjs";
import {
  buildRuntimeSourceDiagnostic,
  channelNames,
  readChannelManifest,
  readRuntimeSource,
  restoreH5DevCurrentMirror,
  syncRuntimeSourceRegistry,
  syncScenarioPreviewToH5DevCurrent,
  writeRuntimeSource
} from "../ops/lib/release-channel-lib.mjs";

const outputPath = path.join(repoRoot, "output", "fix-runtime-source", "smoke-report.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const beforeSelected = readSelected();
const beforeCurrent = readCurrentMeta();
const beforeRuntimeSource = readRuntimeSource();
const beforeChannels = Object.fromEntries(channelNames.map((channel) => [channel, readChannelManifest(channel)]));

syncRuntimeSourceRegistry();

const switchedSource = writeRuntimeSource({
  mode: "scenario_preview",
  scenario_id: "data1c_three_release_mixed_preview",
  channel: null,
  release_id: null,
  selection_reason: "smoke_fix_runtime_source_h5_preview"
});
const previewSync = syncScenarioPreviewToH5DevCurrent("data1c_three_release_mixed_preview");
const afterPreview = buildRuntimeSourceDiagnostic(switchedSource);

assert(afterPreview.effective_runtime_source?.mode === "scenario_preview", "preview_mode_not_applied");
assert(afterPreview.effective_runtime_source?.scenario_id === "data1c_three_release_mixed_preview", "preview_scenario_not_applied");
for (const publication of ["barrons", "the_atlantic", "the_economist"]) {
  assert(afterPreview.visible_publications.includes(publication), `missing_publication:${publication}`);
}
assert(readSelected().selected_scenario_id === beforeSelected.selected_scenario_id, "selected_pointer_changed");
for (const channel of channelNames) {
  assert(
    JSON.stringify(readChannelManifest(channel)) === JSON.stringify(beforeChannels[channel]),
    `channel_manifest_changed:${channel}`
  );
}

const restoredSource = writeRuntimeSource({
  mode: "current_mirror",
  scenario_id: null,
  channel: null,
  release_id: null,
  selection_reason: "smoke_fix_runtime_source_h5_restore"
});
const restoreSync = restoreH5DevCurrentMirror();
const afterRestore = buildRuntimeSourceDiagnostic(restoredSource);

assert(afterRestore.runtime_source?.mode === "current_mirror", "restore_mode_not_current");
assert(readSelected().selected_scenario_id === beforeSelected.selected_scenario_id, "selected_pointer_not_restored");
for (const channel of channelNames) {
  assert(
    JSON.stringify(readChannelManifest(channel)) === JSON.stringify(beforeChannels[channel]),
    `channel_manifest_drift_after_restore:${channel}`
  );
}

const report = {
  generated_at: new Date().toISOString(),
  status: "passed",
  before: {
    runtime_source: beforeRuntimeSource,
    selected_scenario_id: beforeSelected.selected_scenario_id || null,
    current_scenario_id: beforeCurrent.selected_scenario_id || null
  },
  preview_switch: {
    runtime_source: switchedSource,
    h5_dev_sync: previewSync,
    diagnostic: afterPreview
  },
  restore: {
    runtime_source: restoredSource,
    h5_dev_sync: restoreSync,
    diagnostic: afterRestore
  }
};

writeJson(outputPath, report);
console.log(JSON.stringify(report, null, 2));
