# Domain Manifest Spec

## Purpose

Step 07 freezes the stable manifest contract used to describe selected-domain adoption without reopening Step 02 shared core, Step 03 family layer, Step 04 adapter layer, Step 05 registry integration, or Step 06 first adoption boundaries.

References:

- `docs/SELECTED_DOMAIN_ADOPTION.md`
- `docs/SHARED_RUNTIME_ADOPTION_RULES.md`
- `docs/PODCAST_DOMAIN_POSITIONING.md`
- `docs/STABLE_PROJECTION_RULES.md`

## Manifest Role

A domain manifest is a stable domain contract.

It is:

- the single manifest-driven runtime input for selected-domain adoption
- the stable metadata record for route type, fixture wiring, retained extras policy, and diagnostics entrypoints
- additive-only Step 07 architecture metadata

It is not:

- a temporary pilot note
- a one-off validation script payload
- a product page contract
- a business logic migration target
- a live source execution plan

## Required Fields

Each selected-domain manifest must provide at least the following fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `domain_key` | yes | stable selected-domain id such as `magazine`, `youtube`, `podcast` |
| `route_type` | yes | `direct` or `family` |
| `family_kind` | yes, nullable | frozen Step 03 family name when `route_type = family`, otherwise `null` |
| `adapter_ids` | yes | one or more adapter ids consumed by manifest-driven adoption |
| `primary_input_shape` | yes | stable input shape name for the primary fixture |
| `primary_shared_projection` | yes | stable shared projection name produced by the manifest path |
| `retained_extras_keys` | yes | retained extras key set grouped by `adapter_only_extras` and `domain_only_extras` |
| `diagnostics_entry` | yes | stable diagnostics builder entry name |
| `supported_capabilities` | yes | explicit capabilities covered by the Step 07 manifest path |
| `unsupported_capabilities` | yes | explicit capabilities kept out of Step 07 |
| `deferred_product_intelligence` | yes | deferral metadata only; records that product intelligence remains out of scope |
| `adoption_status` | yes | stable Step 07 adoption state |
| `fixture_paths` | yes | fixture file paths used by validation and manifest-driven adoption |
| `report_paths` | yes | report output file paths written by Step 07 validation |

## Optional Runtime Hooks

Step 07 manifests may also expose stable runtime hooks through package-owned modules:

- `runtime_hooks.project_shared_envelope`
- `runtime_hooks.build_retained_extras`
- `runtime_hooks.build_diagnostics`

These hooks exist so manifest-driven adoption can call stable projection modules instead of one-off Step 06 scripts.

## Field Rules

### `route_type` And `family_kind`

- `magazine` must declare `route_type = direct`
- `youtube` must declare `route_type = direct`
- `podcast` must declare `route_type = family`
- `podcast` must declare `family_kind = transcript_first_longform`

### `retained_extras_keys`

`retained_extras_keys` must remain explicit and structured:

```js
{
  adapter_only_extras: ["cue_id"],
  domain_only_extras: ["show_id"]
}
```

Rules:

- retained extras remain legal runtime adoption output
- retained extras do not become shared canonical models
- podcast must keep adapter-only and domain-only extras explicitly separated

### `deferred_product_intelligence`

This field records deferral status only.

It must not become a backdoor for product-intelligence implementation.

Allowed Step 07 usage:

- `deferred: true`
- `status: "deferred"`
- `notes: ["Step 07 keeps product intelligence out of runtime adoption."]`

Not allowed:

- product-intelligence output payloads
- reusable quote extraction logic
- cross-episode comparison logic
- summary generation logic

### `adoption_status`

Step 07 freezes these stable values:

- `selected_domain_manifest_frozen`
- `stable_projection_migrated`

Selected domains in Step 07 should use `stable_projection_migrated`.

## Access Rule

Manifests must be read through package public APIs in `attention-core-runtime` and `attention-adapter-runtime`.

They must not be reconstructed by ad hoc validation scripts or scattered object assembly.

## Minimal Example

```js
{
  domain_key: "magazine",
  route_type: "direct",
  family_kind: null,
  adapter_ids: ["direct-magazine-summary"],
  primary_input_shape: "magazine_summary_input",
  primary_shared_projection: "shared_content_projection",
  retained_extras_keys: {
    adapter_only_extras: [],
    domain_only_extras: ["issue_id", "issue_label", "start_page", "print_taxonomy_path", "cover_slot"]
  },
  diagnostics_entry: "build-magazine-diagnostics",
  supported_capabilities: ["stable_manifest", "shared_projection", "retained_extras", "diagnostics"],
  unsupported_capabilities: ["ui_migration", "ingestion", "business_logic_migration", "real_source_execution"],
  deferred_product_intelligence: {
    deferred: true,
    status: "deferred"
  },
  adoption_status: "stable_projection_migrated",
  fixture_paths: {
    input: "domains/magazine-domain/fixtures/direct-magazine-summary.input.json",
    shared_projection: "domains/magazine-domain/fixtures/direct-magazine-summary.shared.json",
    diagnostics: "domains/magazine-domain/fixtures/direct-magazine-summary.diagnostics.json"
  },
  report_paths: {
    validation_report: "output/shared-step-07/validation-report.json",
    capability_report: "output/shared-step-07/domain-capability-report.json"
  }
}
```
