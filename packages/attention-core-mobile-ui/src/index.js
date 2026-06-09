export const packageName = "attention-core-mobile-ui";

export const packageBoundary = Object.freeze({
  responsibleFor: [
    "ui primitive names",
    "shared presentation contract names",
    "state panel vocabulary",
    "theme and shell boundary metadata"
  ],
  doesNotInclude: [
    "business pages",
    "domain-specific page composition",
    "runtime orchestration"
  ],
  dependsOn: ["attention-core-contracts"],
  dependedOnBy: ["attention-core-harness"]
});

export const primitiveNames = [
  "state_panel",
  "section_shell",
  "content_card_shell",
  "quota_badge",
  "entitlement_badge",
  "notification_badge"
];

export const presentationContractNames = [
  "content_card_contract",
  "discovery_section_contract",
  "inbox_item_contract",
  "pricing_preview_contract"
];

export const statePanelTypes = [
  "loading",
  "empty",
  "error",
  "unavailable",
  "cached",
  "placeholder"
];

export const themeSurfaceNames = [
  "foundation_tokens",
  "spacing_scale",
  "state_tone_tokens",
  "shell_density_policy"
];

export const publicApi = [
  "packageBoundary",
  "primitiveNames",
  "presentationContractNames",
  "statePanelTypes",
  "themeSurfaceNames"
];
