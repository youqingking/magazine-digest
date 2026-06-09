# Adapter Registry

## Purpose

Step 04 freezes the minimal adapter registry shape used to describe adapter routes, pilot coverage, and diagnostics linkage.

The registry freezes metadata only. It does not integrate real sources.

References:

- `docs/ADAPTER_LAYER.md`
- `docs/ADAPTER_DIAGNOSTICS.md`
- `docs/PILOT_ADAPTER_SELECTION.md`

## Minimal Registry Shape

| Field | Required | Meaning |
| --- | --- | --- |
| `adapter_id` | yes | stable adapter entry id such as `direct-magazine-summary` |
| `adapter_route_type` | yes | `direct` or `family` |
| `source_kind` | yes | single-source kind owned by the adapter |
| `family_kind` | yes, nullable | frozen Step 03 family name when route type is `family`, otherwise `null` |
| `input_shape_name` | yes | frozen input shape label for examples and validators |
| `output_shape_name` | yes | frozen projection shape label for the adapter output |
| `diagnostics_shape_name` | yes | diagnostics shape name linked to mapping diagnostics |
| `supported_capabilities` | yes | capabilities the pilot adapter stub claims to cover |
| `unsupported_capabilities` | yes | capabilities explicitly out of scope for the pilot stub |
| `status` | yes | `pilot`, `draft`, or `stable` |
| `version` | yes | frozen adapter contract version string |

## Registry Rules

- registry shape is frozen in Step 04
- registry supports both `direct` and `family`
- registry entries describe route contracts and pilot metadata only
- registry does not perform source fetch, normalization jobs, or migration orchestration
- registry does not replace Step 02 or Step 03 package registries

## Public API Boundary

The Step 04 runtime package exposes registry metadata as:

- shape name
- field names
- route type names
- pilot registry entries
- simple lookup helpers

The public API does not expose:

- live adapter execution
- source credentials
- pipeline scheduling
- domain workflow ownership

## Pilot Coverage In Step 04

Frozen pilot registry entries:

1. `direct-magazine-summary`
2. `direct-youtube-summary`
3. `family-podcast-transcript`
4. `family-sec-filing`
