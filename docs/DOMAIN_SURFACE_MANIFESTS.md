# Domain Surface Manifests

## Purpose

Step 08 adds a second-layer manifest for selected-domain surfaces.

This layer sits on top of the Step 07 stable domain manifest.

- Step 07 domain manifest freezes stable domain adoption metadata
- Step 08 domain surface manifest freezes shared mobile-facing and admin-facing surface metadata
- Step 08 does not replace or weaken the Step 07 manifest contract

## Required Manifest Shape

Each selected-domain surface manifest must provide at least:

| Field | Required | Meaning |
| --- | --- | --- |
| `domain_key` | yes | stable selected-domain id |
| `route_type` | yes | `direct` or `family` |
| `family_kind` | yes, nullable | frozen Step 03 family kind when family-backed |
| `list_surface_builder` | yes | stable builder entry name for `content_list_surface` |
| `detail_surface_builder` | yes | stable builder entry name for `content_detail_surface` |
| `discovery_card_builder` | yes | stable builder entry name for `discovery_card_surface` |
| `admin_preview_builder` | yes | stable builder entry name for `resource_preview_surface` |
| `supported_mobile_surfaces` | yes | shared mobile presentation contracts currently supported by this domain |
| `supported_admin_surfaces` | yes | shared admin preview and registry contracts currently supported by this domain |
| `deferred_surfaces` | yes | explicitly deferred shared surfaces and rails |
| `retained_extras_visibility_rules` | yes | surface-by-surface visibility rules for retained extras |
| `diagnostics_entry` | yes | stable diagnostics builder entry inherited from Step 07 projection path |
| `adoption_status` | yes | Step 08 surface adoption state |

## Boundary Rules

1. Step 08 surface manifest is additive-only and layered above Step 07.
2. Surface manifests may reference Step 07 stable projection modules, retained extras policy, and diagnostics only.
3. Surface manifests must not reconstruct raw adapter input as shared UI/admin truth.
4. Surface manifests must not introduce page routes, workflow ownership, or real admin operations.
5. Retained extras remain explicit sidecar data and must not backfill shared canonical models.

## Podcast Rule

`podcast-domain` surface manifest must remain explicitly family-backed:

- `route_type = family`
- `family_kind = transcript_first_longform`

This marks the domain as family-backed at the surface layer as well as the Step 07 manifest layer.

## Selected Domain Surface Coverage

### `magazine`

- route type: `direct`
- mobile support:
  - `content_list_surface`
  - `content_detail_surface`
  - `discovery_card_surface`
  - `state_panel_surface_map`
- admin support:
  - `resource_preview_surface`
  - `domain_admin_rail_map`
  - `generated_resource_surface`
  - `surface_registry`
- deferred:
  - `inbox_preview_surface`
  - `manual_rail_surface`

### `youtube`

- route type: `direct`
- mobile support:
  - `content_list_surface`
  - `content_detail_surface`
  - `discovery_card_surface`
  - `state_panel_surface_map`
- admin support:
  - `resource_preview_surface`
  - `domain_admin_rail_map`
  - `generated_resource_surface`
  - `surface_registry`
- deferred:
  - `inbox_preview_surface`
  - `manual_rail_surface`

### `podcast`

- route type: `family`
- family kind: `transcript_first_longform`
- mobile support:
  - `content_list_surface`
  - `content_detail_surface`
  - `discovery_card_surface`
  - `state_panel_surface_map`
- admin support:
  - `resource_preview_surface`
  - `domain_admin_rail_map`
  - `generated_resource_surface`
  - `surface_registry`
- deferred:
  - `inbox_preview_surface`
  - `manual_rail_surface`

## Retained Extras Visibility

Step 08 keeps retained extras visible only through explicit manifest rules.

Rules:

1. mobile list and discovery surfaces should expose only lightweight retained extras
2. mobile detail surface may expose a broader but still curated retained-extra subset
3. admin preview may expose a wider retained-extra subset for inspection and planning
4. deferred surfaces may reference retained extras in planning only, not in migrated workflow logic

## Adoption Status

Step 08 freezes the following selected-domain surface status:

- `second_migration_slice_frozen`

This status means:

- stable projection remains owned by Step 07
- surface builders are frozen for shared mobile/admin contracts
- real page migration and real admin workflow migration are still not started
