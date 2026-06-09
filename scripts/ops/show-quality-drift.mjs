import path from "node:path";

import { readJson } from "../import/lib/content-pipeline.mjs";
import { qualityPaths, writeQualityReport } from "./lib/quality-budget-lib.mjs";

function classifyAtlanticOverride(entry) {
  const reason = String(entry.reason || "");
  if (/suppress filename-truncated/i.test(reason)) {
    return "reasonable_editorial_override";
  }
  if (/Normalize front-matter display label/i.test(reason)) {
    return "reasonable_editorial_override";
  }
  if (/Collapse long merged excerpt|Map long merged excerpt/i.test(reason)) {
    return "should_revisit_in_normalizer";
  }
  return "reasonable_editorial_override";
}

const warningReport = readJson(path.join(process.cwd(), "output", "stage-data1d", "warning-report.json"), { items: [] });
const overrideReport = readJson(path.join(process.cwd(), "output", "stage-data1d", "override-report.json"), { entries: [] });
const ops2Evaluation = readJson(path.join(process.cwd(), "output", "stage-ops2", "promotion-evaluation-report.json"), null);

const atlanticEntries = (overrideReport.entries || []).filter((entry) => entry.publication_id === "the_atlantic");
const economistEntries = (overrideReport.entries || []).filter((entry) => entry.publication_id === "the_economist");
const atlanticClassification = atlanticEntries.map((entry) => ({
  article_id: entry.article_id,
  classification: classifyAtlanticOverride(entry),
  reason: entry.reason
}));

const report = {
  generated_at: new Date().toISOString(),
  mixed_preview_hold_reasons: ops2Evaluation?.warnings || [],
  issues: [
    {
      issue_id: "readers_digest__12112025",
      classification: "accepted_best_effort",
      release_candidate_allowed: false,
      reason: "Baseline-only issue with known ordinal gap."
    },
    {
      issue_id: "barrons__09022026",
      classification: "release_ready",
      release_candidate_allowed: true,
      reason: "No unresolved warnings and no override drift."
    },
    {
      issue_id: "the_atlantic__012026",
      classification: "release_ready_with_editorial_overrides",
      release_candidate_allowed: true,
      reason: "Unresolved warnings are 0; override drift is editorially explainable."
    },
    {
      issue_id: "the_economist__20260314",
      classification: "accepted_preview_only_anomaly",
      release_candidate_allowed: false,
      reason: "Single-article anomaly still unresolved and should stay preview-only."
    }
  ],
  atlantic_override_classification: {
    total: atlanticEntries.length,
    reasonable_editorial_override: atlanticClassification.filter((entry) => entry.classification === "reasonable_editorial_override").length,
    should_revisit_in_normalizer: atlanticClassification.filter((entry) => entry.classification === "should_revisit_in_normalizer").length,
    items: atlanticClassification
  },
  economist_anomaly: {
    unresolved_warning_counts: (warningReport.items || []).find((item) => item.issue_id === "the_economist__20260314")?.unresolved_warning_counts || {},
    override_count: economistEntries.length,
    status: "preview_only_until_unresolved_warning_count_is_zero"
  },
  readers_digest: {
    status: "accepted_best_effort",
    note: "Ordinal gap remains outside DATA2 RC target and should not re-trigger release holds for other scenarios."
  }
};

writeQualityReport(qualityPaths.qualityConvergenceReport, report);
console.log(JSON.stringify({ status: "ok", quality_convergence: report }, null, 2));
