import {
  parseCrudCli,
  readIssuesRegistry,
  refreshCandidateOutputs,
  refreshObservabilityOutput,
  withCrudMutation
} from "./lib.mjs";
import { qualityPaths } from "../lib/quality-budget-lib.mjs";
import { readJson, writeJson } from "../../import/lib/content-pipeline.mjs";

function listMembership() {
  const budgets = readJson(qualityPaths.warningBudgets, { issue_budgets: {} });
  const issues = readIssuesRegistry().items || [];
  return {
    status: "ok",
    items: issues.map((issue) => ({
      issue_id: issue.issue_id,
      publication_id: issue.publication_id,
      issue_label: issue.issue_label,
      ...budgets.issue_budgets?.[issue.issue_id]
    }))
  };
}

async function updateMembership(payload) {
  const issueId = payload.issue_id;
  const budgets = readJson(qualityPaths.warningBudgets, { version: "stage-data2-v1", scenario_budgets: {}, issue_budgets: {} });
  const before = budgets.issue_budgets?.[issueId] || null;
  return withCrudMutation({
    entityType: "scenario_membership",
    entityId: issueId,
    action: payload.action_name || "edit",
    before,
    input: payload,
    mutation: async () => {
      const next = {
        ...(before || {}),
        classification: payload.classification ?? before?.classification ?? "release_ready",
        release_candidate_allowed: payload.release_candidate_allowed ?? before?.release_candidate_allowed ?? false,
        note: payload.note ?? before?.note ?? ""
      };
      budgets.issue_budgets[issueId] = next;
      writeJson(qualityPaths.warningBudgets, budgets);
      return {
        after: next,
        followUps: [refreshCandidateOutputs(), refreshObservabilityOutput()]
      };
    },
    followUpFactory: (result) => result.followUps
  });
}

async function rebuildCandidate() {
  return withCrudMutation({
    entityType: "scenario_membership",
    entityId: "data2_multi_publication_release_candidate",
    action: "rebuild_candidate",
    before: null,
    input: {},
    mutation: async () => ({
      after: { scenario_id: "data2_multi_publication_release_candidate" },
      followUps: [refreshCandidateOutputs(), refreshObservabilityOutput()]
    }),
    followUpFactory: (result) => result.followUps
  });
}

try {
  const { action, payload } = parseCrudCli(process.argv.slice(2));
  let result;

  switch (action) {
    case "list":
      result = listMembership();
      break;
    case "include":
      result = await updateMembership({
        ...payload,
        action_name: "include_issue",
        release_candidate_allowed: true,
        classification: payload.classification || "release_ready"
      });
      break;
    case "exclude":
      result = await updateMembership({
        ...payload,
        action_name: "exclude_issue",
        release_candidate_allowed: false,
        classification: payload.classification || "accepted_preview_only_anomaly"
      });
      break;
    case "edit":
      result = await updateMembership({
        ...payload,
        action_name: "edit"
      });
      break;
    case "rebuild":
      result = await rebuildCandidate();
      break;
    default:
      result = { status: "error", error: { code: "OPS5_UNKNOWN_ACTION", message: action } };
      break;
  }

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.log(JSON.stringify({ status: "error", error: { code: error.code || "OPS5_MEMBERSHIP_ERROR", message: error.message || String(error) } }, null, 2));
}
