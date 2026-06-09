# Adapter Diagnostics

## Purpose

Step 04 freezes the minimal mapping diagnostics shape that each adapter route may produce.

Diagnostics are one of the core Step 04 outputs.

References:

- `docs/ADAPTER_LAYER.md`
- `docs/ADAPTER_REGISTRY.md`
- `docs/PILOT_MAPPING_EXAMPLES.md`

## Diagnostics Consumers

Diagnostics are for:

- architecture review
- migration planning
- validation and harness reporting

Diagnostics are not for final end users.

## Minimal Diagnostics Shape

| Field | Required | Meaning |
| --- | --- | --- |
| `adapter_id` | yes | registry-linked adapter id |
| `route_type` | yes | `direct` or `family` |
| `source_kind` | yes | single-source kind owned by the adapter |
| `family_kind` | yes, nullable | family name when route type is `family`, otherwise `null` |
| `mapped_shared_fields` | yes | shared-core fields or models mapped by the adapter |
| `mapped_family_fields` | yes | family-level fields or models mapped before shared projection; empty for direct path |
| `retained_domain_extras` | yes | source-native or domain-native fields intentionally kept outside shared and family |
| `unmapped_source_fields` | yes | source fields not covered by the pilot mapping |
| `unsupported_reason` | yes, nullable | why the unmapped or unsupported part remains out of scope |
| `warnings` | yes | diagnostic warnings for overfitting, leakage, or incomplete pilot coverage |
| `notes` | yes | human-readable notes for architecture and migration discussions |

## Diagnostics Rules

- diagnostics may be generated from pilot examples only
- diagnostics must not depend on live fetches or real ingestion runs
- diagnostics must make retained extras explicit
- diagnostics must make unmapped source fields explicit
- diagnostics must show whether mapping used direct path or family path

## Step 04 Guardrails

- do not treat diagnostics as user-facing product copy
- do not hide adapter-only leftovers
- do not use diagnostics to justify rewriting shared core or family layer in Step 04
