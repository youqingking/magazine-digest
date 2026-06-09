# Admin Surface Rules

## Purpose

Step 08 freezes the shared admin-facing preview and registry contracts that selected domains may project into.

These are planning and preview contracts, not real admin workflow migration.

## Shared Admin Surface Set

Step 08 currently carries:

1. `resource_preview_surface`
2. `domain_admin_rail_map`
3. `generated_resource_surface`
4. `manual_rail_surface`
5. `surface_registry`

## Scope Rule

Step 08 does:

- freeze preview surface names
- freeze registry and rail-map names
- freeze generated/manual rail planning

Step 08 does not do:

- migrate real admin workflows
- move business operations into shared admin
- implement source-specific moderation or ops flows
- create real CRUD ownership changes

## Builder Input Rule

Selected-domain admin preview builders may consume only:

1. Step 07 stable projection
2. retained extras sidecars
3. diagnostics sidecars

They must not consume:

1. raw adapter input directly
2. raw family-normalized shape directly
3. real operator workflow state

## Domain Mapping Rules

### `magazine`

- admin preview maps shared content projection into a preview-safe issue-aware resource surface
- generated sections may include retained issue packaging fields as read-only preview data
- manual rails remain deferred

### `youtube`

- admin preview maps shared content projection into a preview-safe video-summary resource surface
- generated sections may include playback-side retained extras as read-only preview data
- manual rails remain deferred

### `podcast`

- admin preview maps shared content projection into a preview-safe family-backed podcast resource surface
- generated sections may include podcast-domain retained extras and transcript-backed route metadata
- manual rails remain deferred

## Registry Rule

`surface_registry` is a shared contract map for:

- supported admin preview surfaces
- generated rails that can be registered safely
- manual rails that remain deferred

It is not a workflow executor.

## Step 09 Carryover

The following admin adoption remains for Step 09:

1. first actual shared admin preview consumption
2. domain-specific rail integration against real admin shells
3. manual rail implementation
4. workflow migration decisions and ownership split
