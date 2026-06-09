import path from "node:path";

import { loadNormalizedRecords, readJson, repoRoot, stageTest1OutputPath, writeJson } from "./content-contract.fixtures.mjs";

function validateRequired(record) {
  const missing = [];
  const checks = {
    publication_id: Boolean(record.publication_id || record.publication_key),
    publication_display_name: Boolean(record.publication_display_name || record.publication_name),
    issue_label: Boolean(record.issue_label),
    title: Boolean(record.title),
    quick_30s: Boolean(record.quick_30s),
    deep_3m: Boolean(record.deep_3m),
    teen_quick_30s: Boolean(record.teen_quick_30s),
    teen_deep_3m: Boolean(record.teen_deep_3m),
    general_quick_30s: Boolean(record.general_quick_30s),
    general_deep_3m: Boolean(record.general_deep_3m),
    compliance_status: Boolean(record.compliance_status),
    section_label: Boolean(record.section_label),
    import_warnings: Array.isArray(record.import_warnings) || record.import_warnings === undefined
  };
  for (const [field, present] of Object.entries(checks)) {
    if (!present) {
      missing.push(field);
    }
  }
  return missing;
}

function validateBestEffort(record, policy) {
  const warnings = [];
  if (policy.ordinal === "required" && !Number.isFinite(Number(record.ordinal))) {
    warnings.push({ type: "missing_required_ordinal", article_id: record.article_id });
  }
  if (policy.ordinal === "best_effort" && !Number.isFinite(Number(record.ordinal))) {
    warnings.push({ type: "best_effort_ordinal_missing", article_id: record.article_id });
  }
  return warnings;
}

function summarizeIssue(issueId, publicationId, issueLabel, policy) {
  const records = loadNormalizedRecords(publicationId, issueLabel);
  const blockers = [];
  const warnings = [];

  for (const record of records) {
    const missingRequired = validateRequired(record);
    if (missingRequired.length) {
      blockers.push({
        article_id: record.article_id,
        type: "missing_required_fields",
        fields: missingRequired
      });
    }
    warnings.push(...validateBestEffort(record, policy));
  }

  return {
    issue_id: issueId,
    publication_id: publicationId,
    issue_label: issueLabel,
    article_count: records.length,
    blockers,
    warnings,
    override_applied_count: records.filter((record) => record.editorial_override_applied === true).length,
    unresolved_warning_count: records.reduce((sum, record) => sum + ((record.effective_warnings || []).length), 0)
  };
}

export async function runContentContractTests() {
  const items = [
    summarizeIssue("readers_digest__12112025", "readers_digest", "12112025", { ordinal: "best_effort" }),
    summarizeIssue("barrons__09022026", "barrons", "09022026", { ordinal: "required" }),
    summarizeIssue("the_atlantic__012026", "the_atlantic", "012026", { ordinal: "required" }),
    summarizeIssue("the_economist__20260314", "the_economist", "20260314", { ordinal: "required" })
  ];
  const atlantic002 = loadNormalizedRecords("the_atlantic", "012026").find((item) => item.article_id === "art_the_atlantic_012026_002");
  const economist024 = loadNormalizedRecords("the_economist", "20260314").find((item) => item.article_id === "art_the_economist_20260314_024");

  const scenarioIndex = readJson(path.join(repoRoot, "mobile", "fixtures", "runtime", "scenarios", "index.json"));
  const mixedScenario = (scenarioIndex.items || []).find((item) => item.scenario_id === "data1c_three_release_mixed_preview");

  const report = {
    generated_at: new Date().toISOString(),
    status:
      items.every((item) => item.blockers.length === 0) &&
      atlantic002?.editorial_override_applied === true &&
      atlantic002?.effective_warnings?.length === 0 &&
      economist024?.section_label === "Asia"
        ? "passed"
        : "failed",
    items,
    mixed_scenario_present: Boolean(mixedScenario),
    mixed_scenario_article_count: mixedScenario?.imported_article_count || 0,
    override_composition_checks: {
      atlantic_002_override_applied: atlantic002?.editorial_override_applied === true,
      atlantic_002_effective_warnings: atlantic002?.effective_warnings || null,
      economist_024_section_label: economist024?.section_label || null
    }
  };

  writeJson(stageTest1OutputPath("content-contract-report.json"), report);

  if (report.status !== "passed") {
    throw new Error("TEST1_CONTENT_CONTRACT_FAILED");
  }

  return report;
}
