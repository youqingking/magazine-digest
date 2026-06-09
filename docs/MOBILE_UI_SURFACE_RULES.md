# Mobile UI Surface Rules

## Purpose

Step 08 freezes the shared mobile-facing presentation contracts that selected domains may project into.

These are shared presentation contracts, not product page migrations.

## Shared Mobile Surface Set

Step 08 currently carries:

1. `content_list_surface`
2. `content_detail_surface`
3. `discovery_card_surface`
4. `inbox_preview_surface`
5. `state_panel_surface_map`

## Scope Rule

Step 08 does:

- freeze contract names
- freeze builder inputs and outputs
- freeze adoption planning for shared mobile surfaces

Step 08 does not do:

- migrate existing mobile pages
- rewire navigation
- move page ownership into `attention-core-mobile-ui`
- add real runtime fetch orchestration

## Builder Input Rule

Selected-domain mobile surface builders may consume only:

1. Step 07 stable projection
2. retained extras sidecars
3. diagnostics sidecars

They must not consume:

1. raw adapter input directly
2. raw family-normalized shape directly
3. page-local business logic

## Domain Mapping Rules

### `magazine`

- `content_list_surface` maps from `ContentListItem`
- `content_detail_surface` maps from `ContentDetailEnvelope`
- `discovery_card_surface` maps from shared list/detail shell plus curated issue-side retained extras
- retained extras used for mobile decisions remain issue-side only:
  - `issue_label`
  - `start_page`
  - `cover_slot`
  - `print_taxonomy_path`

### `youtube`

- `content_list_surface` maps from `ContentListItem`
- `content_detail_surface` maps from `ContentDetailEnvelope`
- `discovery_card_surface` maps from shared list/detail shell plus playback-side retained extras
- retained extras used for mobile decisions remain source-side only:
  - `duration_seconds`
  - `watch_or_skip`
  - `input_quality_tier`
  - `timestamp_anchors`

### `podcast`

- `content_list_surface` is derived from Step 07 shared detail projection plus retained extras
- `content_detail_surface` maps from `ContentDetailEnvelope`
- `discovery_card_surface` maps from shared detail shell plus podcast-domain retained extras
- `podcast-domain` remains family-backed and must not bypass `transcript_first_longform`

## Inbox Preview Rule

`inbox_preview_surface` exists as a shared contract in Step 08, but current adoption stays planning-only.

Rules:

- domains may declare inbox preview as deferred
- shared mobile planning may reserve the contract now
- no existing inbox page or notification workflow is migrated in Step 08

## State Surface Map Rule

`state_panel_surface_map` freezes how a domain advertises:

- supported mobile surfaces
- deferred mobile surfaces
- shared state panel vocabulary

It is a planning and compatibility asset, not a page runtime.

## Step 09 Carryover

The following mobile adoption remains for Step 09:

1. first actual page-level consumption of the shared surface contracts
2. inbox preview rendering adoption
3. page shell wiring
4. route-level state ownership and real screen integration
