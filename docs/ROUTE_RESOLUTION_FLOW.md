# Route Resolution Flow

## Purpose

Step 05 freezes the route-resolution skeleton used by core runtime to interpret Step 04 pilot registry entries.

References:

- `docs/PILOT_REGISTRY_INTEGRATION.md`
- `docs/ADAPTER_ROUTING_RULES.md`
- `docs/PODCAST_DOMAIN_POSITIONING.md`

## Inputs

Route resolver consumes metadata only:

- `adapter_id`
- `route_type`
- `family_kind`
- `source_kind`
- registry entry

It does not execute real source fetching or parsing.

## Outputs

Route resolver emits:

- `resolved_path`
- `expected_intermediate_shape`
- `expected_shared_projection`
- `diagnostics_hooks`

## Direct Path

Resolved flow:

`source adapter -> shared core`

Expected output:

- `resolved_path = ["source_adapter", "shared_core"]`
- `expected_intermediate_shape = null`
- `expected_shared_projection = shared projection name from registry entry`

Typical Step 05 domains:

- `magazine-domain`
- `youtube-domain`

## Family Path

Resolved flow:

`source adapter -> family normalizer -> shared core`

Expected output:

- `resolved_path = ["source_adapter", "family_normalizer", "shared_core"]`
- `expected_intermediate_shape = family-normalized shape name`
- `expected_shared_projection = shared projection name from registry entry`

Typical Step 05 domain:

- `podcast-domain`

## Mismatch Diagnostics

Resolver must emit explicit diagnostics when:

- `route_type = direct` but `family_kind` is present
- `route_type = family` but `family_kind` is empty
- `route_type = family` but `family_kind` is not one of the frozen Step 03 family names
- registry entry route fields disagree with the explicit input

## Shared-Facing Runtime Surface Map

Core runtime may only publish a shared-facing map containing:

- selected path
- normalized shape name if any
- shared projection name
- diagnostics hook names

It must not publish:

- raw source field semantics as shared runtime truth
- parser traces
- product-domain business heuristics
