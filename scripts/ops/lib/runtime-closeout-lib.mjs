import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import { repoRoot, pipelinePaths, readJson, writeJson, writeText, toRepoRelative } from "../../import/lib/content-pipeline.mjs";

const defaultBaselineTag = "baseline-ui3-data1d-test1-ops1";

export const runtimeCloseoutPaths = {
  evidenceRoot: path.join(repoRoot, "ops", "closeout", "ui35"),
  screenshotsRoot: path.join(repoRoot, "ops", "closeout", "ui35", "screenshots"),
  notesRoot: path.join(repoRoot, "ops", "closeout", "ui35", "notes"),
  templatesRoot: path.join(repoRoot, "ops", "closeout", "ui35", "templates"),
  outputRoot: path.join(repoRoot, "output", "stage-rc1"),
  runtimeContext: path.join(repoRoot, "output", "stage-rc1", "runtime-context.json"),
  runtimeTemplate: path.join(repoRoot, "output", "stage-rc1", "runtime-closeout-template.json"),
  manualChecklist: path.join(repoRoot, "output", "stage-rc1", "manual-checklist.md"),
  finalReport: path.join(repoRoot, "output", "stage-rc1", "final-closeout-report.json")
};

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

export function ensureRuntimeCloseoutDirs() {
  ensureDir(runtimeCloseoutPaths.evidenceRoot);
  ensureDir(runtimeCloseoutPaths.screenshotsRoot);
  ensureDir(runtimeCloseoutPaths.notesRoot);
  ensureDir(runtimeCloseoutPaths.templatesRoot);
  ensureDir(runtimeCloseoutPaths.outputRoot);
}

function runGit(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  }).trim();
}

function tryRunGit(args) {
  try {
    return runGit(args);
  } catch {
    return null;
  }
}

async function importModuleValue(filePath, exportName) {
  const moduleUrl = `${pathToFileURL(filePath).href}?ts=${Date.now()}`;
  const module = await import(moduleUrl);
  return exportName ? module[exportName] : module.default;
}

export const manualChecklistItems = [
  {
    id: "tabbar_three_tabs",
    title: "Bottom tab bar shows exactly 3 tabs",
    severity: "blocker",
    screenshot_required: true,
    required_text_keys: ["observed_tab_count", "observed_tab_labels"]
  },
  {
    id: "tabbar_feed_search_profile",
    title: "Tabs are feed, search or 来源, and profile; second tab still routes to /pages/search/index",
    severity: "blocker",
    screenshot_required: true,
    required_text_keys: ["observed_second_tab_label", "observed_search_route_note"]
  },
  {
    id: "detail_entry_content_only",
    title: "detail is entered only from content click",
    severity: "blocker",
    screenshot_required: true,
    required_text_keys: ["detail_entry_surface"]
  },
  {
    id: "detail_default_quick_30s",
    title: "detail defaults to quick_30s",
    severity: "blocker",
    screenshot_required: true,
    required_text_keys: ["detail_article_id", "default_mode_observed"]
  },
  {
    id: "detail_switch_deep_3m",
    title: "detail switches to deep_3m correctly",
    severity: "blocker",
    screenshot_required: true,
    required_text_keys: ["deep_mode_toggle_result"]
  },
  {
    id: "detail_return_feed_state",
    title: "Returning from detail to feed restores feed state normally",
    severity: "blocker",
    screenshot_required: true,
    required_text_keys: ["feed_restore_note"]
  },
  {
    id: "settings_build_audit_visible",
    title: "settings shows Build Audit",
    severity: "blocker",
    screenshot_required: true,
    required_text_keys: ["observed_build_branch", "observed_build_sha", "observed_build_baseline_tag"]
  },
  {
    id: "runtime_package_from_current_source",
    title: "Running package provenance matches current source expectations",
    severity: "blocker",
    screenshot_required: true,
    required_text_keys: ["provenance_check_note", "observed_build_timestamp"]
  },
  {
    id: "scenario_alignment",
    title: "selected/current scenario information matches expected context",
    severity: "blocker",
    screenshot_required: true,
    required_text_keys: ["observed_runtime_scenario_id", "observed_current_mirror_scenario_id"]
  },
  {
    id: "non_tab_routes_reachable",
    title: "paywall, invite, and settings remain reachable as non-tab formal entries",
    severity: "blocker",
    screenshot_required: true,
    required_text_keys: ["paywall_entry_note", "invite_entry_note", "settings_entry_note"]
  },
  {
    id: "baseline_or_mixed_stable",
    title: "baseline or mixed scenario does not crash core pages during manual run",
    severity: "blocker",
    screenshot_required: true,
    required_text_keys: ["scenario_exercised", "stability_observation"]
  },
  {
    id: "no_detail_compile_regression",
    title: "No recurring detail template compile/runtime error appears",
    severity: "blocker",
    screenshot_required: true,
    required_text_keys: ["compile_surface_checked", "compile_check_note"]
  }
];

