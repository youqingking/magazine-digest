import {
  audienceSegments,
  eventNames,
  paymentOrderStatuses,
  publishStatuses,
  readingModes,
  subscriptionStatuses
} from "./runtime-contract.js";

export const mobileShellContract = {
  readingModes,
  audienceSegments,
  publishStatuses,
  paymentOrderStatuses,
  subscriptionStatuses,
  eventNames,
  capabilityTracks: [
    "content_sync",
    "entitlement_check",
    "pricing_resolve",
    "experiment_assignment",
    "event_ingest"
  ]
};
