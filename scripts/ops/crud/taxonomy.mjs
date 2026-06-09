import {
  ensureCanonicalSection,
  ensureDiscoveryBucket,
  issueIdsForPublication,
  loadIssueById,
  parseCrudCli,
  readPublicationMap,
  rebuildTaxonomyForIssue,
  refreshCandidateOutputs,
  refreshObservabilityOutput,
  refreshTaxonomyOutputs,
  withCrudMutation,
  writePublicationMap
} from "./lib.mjs";
import { readJson } from "../../import/lib/content-pipeline.mjs";
import { data3Paths } from "../lib/taxonomy-lib.mjs";

function listTaxonomy(payload) {
  return {
    status: "ok",
    publication_id: payload.publication_id || null,
    unmapped: readJson(data3Paths.unmappedSectionsReport, { publications: [] })
  };
}

async function upsertMapping(payload) {
  const publicationId = payload.publication_id;
  const rawLabel = payload.raw_label;
  const mapFile = readPublicationMap(publicationId);
  const existing = (mapFile.mappings || []).find((item) => item.raw_label === rawLabel) || null;
  const entityId = `${publicationId}::${rawLabel}`;
  return withCrudMutation({
    entityType: "taxonomy",
    entityId,
    action: existing ? "edit" : "create",
    before: existing,
    input: payload,
    mutation: async () => {
      ensureDiscoveryBucket(payload.discovery_bucket_key, payload.discovery_bucket_label);
      ensureCanonicalSection(payload.canonical_section_key, payload.canonical_section_label, payload.discovery_bucket_key);
      const nextMapping = {
        raw_label: rawLabel,
        canonical_section_key: payload.canonical_section_key,
        publication_section_path: payload.publication_section_path || `${publicationId} > ${rawLabel}`,
        mapping_kind: payload.mapping_kind || "canonical",
        enabled: payload.enabled !== false
      };
      mapFile.mappings = (mapFile.mappings || []).filter((item) => item.raw_label !== rawLabel);
      mapFile.mappings.push(nextMapping);
      mapFile.mappings.sort((left, right) => left.raw_label.localeCompare(right.raw_label));
      writePublicationMap(publicationId, mapFile);
      const rebuilds = issueIdsForPublication(publicationId)
        .map((issueId) => loadIssueById(issueId))
        .filter(Boolean)
        .map((issue) => rebuildTaxonomyForIssue(issue.publication_id, issue.issue_label));
      return {
        after: nextMapping,
        followUps: [
          ...rebuilds.map((item) => ({ action: "refresh_issue_taxonomy", status: "ok", ...item })),
          refreshTaxonomyOutputs(),
          refreshCandidateOutputs(),
          refreshObservabilityOutput()
        ]
      };
    },
    followUpFactory: (result) => result.followUps
  });
}

async function disableMapping(payload) {
  return upsertMapping({
    ...payload,
    enabled: false
  });
}

try {
  const { action, payload } = parseCrudCli(process.argv.slice(2));
  let result;

  switch (action) {
    case "list":
      result = listTaxonomy(payload);
      break;
    case "create":
    case "edit":
      result = await upsertMapping(payload);
      break;
    case "disable":
      result = await disableMapping(payload);
      break;
    default:
      result = { status: "error", error: { code: "OPS5_UNKNOWN_ACTION", message: action } };
      break;
  }

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.log(JSON.stringify({ status: "error", error: { code: error.code || "OPS5_TAXONOMY_ERROR", message: error.message || String(error) } }, null, 2));
}