export async function buildRuntimeContext() {
  ensureRuntimeCloseoutDirs();

  const buildMeta = await importModuleValue(path.join(repoRoot, "mobile", "services", "build-meta.service.js"), "getBuildMeta")
    .then((getBuildMeta) => getBuildMeta())
    .catch(() => ({}));
  const currentFixtures = await importModuleValue(path.join(pipelinePaths.runtimeCurrentRoot, "index.js")).catch(() => ({}));
  const selectedState = readJson(pipelinePaths.runtimeScenarioSelected, {});
  const currentMeta = readJson(path.join(pipelinePaths.runtimeCurrentRoot, "scenario-meta.json"), {});
  const gateReport = readJson(path.join(repoRoot, "output", "stage-ops1", "publish-gate-report.json"), null);
  const operatorCatalog = readJson(path.join(repoRoot, "output", "stage-ops1", "operator-catalog.json"), null);
  const test1Final = readJson(path.join(repoRoot, "output", "stage-test1", "final-report.json"), null);

  const branch = tryRunGit(["branch", "--show-current"]);
  const headSha = tryRunGit(["rev-parse", "HEAD"]);
  const headShortSha = tryRunGit(["rev-parse", "--short", "HEAD"]);
  const baselineCommit = tryRunGit(["rev-list", "-n", "1", defaultBaselineTag]);
  let baselineReachable = false;
  if (baselineCommit && headSha) {
    try {
      runGit(["merge-base", "--is-ancestor", baselineCommit, headSha]);
      baselineReachable = true;
    } catch {
      baselineReachable = false;
    }
  }

  const context = {
    generated_at: new Date().toISOString(),
    stage: "RC1",
    canonical_design_source: "docs/design-handoff/stitch-ui1_5/",
    git: {
      branch,
      head_sha: headSha,
      head_short_sha: headShortSha,
      baseline_tag: defaultBaselineTag,
      baseline_commit: baselineCommit,
      baseline_reachable_from_head: baselineReachable
    },
    build_audit_source: {
      ...buildMeta,
      matches_current_branch: Boolean(buildMeta?.branch && branch && buildMeta.branch === branch),
      matches_current_sha: Boolean(buildMeta?.shortSha && headShortSha && buildMeta.shortSha === headShortSha)
    },
    selected_scenario: selectedState,
    current_runtime: {
      metadata: currentMeta,
      fixture_metadata: currentFixtures?.metadata || {}
    },
    ops: {
      latest_gate_report: gateReport,
      latest_operator_catalog: operatorCatalog
        ? {
            generated_at: operatorCatalog.generated_at,
            selected_scenario_id: operatorCatalog.selected_scenario_id,
            current_scenario_id: operatorCatalog.current_scenario_id,
            latest_gate_status: operatorCatalog.latest_gate_status
          }
        : null,
      latest_test1: test1Final
        ? {
            generated_at: test1Final.generated_at,
            status: test1Final.status
          }
        : null
    },
    manual_verification_targets: {
      expected_tab_routes: ["pages/feed/index", "pages/search/index", "pages/profile/index"],
      detail_default_mode: "quick_30s",
      detail_secondary_mode: "deep_3m",
      required_non_tab_routes: ["paywall", "invite", "settings"]
    },
    evidence_paths: {
      evidence_root: toRepoRelative(runtimeCloseoutPaths.evidenceRoot),
      screenshots_root: toRepoRelative(runtimeCloseoutPaths.screenshotsRoot),
      notes_root: toRepoRelative(runtimeCloseoutPaths.notesRoot),
      template_output: toRepoRelative(runtimeCloseoutPaths.runtimeTemplate),
      final_report: toRepoRelative(runtimeCloseoutPaths.finalReport)
    }
  };

  writeJson(runtimeCloseoutPaths.runtimeContext, context);
  return context;
}

