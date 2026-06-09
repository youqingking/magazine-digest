import { assertProductKey, assertRequiredString } from "../guards/request-guards.mjs";

export function createFollowToggleSurface({ repository, runtimeConfig }) {
  return function followToggle(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const userId = assertRequiredString("user_id", request.user_id);
    const subjectType = assertRequiredString("subject_type", request.subject_type);
    const subjectKey = assertRequiredString("subject_key", request.subject_key);
    const desiredState = assertRequiredString("desired_state", request.desired_state);

    return repository.toggleFollow(
      productKey,
      userId,
      subjectType,
      subjectKey,
      desiredState,
      request.notify_level,
      "follow_catalog"
    );
  };
}
