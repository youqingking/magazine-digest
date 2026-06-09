import { runtimeGateway } from "./runtime-gateway.service.js";

export async function loadFollowCatalog(catalogType = "all") {
  return runtimeGateway.getFollowCatalog({
    catalog_type: catalogType
  });
}

export async function toggleFollowSubject(subjectType, subjectKey, desiredState, notifyLevel = "immediate") {
  return runtimeGateway.toggleFollow({
    subject_type: subjectType,
    subject_key: subjectKey,
    desired_state: desiredState,
    notify_level: notifyLevel
  });
}
