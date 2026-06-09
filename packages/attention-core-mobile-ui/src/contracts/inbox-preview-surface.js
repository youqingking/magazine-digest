function freezeArray(values = []) {
  return Object.freeze([...(Array.isArray(values) ? values : [])]);
}

export const inboxPreviewSurfaceShapeName = "inbox_preview_surface";

export const inboxPreviewSurfaceFieldNames = Object.freeze([
  "surface_type",
  "domain_key",
  "title",
  "body_preview",
  "action_ref",
  "status",
  "planning_only",
  "notes"
]);

export function createInboxPreviewSurface({
  domain_key,
  title = "",
  body_preview = "",
  action_ref = null,
  status = "ready",
  planning_only = false,
  notes = []
} = {}) {
  return Object.freeze({
    surface_type: inboxPreviewSurfaceShapeName,
    domain_key,
    title,
    body_preview,
    action_ref,
    status,
    planning_only,
    notes: freezeArray(notes)
  });
}

export function createDeferredInboxPreviewSurface({ domain_key, notes = [] } = {}) {
  return createInboxPreviewSurface({
    domain_key,
    title: "Inbox preview deferred",
    body_preview: "Reserved as a shared contract; actual mobile adoption remains deferred.",
    action_ref: null,
    status: "deferred",
    planning_only: true,
    notes
  });
}
