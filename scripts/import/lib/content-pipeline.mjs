import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { atomicWriteJson, atomicWriteText } from "../../lib/atomic-json.mjs";
import { resolveSandboxPath } from "../../lib/sandbox-paths.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "..", "..", "..");

export const pipelinePaths = {
  repoRoot,
  dataRoot: path.join(repoRoot, "data", "real-content"),
  overridesRoot: path.join(repoRoot, "data", "real-content", "overrides"),
  publicationsRegistry: path.join(repoRoot, "data", "real-content", "publications.json"),
  issuesRegistry: path.join(repoRoot, "data", "real-content", "issues.json"),
  runtimeBaseIndex: path.join(repoRoot, "mobile", "fixtures", "runtime", "index.js"),
  runtimeScenarioRoot: path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios"),
  runtimeScenarioIndex: path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios", "index.json"),
  runtimeScenarioSelected: path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios", "selected.json"),
  runtimeCurrentRoot: path.join(repoRoot, "mobile", "fixtures", "runtime", "current"),
  stageData1bOutputRoot: path.join(repoRoot, "output", "stage-data1b")
};

export function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

export function writeJson(filePath, value) {
  atomicWriteJson(resolveSandboxPath(repoRoot, filePath), value);
}

export function writeText(filePath, value) {
  atomicWriteText(resolveSandboxPath(repoRoot, filePath), value, "utf8");
}

export function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function toRepoRelative(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

export function upsertBy(items, keyField, nextValue) {
  const nextItems = Array.isArray(items) ? [...items] : [];
  const keyValue = nextValue[keyField];
  const existingIndex = nextItems.findIndex((item) => item[keyField] === keyValue);

  if (existingIndex >= 0) {
    nextItems[existingIndex] = {
      ...nextItems[existingIndex],
      ...nextValue
    };
    return nextItems;
  }

  nextItems.push(nextValue);
  return nextItems;
}

export function defaultPublicationsRegistry() {
  return {
    version: "stage-data1b-v1",
    generated_at: null,
    items: []
  };
}

export function defaultIssuesRegistry() {
  return {
    version: "stage-data1b-v1",
    generated_at: null,
    items: []
  };
}

export function defaultScenarioRegistry() {
  return {
    version: "stage-data1b-v1",
    generated_at: null,
    selected_scenario_id: null,
    items: []
  };
}

export async function loadRuntimeFixturesFromFile(filePath) {
  const cacheBustUrl = `${pathToFileURL(filePath).href}?ts=${Date.now()}`;
  const module = await import(cacheBustUrl);
  return module.default;
}

export async function loadBaseRuntimeFixtures() {
  return loadRuntimeFixturesFromFile(pipelinePaths.runtimeBaseIndex);
}

export function loadStageGFallbackBundle() {
  const fallbackPath = path.join(pipelinePaths.runtimeScenarioRoot, "s18_promo_code_apply_preview.bundle.json");
  return readJson(fallbackPath, null);
}

export function writeCurrentRuntimeMirror(bundle, selectionMeta = {}) {
  ensureDir(pipelinePaths.runtimeCurrentRoot);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "runtime.bundle.json"), bundle);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "bootstrap-config.json"), bundle.bootstrapConfig);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "content-sync-delta.json"), bundle.contentSyncDelta);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "content-detail.json"), bundle.contentDetail);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "entitlement-snapshot.json"), bundle.entitlementSnapshot);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "pricing-preview.json"), bundle.pricingPreview);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "experiment-assign.json"), bundle.experimentAssign);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "commercial-offer.json"), bundle.stageG.commercialOffer);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "quota-status.json"), bundle.stageG.quotaStatus);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "promo-preview.json"), bundle.stageG.promoPreview);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "referral-summary.json"), bundle.stageG.referralSummary);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "reward-summary.json"), bundle.stageG.rewardSummary);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "campaign-landing.json"), bundle.stageG.campaignLanding);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "profile-benefits.json"), bundle.stageG.profileBenefits);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "scenario-meta.json"), bundle.metadata);
  writeJson(path.join(pipelinePaths.runtimeCurrentRoot, "expected-outcomes.json"), {
    selected_scenario_id: selectionMeta.scenario_id || bundle.metadata?.scenario_id || null,
    runtime_fixture_role: bundle.metadata?.runtime_fixture_role || null,
    source_kind: bundle.metadata?.source_kind || null,
    notes: [
      "current runtime is a generated mirror of the selected named scenario",
      "edit scenario bundles and registries instead of mutating current directly"
    ]
  });
  writeText(
    path.join(pipelinePaths.runtimeCurrentRoot, "index.js"),
    `const runtimeFixtures = ${JSON.stringify(bundle, null, 2)};\n\nexport default runtimeFixtures;\n`
  );
}

