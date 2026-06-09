import { directMagazineSummaryPilot } from "./direct-magazine-summary.js";
import { directYoutubeSummaryPilot } from "./direct-youtube-summary.js";
import { familyPodcastTranscriptPilot } from "./family-podcast-transcript.js";
import { familySecFilingPilot } from "./family-sec-filing.js";
import { buildPilotRegistryEntries } from "../registry-entry-builder.js";

export const integratedPilots = Object.freeze([
  directMagazineSummaryPilot,
  directYoutubeSummaryPilot,
  familyPodcastTranscriptPilot,
  familySecFilingPilot
]);

export const integratedPilotRegistry = Object.freeze(buildPilotRegistryEntries(integratedPilots));

export function getIntegratedPilotById(adapterId) {
  return integratedPilots.find((pilot) => pilot.adapter_id === adapterId) || null;
}

export function getIntegratedRegistryEntryById(adapterId) {
  return integratedPilotRegistry.find((entry) => entry.adapter_id === adapterId) || null;
}
