# Shared Admin Adoption Plan

## Purpose

Step 08 freezes the first shared admin adoption planning for preview and registry surfaces without migrating any real admin workflow.

## Planning Status

- planning status: `frozen_for_step_08`
- workflow migration status: `not_started`
- real admin workflow migration: `false`

## Shared Admin Contracts Adopted In Step 08

| Surface | Step 08 status | Notes |
| --- | --- | --- |
| `resource_preview_surface` | builder-ready | three selected domains must emit preview-safe resource surfaces |
| `domain_admin_rail_map` | builder-ready | shared map of generated and deferred rails |
| `generated_resource_surface` | builder-ready | preview-safe generated sections only |
| `manual_rail_surface` | planning-only | contract exists but real rails stay deferred |
| `surface_registry` | builder-ready | shared preview/registry compatibility map only |

## Domain Plan

### `magazine`

- admin preview exposes shared projection plus issue-side retained extras as preview-only data
- generated registry rails may point at preview-safe resource sections
- manual rails stay deferred

### `youtube`

- admin preview exposes shared projection plus playback-side retained extras as preview-only data
- generated registry rails may point at preview-safe summary sections
- manual rails stay deferred

### `podcast`

- admin preview exposes shared projection plus family-backed route metadata and podcast-domain retained extras
- generated registry rails may point at preview-safe projection and retained-extra sections
- manual rails stay deferred

## Step 08 Adoption Deliverables

Step 08 delivers:

1. shared admin contracts
2. selected-domain admin preview builders
3. domain surface manifests with admin support metadata
4. shared registry and rail-map planning artifact

## Deferred To Step 09

Step 09 may evaluate:

1. first actual admin preview consumption
2. rail wiring into admin shells
3. manual rail implementation
4. shared admin workflow ownership decisions