export function buildRuntimeTemplate(context) {
  return {
    template_version: "rc1-runtime-closeout-v1",
    generated_at: new Date().toISOString(),
    status_note: "Manual runtime evidence required. Pending or empty fields must not be treated as pass.",
    context_summary: {
      expected_branch: context.git.branch,
      expected_head_sha: context.git.head_short_sha,
      baseline_tag: context.git.baseline_tag,
      selected_scenario_id: context.selected_scenario?.selected_scenario_id || null,
      current_runtime_scenario_id: context.current_runtime?.metadata?.scenario_id || null,
      current_mirror_scenario_id: context.current_runtime?.metadata?.selected_scenario_id || null,
      latest_gate_status: context.ops?.latest_gate_report?.status || null,
      latest_gate_warnings: context.ops?.latest_gate_report?.warnings || []
    },
    runtime_target: {
      platform: "",
      surface: "",
      operator: "",
      executed_at: ""
    },
    evidence: {
      notes: [],
      screenshots: []
    },
    manual_items: manualChecklistItems.map((item) => ({
      ...item,
      status: "pending",
      evidence_paths: [],
      text_values: Object.fromEntries(item.required_text_keys.map((key) => [key, ""])),
      operator_note: ""
    }))
  };
}

export function buildManualChecklistMarkdown(context) {
  const lines = [
    "# RC1 Manual Runtime Checklist",
    "",
    `- generated_at: ${new Date().toISOString()}`,
    `- expected_branch: ${context.git.branch || "unknown"}`,
    `- expected_head_sha: ${context.git.head_short_sha || "unknown"}`,
    `- baseline_tag: ${context.git.baseline_tag || "unknown"}`,
    `- selected_scenario_id: ${context.selected_scenario?.selected_scenario_id || "unknown"}`,
    `- current_runtime_scenario_id: ${context.current_runtime?.metadata?.scenario_id || "unknown"}`,
    `- current_mirror_scenario_id: ${context.current_runtime?.metadata?.selected_scenario_id || "unknown"}`,
    "",
    "Fill `output/stage-rc1/runtime-closeout-template.json` while running a real H5 or HBuilderX session.",
    "",
    "## Blocker Items"
  ];

  for (const [index, item] of manualChecklistItems.entries()) {
    lines.push(`${index + 1}. ${item.title}`);
    lines.push(`- id: ${item.id}`);
    lines.push(`- screenshot_required: ${item.screenshot_required ? "yes" : "no"}`);
    lines.push(`- required_text_keys: ${item.required_text_keys.join(", ")}`);
  }

  return lines.join("\n") + "\n";
}

