export const surfaceAdoptionReportShapeName = "surface_adoption_report";

export const surfaceAdoptionReportFieldNames = Object.freeze([
  "generated_at",
  "step",
  "domains",
  "coverage",
  "warnings"
]);

export function createSurfaceAdoptionReport({ surface_adoption = {} } = {}) {
  const domains = (surface_adoption.surface_reports || []).map((report) =>
    Object.freeze({
      domain_key: report.domain_key,
      route_type: report.route_type,
      family_kind: report.family_kind,
      adoption_status: report.adoption_status,
      supported_mobile_surfaces: report.mobile_surface_projection?.supported_mobile_surfaces || [],
      supported_admin_surfaces: report.admin_surface_projection?.supported_admin_surfaces || [],
      deferred_surfaces:
        report.mobile_surface_projection?.deferred_surfaces || report.admin_surface_projection?.deferred_surfaces || [],
      inbox_preview_planning_only:
        report.mobile_surface_projection?.surfaces?.inbox_preview_surface?.planning_only === true,
      manual_rail_planning_only:
        report.admin_surface_projection?.surfaces?.manual_rail_surface?.planning_only === true
    })
  );

  return Object.freeze({
    generated_at: new Date().toISOString(),
    step: "shared-step-08",
    domains: Object.freeze(domains),
    coverage: Object.freeze({
      mobile_facing_domains: surface_adoption.coverage?.mobile_facing_domains || 0,
      admin_preview_domains: surface_adoption.coverage?.admin_preview_domains || 0,
      family_only_pilots: surface_adoption.coverage?.family_only_pilots || 0
    }),
    warnings: Object.freeze([...(surface_adoption.warnings || [])])
  });
}