export function publishScenarioToCurrent({ scenarioId, selectionSource = "manual_publish" }) {
  const scenarioRegistry = readJson(pipelinePaths.runtimeScenarioIndex, defaultScenarioRegistry());
  const scenarioRecord = (scenarioRegistry.items || []).find((item) => item.scenario_id === scenarioId);

  if (!scenarioRecord) {
    throw new Error(`DATA1B_SCENARIO_NOT_FOUND:${scenarioId}`);
  }

  const bundlePath = path.join(repoRoot, scenarioRecord.bundle_path);
  const bundle = readJson(bundlePath);
  if (!bundle) {
    throw new Error(`DATA1B_SCENARIO_BUNDLE_MISSING:${scenarioRecord.bundle_path}`);
  }

  const publishedAt = new Date().toISOString();
  const mirroredBundle = {
    ...bundle,
    metadata: {
      ...bundle.metadata,
      selected_scenario_id: scenarioId,
      runtime_fixture_role: "selected_scenario_mirror",
      published_to_current_at: publishedAt,
      selection_source: selectionSource
    }
  };

  const nextScenarioItems = (scenarioRegistry.items || []).map((item) => ({
    ...item,
    is_selected_for_current: item.scenario_id === scenarioId,
    selected_for_current_at: item.scenario_id === scenarioId ? publishedAt : null
  }));
  writeJson(pipelinePaths.runtimeScenarioIndex, {
    ...scenarioRegistry,
    generated_at: publishedAt,
    selected_scenario_id: scenarioId,
    items: nextScenarioItems
  });

  writeJson(pipelinePaths.runtimeScenarioSelected, {
    version: "stage-data1b-v1",
    selected_scenario_id: scenarioId,
    selected_at: publishedAt,
    selection_source: selectionSource,
    published_to_current: true,
    published_at: publishedAt,
    bundle_path: scenarioRecord.bundle_path,
    build_label: scenarioRecord.build_label || null,
    included_publications: scenarioRecord.included_publications || [],
    included_issues: scenarioRecord.included_issues || []
  });

  writeCurrentRuntimeMirror(mirroredBundle, { scenario_id: scenarioId });

  return {
    scenarioId,
    bundlePath: scenarioRecord.bundle_path,
    selectedAt: publishedAt
  };
}

export function setSelectedScenario({ scenarioId, selectionSource = "manual_select" }) {
  const scenarioRegistry = readJson(pipelinePaths.runtimeScenarioIndex, defaultScenarioRegistry());
  const scenarioRecord = (scenarioRegistry.items || []).find((item) => item.scenario_id === scenarioId);

  if (!scenarioRecord) {
    throw new Error(`DATA1D_SCENARIO_NOT_FOUND:${scenarioId}`);
  }

  const selectedAt = new Date().toISOString();
  writeJson(pipelinePaths.runtimeScenarioIndex, {
    ...scenarioRegistry,
    generated_at: selectedAt,
    selected_scenario_id: scenarioId,
    items: (scenarioRegistry.items || []).map((item) => ({
      ...item,
      is_selected_for_current: item.scenario_id === scenarioId ? item.is_selected_for_current : item.is_selected_for_current,
      selected_for_current_at: item.scenario_id === scenarioId && item.is_selected_for_current ? item.selected_for_current_at : item.selected_for_current_at || null
    }))
  });
  writeJson(pipelinePaths.runtimeScenarioSelected, {
    version: "stage-data1b-v1",
    selected_scenario_id: scenarioId,
    selected_at: selectedAt,
    selection_source: selectionSource,
    published_to_current: false,
    published_at: null,
    bundle_path: scenarioRecord.bundle_path,
    build_label: scenarioRecord.build_label || null,
    included_publications: scenarioRecord.included_publications || [],
    included_issues: scenarioRecord.included_issues || []
  });

  return {
    scenarioId,
    selectedAt
  };
}

export function publishSelectedScenarioToCurrent({ selectionSource = "selected_publish" } = {}) {
  const selectedState = readJson(pipelinePaths.runtimeScenarioSelected, null);
  if (!selectedState?.selected_scenario_id) {
    throw new Error("DATA1D_NO_SELECTED_SCENARIO");
  }
  return publishScenarioToCurrent({
    scenarioId: selectedState.selected_scenario_id,
    selectionSource
  });
}

export function retireScenario({ scenarioId, reason = "manual_retire" }) {
  const scenarioRegistry = readJson(pipelinePaths.runtimeScenarioIndex, defaultScenarioRegistry());
  const selectedState = readJson(pipelinePaths.runtimeScenarioSelected, null);
  const existing = (scenarioRegistry.items || []).find((item) => item.scenario_id === scenarioId);

  if (!existing) {
    throw new Error(`DATA1D_SCENARIO_NOT_FOUND:${scenarioId}`);
  }
  if (selectedState?.selected_scenario_id === scenarioId && selectedState?.published_to_current) {
    throw new Error(`DATA1D_CANNOT_RETIRE_CURRENT:${scenarioId}`);
  }

  const retiredAt = new Date().toISOString();
  writeJson(pipelinePaths.runtimeScenarioIndex, {
    ...scenarioRegistry,
    generated_at: retiredAt,
    items: (scenarioRegistry.items || []).map((item) => item.scenario_id === scenarioId ? {
      ...item,
      status: "retired",
      retired_at: retiredAt,
      retired_reason: reason,
      is_selected_for_current: false,
      selected_for_current_at: null
    } : item)
  });

  return {
    scenarioId,
    retiredAt
  };
}
