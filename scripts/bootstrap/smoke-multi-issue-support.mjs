import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { compareIssueMetaDescending, getIssueMeta } from "../../shared/utils/issue-meta.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "stage-test2");
const reportPath = path.join(outputDir, "multi-issue-support-report.json");

function writeReport(report) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
}

function assertCheck(checks, id, condition, details = {}) {
  checks[id] = {
    status: condition ? "passed" : "failed",
    ...details
  };
}

function sameSet(left = [], right = []) {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

async function main() {
  const checks = {};
  let fatalError = "";

  try {
    const issuesRegistry = JSON.parse(fs.readFileSync(path.join(repoRoot, "data", "real-content", "issues.json"), "utf8"));
    const runtimeBundle = JSON.parse(fs.readFileSync(path.join(repoRoot, "mobile", "fixtures", "runtime", "current", "runtime.bundle.json"), "utf8"));
    const { buildPublicationCoverage } = await import(pathToFileURL(path.join(repoRoot, "scripts", "ops", "lib", "taxonomy-lib.mjs")).href);
    const { buildOperatorConsoleSnapshot } = await import(pathToFileURL(path.join(repoRoot, "scripts", "ops", "lib", "operator-console-lib.mjs")).href);
    const { createLocalRuntimeApi } = await import(pathToFileURL(path.join(repoRoot, "mobile", "api", "local-runtime-api.js")).href);

    const publicationCoverage = buildPublicationCoverage();
    const coverageIssueIds = publicationCoverage.flatMap((publication) => (publication.issue_summaries || []).map((issue) => issue.issue_id)).sort();
    const registryIssueIds = (issuesRegistry.items || []).map((issue) => issue.issue_id).sort();
    assertCheck(
      checks,
      "taxonomy_coverage_tracks_issue_registry",
      sameSet(coverageIssueIds, registryIssueIds),
      {
        coverage_issue_count: coverageIssueIds.length,
        registry_issue_count: registryIssueIds.length
      }
    );

    const scienceCoverage = publicationCoverage.find((publication) => publication.publication_key === "science");
    assertCheck(
      checks,
      "taxonomy_coverage_includes_science_issue",
      Boolean(scienceCoverage?.issue_summaries?.some((issue) => issue.issue_id === "science__20260323")),
      {
        science_issue_count: scienceCoverage?.issue_count || 0
      }
    );

    const discoveryItems = runtimeBundle.discoveryCatalog?.items || [];
    const itemsMissingIssueMeta = discoveryItems.filter((item) => !item.issue_id || !item.issue_label || !item.issue_sort_key || !item.issue_display_label);
    assertCheck(
      checks,
      "runtime_bundle_discovery_items_have_issue_meta",
      discoveryItems.length > 0 && itemsMissingIssueMeta.length === 0,
      {
        discovery_count: discoveryItems.length,
        missing_issue_meta_count: itemsMissingIssueMeta.length
      }
    );

    const sortedIssueLabels = [
      getIssueMeta({ publication_id: "readers_digest", issue_label: "12112025" }),
      getIssueMeta({ publication_id: "readers_digest", issue_label: "01052026" }),
      getIssueMeta({ publication_id: "the_atlantic", issue_label: "012026" })
    ]
      .sort(compareIssueMetaDescending)
      .map((item) => item.issue_display_label);
    assertCheck(
      checks,
      "issue_sorting_handles_mixed_label_formats",
      sortedIssueLabels.join("|") === "2026.01.05|2026.01|2025.12.11",
      {
        sorted_issue_labels: sortedIssueLabels
      }
    );

    const api = createLocalRuntimeApi({
      fixtures: runtimeBundle
    });
    const targetIssueId = discoveryItems[0]?.issue_id || null;
    const searchByIssue = targetIssueId
      ? await api.searchContent({
          query: "",
          filters: {
            issue_id: targetIssueId
          },
          limit: 200
        })
      : { items: [], facets: {} };
    assertCheck(
      checks,
      "local_runtime_search_supports_issue_filter",
      Boolean(targetIssueId) &&
        (searchByIssue.items || []).length > 0 &&
        (searchByIssue.items || []).every((item) => item.issue_id === targetIssueId) &&
        (searchByIssue.facets?.issue_id || []).includes(targetIssueId),
      {
        target_issue_id: targetIssueId,
        result_count: (searchByIssue.items || []).length
      }
    );

    const homeDiscovery = await api.getHomeDiscovery({
      user_id: "user_local_stage_e0"
    });
    const homeIssueIds = Array.from(
      new Set(
        (homeDiscovery.modules || [])
          .flatMap((module) => module.items || [])
          .map((item) => item.issue_id)
          .filter(Boolean)
      )
    );
    assertCheck(
      checks,
      "local_runtime_home_discovery_preserves_issue_meta",
      homeIssueIds.length > 0,
      {
        issue_count_in_home: homeIssueIds.length
      }
    );

    const snapshot = buildOperatorConsoleSnapshot();
    const scienceSummary = (snapshot.content.publication_summaries || []).find((publication) => publication.publication_id === "science");
    assertCheck(
      checks,
      "operator_console_publication_summary_exposes_issue_timeline",
      Boolean(scienceSummary?.issue_summaries?.some((issue) => issue.issue_id === "science__20260323")),
      {
        publication_summary_count: (snapshot.content.publication_summaries || []).length
      }
    );

    const atlanticSummary = (snapshot.content.publication_summaries || []).find((publication) => publication.publication_id === "the_atlantic");
    assertCheck(
      checks,
      "operator_console_latest_issue_is_human_readable",
      atlanticSummary?.latest_issue_display_label === "2026.01",
      {
        latest_issue_display_label: atlanticSummary?.latest_issue_display_label || null
      }
    );
  } catch (error) {
    fatalError = error.message || String(error);
  }

  const report = {
    generated_at: new Date().toISOString(),
    status: !fatalError && Object.values(checks).every((check) => check.status === "passed") ? "passed" : "failed",
    fatal_error: fatalError,
    checks
  };

  writeReport(report);

  if (report.status !== "passed") {
    process.exit(1);
  }
}

main().catch((error) => {
  writeReport({
    generated_at: new Date().toISOString(),
    status: "failed",
    fatal_error: error.message || String(error),
    checks: {}
  });
  process.exit(1);
});
