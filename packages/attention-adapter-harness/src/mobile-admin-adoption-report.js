export const mobileAdminAdoptionReportShapeName = "mobile_admin_adoption_plan";

export const mobileAdminAdoptionReportFieldNames = Object.freeze([
  "generated_at",
  "step",
  "mobile_plan",
  "admin_plan",
  "deferred_items",
  "coverage"
]);

export function createMobileAdminAdoptionReport({ surface_adoption = {} } = {}) {
  const mobile_domains = (surface_adoption.surface_reports || []).map((report) =>
    Object.freeze({
      domain_key: report.domain_key,
      supported_surfaces: report.mobile_surface_projection?.supported_mobile_surfaces || [],
      deferred_surfaces: report.mobile_surface_projection?.deferred_surfaces || []
    })
  );
  const admin_domains = (surface_adoption.surface_reports || []).map((report) =>
    Object.freeze({
      domain_key: report.domain_key,
      supported_surfaces: report.admin_surface_projection?.supported_admin_surfaces || [],
      deferred_surfaces: report.admin_surface_projection?.deferred_surfaces || []
    })
  );

  return Object.freeze({
    generated_at: new Date().toISOString(),
    step: "shared-step-08",
    mobile_plan: Object.freeze({
      planning_status: "frozen_for_step_08",
      domains: Object.freeze(mobile_domains),
      deferred_to_step_09: Object.freeze([
        "inbox_preview_surface_consumption",
        "page_shell_wiring",
        "screen_level_surface_adoption"
      ])
    }),
    admin_plan: Object.freeze({
      planning_status: "frozen_for_step_08",
      domains: Object.freeze(admin_domains),
      deferred_to_step_09: Object.freeze([
        "manual_rail_implementation",
        "admin_shell_wiring",
        "workflow_level_adoption"
      ])
    }),
    deferred_items: Object.freeze(["inbox_preview_surface", "manual_rail_surface"]),
    coverage: Object.freeze({
      mobile_facing_domains: surface_adoption.coverage?.mobile_facing_domains || 0,
      admin_preview_domains: surface_adoption.coverage?.admin_preview_domains || 0,
      family_only_pilots: surface_adoption.coverage?.family_only_pilots || 0
    })
  });
}
