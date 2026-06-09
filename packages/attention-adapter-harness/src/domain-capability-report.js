import { resolveDomainCapabilities } from "../../attention-core-runtime/src/resolve-domain-capabilities.js";

export const domainCapabilityReportShapeName = "domain_capability_report";

export function createDomainCapabilityReport({
  manifests = [],
  family_only_pilots = []
} = {}) {
  const domains = manifests.map((manifest) =>
    resolveDomainCapabilities({
      manifest
    })
  );

  return Object.freeze({
    generated_at: new Date().toISOString(),
    step: "shared-step-07",
    domains: Object.freeze(domains),
    family_only_pilots: Object.freeze(
      family_only_pilots.map((pilot) =>
        Object.freeze({
          adapter_id: pilot.adapter_id,
          route_type: pilot.route_type,
          family_kind: pilot.family_kind,
          no_domain_upgrade: Boolean(pilot.no_domain_upgrade)
        })
      )
    ),
    coverage: Object.freeze({
      direct_domains: domains.filter((domain) => domain.route_type === "direct").length,
      family_backed_domains: domains.filter((domain) => domain.route_type === "family").length,
      family_only_pilots: family_only_pilots.filter((pilot) => pilot.no_domain_upgrade).length
    }),
    no_domain_upgrade: family_only_pilots.every((pilot) => pilot.no_domain_upgrade === true)
  });
}
