export const manualRailSurfaceShapeName = "manual_rail_surface";

export const manualRailSurfaceFieldNames = Object.freeze([
  "surface_type",
  "domain_key",
  "rail_key",
  "status",
  "title",
  "description",
  "planning_only",
  "next_step"
]);

export function createManualRailSurface({
  domain_key,
  rail_key = "manual_rail_surface",
  status = "deferred",
  title = "Manual rail deferred",
  description = "Manual rail contract exists, but workflow migration remains deferred.",
  planning_only = true,
  next_step = "step_09"
} = {}) {
  return Object.freeze({
    surface_type: manualRailSurfaceShapeName,
    domain_key,
    rail_key,
    status,
    title,
    description,
    planning_only,
    next_step
  });
}
