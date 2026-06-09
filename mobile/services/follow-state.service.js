import {
  buildUiStateCacheKey,
  getCachedValue,
  setCachedValue
} from "./cache.service.js";

const FOLLOW_STATE_SCOPE = "follow-state-v1";

function buildFollowStateCacheKey(userId = "user_local_stage_e0") {
  return buildUiStateCacheKey(`${FOLLOW_STATE_SCOPE}:${userId}`);
}

function normalizeState(cached = {}) {
  return {
    subjects: cached && typeof cached.subjects === "object" && cached.subjects ? cached.subjects : {},
    updated_at: cached.updated_at || null
  };
}

function buildFollowKey(subjectType, subjectKey) {
  return `${subjectType}:${subjectKey}`;
}

function readState(userId) {
  return normalizeState(getCachedValue(buildFollowStateCacheKey(userId)) || {});
}

function writeState(userId, state) {
  setCachedValue(buildFollowStateCacheKey(userId), {
    subjects: state.subjects || {},
    updated_at: state.updated_at || new Date().toISOString()
  });
}

export function listPersistedFollows(userId) {
  return Object.values(readState(userId).subjects || {}).filter((item) => item && item.status === "active");
}

export function buildPersistedFollowSet(userId) {
  return new Set(
    listPersistedFollows(userId)
      .map((item) => buildFollowKey(item.subject_type, item.subject_key))
      .filter(Boolean)
  );
}

export function applyPersistedFollowState(subjects = [], userId) {
  const followedKeys = buildPersistedFollowSet(userId);
  return subjects
    .map((subject) => {
      const subjectType = subject.publication_key ? "publication" : "topic_tag";
      const subjectKey = subject.publication_key || subject.tag_key || null;
      return {
        ...subject,
        is_followed: subjectKey ? followedKeys.has(buildFollowKey(subjectType, subjectKey)) : false
      };
    })
    .sort((left, right) => Number(Boolean(right.is_followed)) - Number(Boolean(left.is_followed)));
}

export function matchesFollowSelectionForContent(item = {}, followedSet = new Set()) {
  if (!followedSet || followedSet.size === 0) {
    return false;
  }

  const publicationKey = item.publication_key || item.publication_id || null;
  if (publicationKey && followedSet.has(buildFollowKey("publication", publicationKey))) {
    return true;
  }

  return (item.tags || []).some((tag) => followedSet.has(buildFollowKey("topic_tag", tag)));
}

export function togglePersistedFollowSubject(userId, subjectType, subjectKey, desiredState, notifyLevel = "immediate") {
  const state = readState(userId);
  const key = buildFollowKey(subjectType, subjectKey);
  const existing = state.subjects[key] || null;
  const now = new Date().toISOString();
  const next =
    desiredState === "followed"
      ? {
          _id: existing?._id || `follow_${subjectType}_${subjectKey}_${userId}`,
          product_key: existing?.product_key || "demo_cn_content",
          user_id: userId,
          subject_type: subjectType,
          subject_key: subjectKey,
          status: "active",
          notify_level: notifyLevel,
          source_surface: "follow_catalog",
          created_at: existing?.created_at || now,
          updated_at: now
        }
      : {
          _id: existing?._id || `follow_${subjectType}_${subjectKey}_${userId}`,
          product_key: existing?.product_key || "demo_cn_content",
          user_id: userId,
          subject_type: subjectType,
          subject_key: subjectKey,
          status: "removed",
          notify_level: "mute",
          source_surface: "follow_catalog",
          created_at: existing?.created_at || now,
          removed_at: now,
          updated_at: now
        };

  state.subjects[key] = next;
  state.updated_at = now;
  writeState(userId, state);
  return next;
}

export function getFollowStateSummary(userId) {
  const items = listPersistedFollows(userId);
  return {
    active_count: items.length,
    publication_count: items.filter((item) => item.subject_type === "publication").length,
    topic_count: items.filter((item) => item.subject_type === "topic_tag").length,
    items
  };
}
