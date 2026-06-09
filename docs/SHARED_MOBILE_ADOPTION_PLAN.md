# Shared Mobile Adoption Plan

## Purpose

Step 08 freezes the first shared mobile adoption planning for the three selected domains without migrating any current mobile page.

## Planning Status

- planning status: `frozen_for_step_08`
- migration status: `not_started`
- page migration: `false`

## Shared Mobile Contracts Adopted In Step 08

| Surface | Step 08 status | Notes |
| --- | --- | --- |
| `content_list_surface` | builder-ready | three selected domains must project into this shape |
| `content_detail_surface` | builder-ready | three selected domains must project into this shape |
| `discovery_card_surface` | builder-ready | three selected domains must project into this shape |
| `inbox_preview_surface` | planning-only | contract exists but real consumption is deferred |
| `state_panel_surface_map` | builder-ready | shared planning and compatibility map only |

## Domain Plan

### `magazine`

- list/detail/discovery builders are direct-path shared presentation builders
- retained extras stay issue-aware and read-only
- inbox preview remains deferred

### `youtube`

- list/detail/discovery builders remain direct-path shared presentation builders
- retained extras stay playback-aware and read-only
- YouTube does not retro-fit into transcript family
- inbox preview remains deferred

### `podcast`

- list/detail/discovery builders remain family-backed on top of Step 07 stable projection
- retained extras stay split between transcript-side adapter extras and podcast-domain extras
- podcast product intelligence remains out of scope
- inbox preview remains deferred

## Step 08 Adoption Deliverables

Step 08 delivers:

1. shared mobile contracts
2. selected-domain mobile surface builders
3. domain surface manifests with mobile support metadata
4. adoption planning artifact for later mobile page consumption

## Deferred To Step 09

Step 09 may evaluate:

1. first actual mobile page consumption of `content_list_surface`
2. first actual mobile page consumption of `content_detail_surface`
3. first shared discovery module adoption
4. inbox preview rendering adoption
5. state-panel wiring into current mobile screens