export function writePreparedArtifacts(context) {
  const template = buildRuntimeTemplate(context);
  writeJson(runtimeCloseoutPaths.runtimeTemplate, template);
  writeText(runtimeCloseoutPaths.manualChecklist, buildManualChecklistMarkdown(context));
  return template;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function pathExistsFromRepo(relativeOrAbsolutePath) {
  const resolved = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(repoRoot, relativeOrAbsolutePath);
  return fs.existsSync(resolved);
}

export function finalizeRuntimeCloseout() {
  ensureRuntimeCloseoutDirs();
  const context = readJson(runtimeCloseoutPaths.runtimeContext, null);
  const template = readJson(runtimeCloseoutPaths.runtimeTemplate, null);
  const blockers = [];
  const warnings = [];

  if (!context) {
    blockers.push("runtime_context_missing");
  }
  if (!template) {
    blockers.push("runtime_template_missing");
  }

  if (!template) {
    const report = {
      generated_at: new Date().toISOString(),
      status: "NO",
      evidence_present: false,
      manual_items_passed: [],
      manual_items_missing: manualChecklistItems.map((item) => item.id),
      blockers,
      warnings
    };
    writeJson(runtimeCloseoutPaths.finalReport, report);
    return report;
  }

  const runtimeTarget = template.runtime_target || {};
  if (!isNonEmptyString(runtimeTarget.platform)) blockers.push("runtime_target_platform_missing");
  if (!isNonEmptyString(runtimeTarget.surface)) blockers.push("runtime_target_surface_missing");
  if (!isNonEmptyString(runtimeTarget.operator)) blockers.push("runtime_target_operator_missing");
  if (!isNonEmptyString(runtimeTarget.executed_at)) blockers.push("runtime_target_executed_at_missing");

  const allScreenshotRefs = new Set();
  const manualItemsPassed = [];
  const manualItemsMissing = [];

  for (const canonicalItem of manualChecklistItems) {
    const filledItem = (template.manual_items || []).find((item) => item.id === canonicalItem.id);
    if (!filledItem) {
      manualItemsMissing.push(canonicalItem.id);
      blockers.push(`manual_item_missing:${canonicalItem.id}`);
      continue;
    }

    if (filledItem.status === "pass") {
      manualItemsPassed.push(canonicalItem.id);
    } else if (filledItem.status === "fail") {
      blockers.push(`manual_item_failed:${canonicalItem.id}`);
    } else {
      manualItemsMissing.push(canonicalItem.id);
      blockers.push(`manual_item_not_passed:${canonicalItem.id}`);
    }

    if (canonicalItem.screenshot_required) {
      const evidencePaths = Array.isArray(filledItem.evidence_paths) ? filledItem.evidence_paths.filter(isNonEmptyString) : [];
      if (evidencePaths.length === 0) {
        blockers.push(`manual_item_screenshot_missing:${canonicalItem.id}`);
      }
      for (const evidencePath of evidencePaths) {
        allScreenshotRefs.add(evidencePath);
        if (!pathExistsFromRepo(evidencePath)) {
          blockers.push(`manual_item_screenshot_not_found:${canonicalItem.id}:${evidencePath}`);
        }
      }
    }

    const textValues = filledItem.text_values || {};
    for (const key of canonicalItem.required_text_keys) {
      if (!isNonEmptyString(textValues[key])) {
        blockers.push(`manual_item_text_missing:${canonicalItem.id}:${key}`);
      }
    }
  }

  const evidencePresent = blockers.every((entry) =>
    !entry.includes("screenshot") && !entry.includes("runtime_target") && !entry.includes("text_missing")
  )
    ? allScreenshotRefs.size > 0
    : false;

  const gateWarnings = context?.ops?.latest_gate_report?.warnings || [];
  for (const warning of gateWarnings) {
    warnings.push(`upstream_gate_warning:${warning}`);
  }

  if (context?.build_audit_source?.matches_current_branch === false) {
    blockers.push("build_audit_branch_mismatch");
  }
  if (context?.build_audit_source?.matches_current_sha === false) {
    blockers.push("build_audit_sha_mismatch");
  }

  const report = {
    generated_at: new Date().toISOString(),
    status: blockers.length === 0 && evidencePresent ? "YES" : "NO",
    evidence_present: evidencePresent,
    manual_items_passed: manualItemsPassed,
    manual_items_missing: manualItemsMissing,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings))
  };

  writeJson(runtimeCloseoutPaths.finalReport, report);
  return report;
}
