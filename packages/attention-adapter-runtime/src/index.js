export const packageName = "attention-adapter-runtime";

export const packageBoundary = Object.freeze({
  responsibleFor: [
    "adapter route contracts",
    "adapter registry shape",
    "mapping diagnostics shape",
    "pilot mapping stubs"
  ],
  doesNotInclude: [
    "real source fetching",
    "domain workflow ownership",
    "shared core rewrites",
    "family layer rewrites"
  ],
  dependsOn: ["attention-core-contracts", "attention-family-contracts"],
  dependedOnBy: ["attention-adapter-harness"]
});

export { directRouteContractName, directRouteFieldNames, directRouteGuardrails, directRouteExample } from "./contracts/direct-route.js";
export { familyRouteContractName, familyRouteFieldNames, familyRouteGuardrails, familyRouteExample } from "./contracts/family-route.js";
export { mappingDiagnosticsShapeName, mappingDiagnosticsFieldNames, createMappingDiagnostics } from "./contracts/mapping-diagnostics.js";
export {
  adapterRegistryShapeName,
  adapterRouteTypes,
  adapterRegistryFieldNames,
  pilotAdapterRegistry,
  listAdapterRegistryEntries,
  findAdapterRegistryEntry
} from "./registry.js";
export { directMagazineSummaryPilot } from "./pilots/direct-magazine-summary.js";
export { directYoutubeSummaryPilot } from "./pilots/direct-youtube-summary.js";
export { familyPodcastTranscriptPilot } from "./pilots/family-podcast-transcript.js";
export { familySecFilingPilot } from "./pilots/family-sec-filing.js";

export const routeContractNames = ["direct_adapter_route", "family_adapter_route"];

export const pilotAdapterNames = [
  "direct-magazine-summary",
  "direct-youtube-summary",
  "family-podcast-transcript",
  "family-sec-filing"
];

export const publicApi = [
  "packageBoundary",
  "routeContractNames",
  "adapterRouteTypes",
  "adapterRegistryShapeName",
  "adapterRegistryFieldNames",
  "mappingDiagnosticsShapeName",
  "mappingDiagnosticsFieldNames",
  "pilotAdapterNames",
  "pilotAdapterRegistry",
  "listAdapterRegistryEntries",
  "findAdapterRegistryEntry"
];
